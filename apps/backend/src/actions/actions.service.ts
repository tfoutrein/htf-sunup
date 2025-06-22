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
        completed: userActions.completed,
        completedAt: userActions.completedAt,
        proofUrl: userActions.proofUrl,
        action: {
          id: actions.id,
          title: actions.title,
          description: actions.description,
          type: actions.type,
          order: actions.order,
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
}
