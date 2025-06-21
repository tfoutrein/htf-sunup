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
}
