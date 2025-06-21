import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte, inArray, isNotNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
  actions,
  userActions,
  users,
  Action,
  NewAction,
  UserAction,
} from '../db/schema';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Injectable()
export class ActionsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(
    createActionDto: CreateActionDto,
    createdBy: number,
  ): Promise<Action> {
    const [action] = await this.db
      .insert(actions)
      .values({
        ...createActionDto,
        createdBy,
      })
      .returning();
    return action;
  }

  async findAll(): Promise<Action[]> {
    return await this.db.select().from(actions);
  }

  async findOne(id: number): Promise<Action> {
    const [action] = await this.db
      .select()
      .from(actions)
      .where(eq(actions.id, id));

    if (!action) {
      throw new NotFoundException(`Action with ID ${id} not found`);
    }

    return action;
  }

  async update(id: number, updateActionDto: UpdateActionDto): Promise<Action> {
    const [action] = await this.db
      .update(actions)
      .set({ ...updateActionDto, updatedAt: new Date() })
      .where(eq(actions.id, id))
      .returning();

    if (!action) {
      throw new NotFoundException(`Action with ID ${id} not found`);
    }

    return action;
  }

  async remove(id: number): Promise<void> {
    const [action] = await this.db
      .delete(actions)
      .where(eq(actions.id, id))
      .returning();

    if (!action) {
      throw new NotFoundException(`Action with ID ${id} not found`);
    }
  }

  // Specific methods for MVP
  async getActionsByDate(date: string): Promise<Action[]> {
    return await this.db.select().from(actions).where(eq(actions.date, date));
  }

  async getActionsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Action[]> {
    return await this.db
      .select()
      .from(actions)
      .where(and(gte(actions.date, startDate), lte(actions.date, endDate)));
  }

  async getActionsByCreator(createdBy: number): Promise<Action[]> {
    return await this.db
      .select()
      .from(actions)
      .where(eq(actions.createdBy, createdBy));
  }

  async assignActionToUsers(
    actionId: number,
    userIds: number[],
  ): Promise<UserAction[]> {
    const assignments = userIds.map((userId) => ({
      actionId,
      userId,
    }));

    return await this.db.insert(userActions).values(assignments).returning();
  }

  async getUserActionsForDate(userId: number, date: string): Promise<any[]> {
    return await this.db
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
          date: actions.date,
        },
      })
      .from(userActions)
      .innerJoin(actions, eq(userActions.actionId, actions.id))
      .where(and(eq(userActions.userId, userId), eq(actions.date, date)));
  }

  async completeUserAction(
    userActionId: number,
    proofUrl?: string,
  ): Promise<UserAction> {
    const [userAction] = await this.db
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
        `UserAction with ID ${userActionId} not found`,
      );
    }

    return userAction;
  }

  async getGlobalProgress(): Promise<any> {
    try {
      console.log('[DEBUG] Starting getGlobalProgress');

      // Get total members (FBO role)
      const totalMembers = await this.db
        .select()
        .from(users)
        .where(eq(users.role, 'fbo'));

      console.log('[DEBUG] Total members found:', totalMembers.length);

      // Get all actions
      const allActions = await this.db.select().from(actions);

      // Get completed actions
      const completedActions = await this.db
        .select()
        .from(userActions)
        .where(eq(userActions.completed, true));

      // Get manager stats
      const managers = await this.db
        .select()
        .from(users)
        .where(eq(users.role, 'manager'));

      const managerStats = await Promise.all(
        managers.map(async (manager) => {
          console.log('[DEBUG] Processing manager:', manager.id, manager.name);

          // Validate manager ID
          if (!manager.id || isNaN(manager.id)) {
            console.error('[ERROR] Invalid manager ID:', manager.id);
            return {
              managerId: 0,
              managerName: manager.name || 'Unknown',
              teamSize: 0,
              completedActions: 0,
              totalActions: 0,
              completionRate: 0,
            };
          }

          // Get team members for this manager
          const teamMembers = await this.db
            .select()
            .from(users)
            .where(
              and(
                eq(users.role, 'fbo'),
                eq(users.managerId, manager.id),
                isNotNull(users.managerId),
              ),
            );

          // Get actions assigned to this manager's team
          const teamUserIds = teamMembers.map((m) => m.id);

          if (teamUserIds.length === 0) {
            return {
              managerId: manager.id,
              managerName: manager.name,
              teamSize: 0,
              completedActions: 0,
              totalActions: 0,
              completionRate: 0,
            };
          }

          let teamTotalActions = [];
          let teamCompletedActions = [];

          if (teamUserIds.length > 0) {
            teamTotalActions = await this.db
              .select()
              .from(userActions)
              .where(inArray(userActions.userId, teamUserIds));

            teamCompletedActions = await this.db
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
        allActions.length > 0
          ? (completedActions.length / allActions.length) * 100
          : 0;

      console.log('[DEBUG] Returning global progress data');

      return {
        totalMembers: totalMembers.length,
        totalActions: allActions.length,
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
    const teamMembers = await this.db
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
        const totalUserActions = await this.db
          .select()
          .from(userActions)
          .where(eq(userActions.userId, member.id));

        const completedUserActions = await this.db
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
