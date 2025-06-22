import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, inArray, isNotNull, ne } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import {
  actions,
  userActions,
  users,
  challenges,
  campaigns,
  type Action,
  type NewAction,
  type UserAction,
} from '../db/schema';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Injectable()
export class ActionsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createActionDto: CreateActionDto): Promise<Action> {
    const { challengeId, order, ...rest } = createActionDto;

    // Verify challenge exists
    const [challenge] = await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge) {
      throw new NotFoundException(`Défi avec l'ID ${challengeId} non trouvé`);
    }

    // Check if order is already taken for this challenge
    const [existingAction] = await this.db.db
      .select()
      .from(actions)
      .where(
        and(eq(actions.challengeId, challengeId), eq(actions.order, order)),
      );

    if (existingAction) {
      throw new BadRequestException(
        `Une action existe déjà à la position ${order} pour ce défi`,
      );
    }

    // Check if challenge already has 6 actions (max)
    const existingActions = await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challengeId));

    if (existingActions.length >= 6) {
      throw new BadRequestException(
        'Un défi ne peut pas contenir plus de 6 actions',
      );
    }

    const newAction: NewAction = {
      challengeId,
      order,
      ...rest,
    };

    const [action] = await this.db.db
      .insert(actions)
      .values(newAction)
      .returning();

    return action;
  }

  async findAll(): Promise<Action[]> {
    return await this.db.db.select().from(actions);
  }

  async findByChallenge(challengeId: number): Promise<Action[]> {
    return await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, challengeId))
      .orderBy(actions.order);
  }

  async findOne(id: number): Promise<Action> {
    const [action] = await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.id, id));

    if (!action) {
      throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
    }

    return action;
  }

  async update(id: number, updateActionDto: UpdateActionDto): Promise<Action> {
    await this.findOne(id); // Check if exists

    // If updating order, check for conflicts
    if (updateActionDto.order) {
      const action = await this.findOne(id);
      const [existingAction] = await this.db.db
        .select()
        .from(actions)
        .where(
          and(
            eq(actions.challengeId, action.challengeId),
            eq(actions.order, updateActionDto.order),
            ne(actions.id, id), // Exclude current action
          ),
        );

      if (existingAction) {
        throw new BadRequestException(
          `Une action existe déjà à la position ${updateActionDto.order} pour ce défi`,
        );
      }
    }

    const updateData = {
      ...updateActionDto,
      updatedAt: new Date(),
    };

    const [updatedAction] = await this.db.db
      .update(actions)
      .set(updateData)
      .where(eq(actions.id, id))
      .returning();

    return updatedAction;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists

    // Check if action has user actions
    const [userAction] = await this.db.db
      .select()
      .from(userActions)
      .where(eq(userActions.actionId, id))
      .limit(1);

    if (userAction) {
      throw new BadRequestException(
        'Impossible de supprimer une action assignée aux utilisateurs',
      );
    }

    await this.db.db.delete(actions).where(eq(actions.id, id));
  }

  async assignActionToUsers(
    actionId: number,
    userIds: number[],
  ): Promise<UserAction[]> {
    const action = await this.findOne(actionId);

    const assignments = userIds.map((userId) => ({
      actionId,
      userId,
      challengeId: action.challengeId,
    }));

    return await this.db.db.insert(userActions).values(assignments).returning();
  }

  async getUserActionsForChallenge(
    userId: number,
    challengeId: number,
  ): Promise<any[]> {
    return await this.db.db
      .select({
        id: userActions.id,
        userId: userActions.userId,
        actionId: userActions.actionId,
        challengeId: userActions.challengeId,
        completed: userActions.completed,
        completedAt: userActions.completedAt,
        proofUrl: userActions.proofUrl,
        action: {
          id: actions.id,
          title: actions.title,
          description: actions.description,
          type: actions.type,
          order: actions.order,
          pointsValue: actions.pointsValue,
        },
      })
      .from(userActions)
      .innerJoin(actions, eq(userActions.actionId, actions.id))
      .where(
        and(
          eq(userActions.userId, userId),
          eq(userActions.challengeId, challengeId),
        ),
      )
      .orderBy(actions.order);
  }

  async getUserActionsForDate(userId: number, date: string): Promise<any[]> {
    return await this.db.db
      .select({
        id: userActions.id,
        completed: userActions.completed,
        completedAt: userActions.completedAt,
        proofUrl: userActions.proofUrl,
        challenge: {
          id: challenges.id,
          title: challenges.title,
          date: challenges.date,
        },
        action: {
          id: actions.id,
          title: actions.title,
          description: actions.description,
          type: actions.type,
          order: actions.order,
          pointsValue: actions.pointsValue,
        },
      })
      .from(userActions)
      .innerJoin(actions, eq(userActions.actionId, actions.id))
      .innerJoin(challenges, eq(userActions.challengeId, challenges.id))
      .where(and(eq(userActions.userId, userId), eq(challenges.date, date)))
      .orderBy(actions.order);
  }

  async completeUserAction(
    userActionId: number,
    proofUrl?: string,
  ): Promise<UserAction> {
    const [userAction] = await this.db.db
      .update(userActions)
      .set({
        completed: true,
        completedAt: new Date(),
        proofUrl,
        updatedAt: new Date(),
      })
      .where(eq(userActions.id, userActionId))
      .returning();

    if (!userAction) {
      throw new NotFoundException(
        `UserAction avec l'ID ${userActionId} non trouvée`,
      );
    }

    return userAction;
  }

  async getGlobalProgress(): Promise<any> {
    try {
      // Get total members (FBO role)
      const totalMembers = await this.db.db
        .select()
        .from(users)
        .where(eq(users.role, 'fbo'));

      // Get all user actions
      const allUserActions = await this.db.db.select().from(userActions);

      // Get completed actions
      const completedActions = await this.db.db
        .select()
        .from(userActions)
        .where(eq(userActions.completed, true));

      // Get manager stats
      const managers = await this.db.db
        .select()
        .from(users)
        .where(eq(users.role, 'manager'));

      const managerStats = await Promise.all(
        managers.map(async (manager) => {
          // Get team members for this manager
          const teamMembers = await this.db.db
            .select()
            .from(users)
            .where(
              and(
                eq(users.role, 'fbo'),
                eq(users.managerId, manager.id),
                isNotNull(users.managerId),
              ),
            );

          const teamUserIds = teamMembers.map((m) => m.id);

          let teamTotalActions = [];
          let teamCompletedActions = [];

          if (teamUserIds.length > 0) {
            teamTotalActions = await this.db.db
              .select()
              .from(userActions)
              .where(inArray(userActions.userId, teamUserIds));

            teamCompletedActions = await this.db.db
              .select()
              .from(userActions)
              .where(
                and(
                  inArray(userActions.userId, teamUserIds),
                  eq(userActions.completed, true),
                ),
              );
          }

          const completionRate =
            teamTotalActions.length > 0
              ? (teamCompletedActions.length / teamTotalActions.length) * 100
              : 0;

          return {
            managerId: manager.id,
            managerName: manager.name,
            teamSize: teamMembers.length,
            completedActions: teamCompletedActions.length,
            totalActions: teamTotalActions.length,
            completionRate,
          };
        }),
      );

      const globalCompletionRate =
        allUserActions.length > 0
          ? (completedActions.length / allUserActions.length) * 100
          : 0;

      return {
        totalMembers: totalMembers.length,
        totalActions: allUserActions.length,
        completedActions: completedActions.length,
        globalCompletionRate,
        managerStats,
      };
    } catch (error) {
      console.error('[ERROR] Error in getGlobalProgress:', error);
      throw error;
    }
  }

  async getTeamProgress(managerId: number): Promise<any[]> {
    // Get team members for this manager
    const teamMembers = await this.db.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'fbo'),
          eq(users.managerId, managerId),
          isNotNull(users.managerId),
        ),
      );

    const teamProgress = await Promise.all(
      teamMembers.map(async (member) => {
        const totalUserActions = await this.db.db
          .select()
          .from(userActions)
          .where(eq(userActions.userId, member.id));

        const completedUserActions = await this.db.db
          .select()
          .from(userActions)
          .where(
            and(
              eq(userActions.userId, member.id),
              eq(userActions.completed, true),
            ),
          );

        const percentage =
          totalUserActions.length > 0
            ? (completedUserActions.length / totalUserActions.length) * 100
            : 0;

        return {
          userId: member.id,
          userName: member.name,
          totalActions: totalUserActions.length,
          completedActions: completedUserActions.length,
          percentage,
        };
      }),
    );

    return teamProgress;
  }

  async getUserCampaignStats(userId: number, campaignId: number): Promise<any> {
    // Vérifier que la campagne existe
    const [campaign] = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException(
        `Campagne avec l'ID ${campaignId} non trouvée`,
      );
    }

    // Récupérer tous les défis de la campagne
    const campaignChallenges = await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, campaignId));

    // Récupérer toutes les actions de ces défis
    const challengeIds = campaignChallenges.map((c) => c.id);
    const campaignActions =
      challengeIds.length > 0
        ? await this.db.db
            .select()
            .from(actions)
            .where(inArray(actions.challengeId, challengeIds))
        : [];

    // Récupérer les actions utilisateur pour ces défis
    const userCampaignActions =
      challengeIds.length > 0
        ? await this.db.db
            .select()
            .from(userActions)
            .where(
              and(
                eq(userActions.userId, userId),
                inArray(userActions.challengeId, challengeIds),
              ),
            )
        : [];

    const completedActions = userCampaignActions.filter((ua) => ua.completed);
    const totalPoints = completedActions.reduce((sum, ua) => {
      const action = campaignActions.find((a) => a.id === ua.actionId);
      return sum + (action?.pointsValue || 0);
    }, 0);

    // Calculer le nombre de défis complétés (100% des actions)
    const challengeCompletionStats = campaignChallenges.map((challenge) => {
      const challengeActions = campaignActions.filter(
        (a) => a.challengeId === challenge.id,
      );
      const challengeUserActions = userCampaignActions.filter(
        (ua) => ua.challengeId === challenge.id && ua.completed,
      );
      const isCompleted =
        challengeActions.length > 0 &&
        challengeUserActions.length === challengeActions.length;

      return {
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeDate: challenge.date,
        totalActions: challengeActions.length,
        completedActions: challengeUserActions.length,
        isCompleted,
        percentage:
          challengeActions.length > 0
            ? (challengeUserActions.length / challengeActions.length) * 100
            : 0,
      };
    });

    const completedChallenges = challengeCompletionStats.filter(
      (c) => c.isCompleted,
    ).length;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
      stats: {
        totalChallenges: campaignChallenges.length,
        completedChallenges,
        challengeCompletionRate:
          campaignChallenges.length > 0
            ? (completedChallenges / campaignChallenges.length) * 100
            : 0,
        totalActions: campaignActions.length,
        completedActions: completedActions.length,
        actionCompletionRate:
          campaignActions.length > 0
            ? (completedActions.length / campaignActions.length) * 100
            : 0,
        totalPointsEarned: totalPoints,
        maxPossiblePoints: campaignActions.reduce(
          (sum, a) => sum + a.pointsValue,
          0,
        ),
      },
      challengeDetails: challengeCompletionStats,
    };
  }

  async getUserStreaks(userId: number): Promise<any> {
    // Récupérer toutes les actions utilisateur complétées, triées par date
    const completedUserActions = await this.db.db
      .select({
        id: userActions.id,
        completedAt: userActions.completedAt,
        challengeId: userActions.challengeId,
        challengeDate: challenges.date,
      })
      .from(userActions)
      .innerJoin(challenges, eq(userActions.challengeId, challenges.id))
      .where(
        and(
          eq(userActions.userId, userId),
          eq(userActions.completed, true),
          isNotNull(userActions.completedAt),
        ),
      )
      .orderBy(challenges.date);

    // Grouper par date de défi pour éviter les doublons
    const uniqueDates = [
      ...new Set(completedUserActions.map((ua) => ua.challengeDate)),
    ].sort();

    // Calculer la streak actuelle
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Calculer les streaks
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1] as string);
        const currentDate = new Date(uniqueDates[i] as string);
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      // Calculer la streak actuelle (doit inclure aujourd'hui ou hier)
      const currentDate = uniqueDates[i];
      if (currentDate === today || currentDate === yesterday) {
        currentStreak = tempStreak;
      }
    }

    // Si la dernière activité n'était ni aujourd'hui ni hier, la streak actuelle est 0
    if (uniqueDates.length > 0) {
      const lastActivityDate = uniqueDates[uniqueDates.length - 1];
      if (lastActivityDate !== today && lastActivityDate !== yesterday) {
        currentStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: uniqueDates.length,
      lastActivityDate:
        uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null,
    };
  }

  async getUserBadges(userId: number): Promise<any[]> {
    const userStats = await this.getUserStreaks(userId);
    const completedActions = await this.db.db
      .select()
      .from(userActions)
      .where(
        and(eq(userActions.userId, userId), eq(userActions.completed, true)),
      );

    const badges = [];

    // Badge "Premier pas"
    if (completedActions.length >= 1) {
      badges.push({
        id: 'first_action',
        name: 'Premier pas',
        description: 'Première action complétée',
        icon: '🎯',
        color: 'primary',
        earnedAt: completedActions[0]?.completedAt,
      });
    }

    // Badge "Productif"
    if (completedActions.length >= 10) {
      badges.push({
        id: 'productive',
        name: 'Productif',
        description: '10 actions complétées',
        icon: '💪',
        color: 'success',
        earnedAt: completedActions[9]?.completedAt,
      });
    }

    // Badge "Expert"
    if (completedActions.length >= 50) {
      badges.push({
        id: 'expert',
        name: 'Expert',
        description: '50 actions complétées',
        icon: '🏆',
        color: 'warning',
        earnedAt: completedActions[49]?.completedAt,
      });
    }

    // Badge "Régulier"
    if (userStats.currentStreak >= 3) {
      badges.push({
        id: 'consistent',
        name: 'Régulier',
        description: '3 jours consécutifs',
        icon: '🔥',
        color: 'danger',
        earnedAt: new Date().toISOString(),
      });
    }

    // Badge "Déterminé"
    if (userStats.currentStreak >= 7) {
      badges.push({
        id: 'determined',
        name: 'Déterminé',
        description: '7 jours consécutifs',
        icon: '⚡',
        color: 'secondary',
        earnedAt: new Date().toISOString(),
      });
    }

    // Badge "Champion"
    if (userStats.longestStreak >= 14) {
      badges.push({
        id: 'champion',
        name: 'Champion',
        description: '14 jours consécutifs (record)',
        icon: '👑',
        color: 'warning',
        earnedAt: new Date().toISOString(),
      });
    }

    return badges;
  }
}
