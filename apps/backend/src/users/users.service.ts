import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
  users,
  User,
  NewUser,
  userActions,
  dailyBonus,
  campaigns,
} from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(createUserDto: CreateUserDto | any): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    let userData = { ...createUserDto };

    // Hash password only if it's provided and not already hashed
    // (not for Facebook users and not for already hashed passwords from auth service)
    if (
      createUserDto.password &&
      !this.isPasswordHashed(createUserDto.password)
    ) {
      userData.password = await bcrypt.hash(createUserDto.password, 10);
    }

    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }

  private isPasswordHashed(password: string): boolean {
    // bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 characters long
    return password && password.length === 60 && password.startsWith('$2');
  }

  async findAll(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async findOne(id: number): Promise<User> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.facebookId, facebookId));
    return user || null;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateFacebookToken(
    userId: number,
    accessToken: string,
  ): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        facebookAccessToken: accessToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async updateFacebookInfo(
    userId: number,
    facebookData: {
      facebookAccessToken: string;
      profilePicture?: string;
      name?: string;
    },
  ): Promise<User> {
    const updateData: any = {
      facebookAccessToken: facebookData.facebookAccessToken,
      updatedAt: new Date(),
    };

    if (facebookData.profilePicture) {
      updateData.profilePicture = facebookData.profilePicture;
    }

    if (facebookData.name) {
      updateData.name = facebookData.name;
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async linkFacebookAccount(
    userId: number,
    facebookData: {
      facebookId: string;
      facebookAccessToken: string;
      profilePicture?: string;
      authProvider: string;
    },
  ): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({
        facebookId: facebookData.facebookId,
        facebookAccessToken: facebookData.facebookAccessToken,
        profilePicture: facebookData.profilePicture,
        authProvider: facebookData.authProvider,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async remove(id: number): Promise<void> {
    // Vérifier que l'utilisateur existe
    const userToDelete = await this.findOne(id);
    if (!userToDelete) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Nettoyer toutes les données liées en cascade
    await this.cleanupUserData(id);

    // Supprimer l'utilisateur
    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Méthode de diagnostic pour voir les données liées à un utilisateur
  async diagnoseUserDependencies(userId: number): Promise<any> {
    const userActionsCount = await this.db
      .select()
      .from(userActions)
      .where(eq(userActions.userId, userId));

    const dailyBonusesAsUser = await this.db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.userId, userId));

    const dailyBonusesAsReviewer = await this.db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.reviewedBy, userId));

    const campaignsCreated = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.createdBy, userId));

    const teamMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, userId));

    return {
      userId,
      dependencies: {
        userActions: userActionsCount.length,
        dailyBonusesAsUser: dailyBonusesAsUser.length,
        dailyBonusesAsReviewer: dailyBonusesAsReviewer.length,
        campaignsCreated: campaignsCreated.length,
        teamMembers: teamMembers.length,
      },
      details: {
        userActions: userActionsCount,
        dailyBonusesAsUser,
        dailyBonusesAsReviewer,
        campaignsCreated,
        teamMembers,
      },
    };
  }

  private async cleanupUserData(userId: number): Promise<void> {
    console.log(`🧹 Nettoyage des données pour l'utilisateur ${userId}`);

    // Diagnostic avant nettoyage
    const dependencies = await this.diagnoseUserDependencies(userId);
    console.log('📊 Dépendances trouvées:', dependencies.dependencies);

    // 1. Supprimer les actions utilisateur
    const deletedActions = await this.db
      .delete(userActions)
      .where(eq(userActions.userId, userId))
      .returning();
    console.log(`🗑️ Supprimé ${deletedActions.length} actions utilisateur`);

    // 2. Supprimer les bonus quotidiens (où l'utilisateur est le déclarant)
    const deletedBonuses = await this.db
      .delete(dailyBonus)
      .where(eq(dailyBonus.userId, userId))
      .returning();
    console.log(`🗑️ Supprimé ${deletedBonuses.length} bonus quotidiens`);

    // 3. Mettre à null les bonus quotidiens (où l'utilisateur est le revieweur)
    const updatedBonuses = await this.db
      .update(dailyBonus)
      .set({ reviewedBy: null })
      .where(eq(dailyBonus.reviewedBy, userId))
      .returning();
    console.log(
      `🔄 Mis à jour ${updatedBonuses.length} bonus (reviewer -> null)`,
    );

    // 4. Transférer ou supprimer les campagnes créées par l'utilisateur
    const principalManager = await this.db
      .select()
      .from(users)
      .where(and(eq(users.role, 'manager'), isNull(users.managerId)))
      .limit(1);

    if (principalManager.length > 0) {
      const transferredCampaigns = await this.db
        .update(campaigns)
        .set({ createdBy: principalManager[0].id })
        .where(eq(campaigns.createdBy, userId))
        .returning();
      console.log(
        `🔄 Transféré ${transferredCampaigns.length} campagnes vers le manager principal (ID: ${principalManager[0].id})`,
      );
    }

    // 5. Réassigner les membres d'équipe dont l'utilisateur est le manager
    if (principalManager.length > 0) {
      const reassignedMembers = await this.db
        .update(users)
        .set({ managerId: principalManager[0].id })
        .where(eq(users.managerId, userId))
        .returning();
      console.log(
        `🔄 Réassigné ${reassignedMembers.length} membres d'équipe vers le manager principal`,
      );
    } else {
      const orphanedMembers = await this.db
        .update(users)
        .set({ managerId: null })
        .where(eq(users.managerId, userId))
        .returning();
      console.log(
        `🔄 Mis ${orphanedMembers.length} membres d'équipe sans manager`,
      );
    }

    console.log(`✅ Nettoyage terminé pour l'utilisateur ${userId}`);
  }

  // Team management methods
  async getTeamMembers(managerId: number): Promise<User[]> {
    // Check if this is the principal manager
    const isPrincipalManager = await this.isPrincipalManager(managerId);

    // Get direct team members
    const directMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

    // If this is the principal manager, also include users without manager
    if (isPrincipalManager) {
      const usersWithoutManager = await this.db
        .select()
        .from(users)
        .where(
          and(
            isNull(users.managerId),
            eq(users.role, 'fbo'), // Only include FBO users without manager
          ),
        );

      // Add users without manager to direct members
      directMembers.push(...usersWithoutManager);
    }

    return directMembers;
  }

  async getAllManagers(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, 'manager'));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, role));
  }

  async assignManager(userId: number, managerId: number): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ managerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async getAllMembers(): Promise<any[]> {
    const fboMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.role, 'fbo'));

    const membersWithManager = await Promise.all(
      fboMembers.map(async (member) => {
        let managerName = 'Aucun';

        if (member.managerId) {
          const manager = await this.findOne(member.managerId);
          if (manager) {
            managerName = manager.name;
          }
        }

        return {
          ...member,
          managerName,
        };
      }),
    );

    return membersWithManager;
  }

  // Advanced team management for hierarchy
  async getTeamHierarchy(managerId: number): Promise<any> {
    // Get the manager
    const manager = await this.findOne(managerId);

    // Check if this is the principal manager
    const isPrincipalManager = await this.isPrincipalManager(managerId);

    // Get direct team members (both managers and FBOs)
    const directMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

    // If this is the principal manager, also include users without manager
    if (isPrincipalManager) {
      const usersWithoutManager = await this.db
        .select()
        .from(users)
        .where(
          and(
            isNull(users.managerId),
            eq(users.role, 'fbo'), // Only include FBO users without manager
          ),
        );

      // Add users without manager to direct members
      directMembers.push(...usersWithoutManager);
    }

    // Build hierarchy recursively
    const hierarchy = {
      ...manager,
      directMembers: await Promise.all(
        directMembers.map(async (member) => {
          if (member.role === 'manager') {
            // If member is a manager, get their team hierarchy
            const subHierarchy = await this.getTeamHierarchy(member.id);
            return {
              ...member,
              type: 'manager',
              teamSize: subHierarchy?.totalMembers || 0,
              subTeam: Array.isArray(subHierarchy?.directMembers)
                ? subHierarchy.directMembers
                : [],
            };
          } else {
            // If member is FBO, just return basic info
            return {
              ...member,
              type: 'fbo',
              teamSize: 0,
              subTeam: [],
            };
          }
        }),
      ),
      totalMembers: 0, // Will be calculated
      totalManagers: 0, // Will be calculated
      totalFbos: 0, // Will be calculated
    };

    // Calculate total members recursively
    const calculateTotalMembers = (node: any): number => {
      if (!node) return 0;

      const members = node.directMembers || node.subTeam || [];
      if (!Array.isArray(members)) return 0;

      let total = members.length;
      members.forEach((member: any) => {
        if (
          member &&
          member.role === 'manager' &&
          member.subTeam &&
          Array.isArray(member.subTeam) &&
          member.subTeam.length > 0
        ) {
          total += calculateTotalMembers(member);
        }
      });
      return total;
    };

    // Calculate managers and FBOs recursively
    const calculateRoleStats = (
      node: any,
    ): { managers: number; fbos: number } => {
      if (!node) return { managers: 0, fbos: 0 };

      const members = node.directMembers || node.subTeam || [];
      if (!Array.isArray(members)) return { managers: 0, fbos: 0 };

      let managers = 0;
      let fbos = 0;

      members.forEach((member: any) => {
        if (member && member.role === 'manager') {
          managers++;
          if (
            member.subTeam &&
            Array.isArray(member.subTeam) &&
            member.subTeam.length > 0
          ) {
            const subStats = calculateRoleStats(member);
            managers += subStats.managers;
            fbos += subStats.fbos;
          }
        } else if (member && member.role === 'fbo') {
          fbos++;
        }
      });

      return { managers, fbos };
    };

    hierarchy.totalMembers = calculateTotalMembers(hierarchy);
    const roleStats = calculateRoleStats(hierarchy);
    hierarchy.totalManagers = roleStats.managers;
    hierarchy.totalFbos = roleStats.fbos;

    return hierarchy;
  }

  async getFullTeamList(managerId: number): Promise<any[]> {
    const allMembers = [];

    // Check if this is the principal manager
    const isPrincipalManager = await this.isPrincipalManager(managerId);

    // Get direct team members
    const directMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

    for (const member of directMembers) {
      // Add manager info to member
      const memberWithManager = {
        ...member,
        managerName: (await this.findOne(managerId)).name,
        isDirectReport: true,
      };
      allMembers.push(memberWithManager);

      // If member is a manager, get their team recursively
      if (member.role === 'manager') {
        const subTeam = await this.getFullTeamList(member.id);
        allMembers.push(
          ...subTeam.map((subMember) => ({
            ...subMember,
            isDirectReport: false,
          })),
        );
      }
    }

    // If this is the principal manager, also include users without manager
    if (isPrincipalManager) {
      const usersWithoutManager = await this.db
        .select()
        .from(users)
        .where(
          and(
            isNull(users.managerId),
            eq(users.role, 'fbo'), // Only include FBO users without manager
          ),
        );

      for (const user of usersWithoutManager) {
        allMembers.push({
          ...user,
          managerName: "Aucun (En attente d'assignation)",
          isDirectReport: true,
        });
      }
    }

    return allMembers;
  }

  async updateTeamMember(
    memberId: number,
    updateData: Partial<User>,
    managerId: number,
  ): Promise<User> {
    // Verify the member belongs to the manager's team
    const member = await this.findOne(memberId);
    const isInTeam = await this.isMemberInTeam(memberId, managerId);

    if (!isInTeam) {
      throw new BadRequestException('You can only update members of your team');
    }

    // Don't allow password update through this method
    const { password, ...safeUpdateData } = updateData as any;

    const [updatedUser] = await this.db
      .update(users)
      .set({ ...safeUpdateData, updatedAt: new Date() })
      .where(eq(users.id, memberId))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${memberId} not found`);
    }

    return updatedUser;
  }

  async removeTeamMember(memberId: number, managerId: number): Promise<void> {
    // Verify the member belongs to the manager's team
    const isInTeam = await this.isMemberInTeam(memberId, managerId);

    if (!isInTeam) {
      throw new BadRequestException('You can only remove members of your team');
    }

    // If the member is a manager, reassign their team first
    const member = await this.findOne(memberId);
    if (member.role === 'manager') {
      const subTeam = await this.getTeamMembers(memberId);
      for (const subMember of subTeam) {
        await this.assignManager(subMember.id, managerId);
      }
    }

    await this.remove(memberId);
  }

  public async isMemberInTeam(
    memberId: number,
    managerId: number,
  ): Promise<boolean> {
    const fullTeam = await this.getFullTeamList(managerId);
    return fullTeam.some((member) => member.id === memberId);
  }

  // Méthode pour déterminer si un manager est le manager principal
  private async isPrincipalManager(managerId: number): Promise<boolean> {
    const manager = await this.findOne(managerId);
    return manager.role === 'manager' && !manager.managerId;
  }
}
