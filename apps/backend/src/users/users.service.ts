import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { DATABASE_CONNECTION } from '../db/database.module';
import { users, User, NewUser } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const [user] = await this.db
      .insert(users)
      .values({
        ...createUserDto,
        password: hashedPassword,
      })
      .returning();
    return user;
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

  async remove(id: number): Promise<void> {
    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Team management methods
  async getTeamMembers(managerId: number): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));
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

    // Get direct team members (both managers and FBOs)
    const directMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

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

  private async isMemberInTeam(
    memberId: number,
    managerId: number,
  ): Promise<boolean> {
    const fullTeam = await this.getFullTeamList(managerId);
    return fullTeam.some((member) => member.id === memberId);
  }
}
