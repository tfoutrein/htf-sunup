import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, or, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
  accessRequests,
  users,
  AccessRequest,
  NewAccessRequest,
} from '../db/schema';

@Injectable()
export class AccessRequestsService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async create(createAccessRequestDto: {
    name: string;
    email: string;
    requestedRole?: string;
    requestedManagerId?: number;
    message?: string;
  }): Promise<AccessRequest> {
    const existingRequest = await this.db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.email, createAccessRequestDto.email));

    if (existingRequest.length > 0) {
      throw new BadRequestException(
        "Une demande d'accès existe déjà pour cet email",
      );
    }

    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, createAccessRequestDto.email));

    if (existingUser.length > 0) {
      throw new BadRequestException(
        'Un utilisateur avec cet email existe déjà',
      );
    }

    const newAccessRequest: NewAccessRequest = {
      name: createAccessRequestDto.name,
      email: createAccessRequestDto.email,
      requestedRole: createAccessRequestDto.requestedRole || 'fbo',
      requestedManagerId: createAccessRequestDto.requestedManagerId,
      message: createAccessRequestDto.message,
      status: 'pending',
    };

    const result = await this.db
      .insert(accessRequests)
      .values(newAccessRequest)
      .returning();

    return result[0];
  }

  async findAll(): Promise<AccessRequest[]> {
    return await this.db
      .select()
      .from(accessRequests)
      .orderBy(desc(accessRequests.createdAt));
  }

  async findPending(): Promise<AccessRequest[]> {
    return await this.db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.status, 'pending'))
      .orderBy(desc(accessRequests.createdAt));
  }

  async findById(id: number): Promise<AccessRequest> {
    const result = await this.db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, id));

    if (result.length === 0) {
      throw new NotFoundException("Demande d'accès non trouvée");
    }

    return result[0];
  }

  async findWithManager(id: number) {
    const result = await this.db
      .select({
        accessRequest: accessRequests,
        requestedManager: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(accessRequests)
      .leftJoin(users, eq(accessRequests.requestedManagerId, users.id))
      .where(eq(accessRequests.id, id));

    if (result.length === 0) {
      throw new NotFoundException("Demande d'accès non trouvée");
    }

    return result[0];
  }

  async approve(
    id: number,
    reviewerId: number,
    reviewComment?: string,
  ): Promise<AccessRequest> {
    const accessRequest = await this.findById(id);

    if (accessRequest.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const result = await this.db
      .update(accessRequests)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComment,
        updatedAt: new Date(),
      })
      .where(eq(accessRequests.id, id))
      .returning();

    return result[0];
  }

  async reject(
    id: number,
    reviewerId: number,
    reviewComment?: string,
  ): Promise<AccessRequest> {
    const accessRequest = await this.findById(id);

    if (accessRequest.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const result = await this.db
      .update(accessRequests)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComment,
        updatedAt: new Date(),
      })
      .where(eq(accessRequests.id, id))
      .returning();

    return result[0];
  }

  async findByManagerId(managerId: number): Promise<AccessRequest[]> {
    return await this.db
      .select()
      .from(accessRequests)
      .where(
        and(
          eq(accessRequests.requestedManagerId, managerId),
          eq(accessRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(accessRequests.createdAt));
  }

  async findByManagerIdOrUnassigned(
    managerId: number,
  ): Promise<AccessRequest[]> {
    return await this.db
      .select()
      .from(accessRequests)
      .where(
        and(
          or(
            eq(accessRequests.requestedManagerId, managerId),
            isNull(accessRequests.requestedManagerId),
          ),
          eq(accessRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(accessRequests.createdAt));
  }

  async findByManagerAndTeam(managerId: number) {
    // Récupérer les demandes directes pour ce manager
    const directRequests = await this.db
      .select({
        accessRequest: accessRequests,
        requestedManager: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(accessRequests)
      .leftJoin(users, eq(accessRequests.requestedManagerId, users.id))
      .where(
        and(
          eq(accessRequests.requestedManagerId, managerId),
          eq(accessRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(accessRequests.createdAt));

    // Récupérer les utilisateurs de l'équipe de ce manager
    const teamMembers = await this.db
      .select()
      .from(users)
      .where(eq(users.managerId, managerId));

    const teamMemberIds = teamMembers.map((member) => member.id);

    let teamRequests = [];
    if (teamMemberIds.length > 0) {
      // Récupérer les demandes pour l'équipe
      teamRequests = await this.db
        .select({
          accessRequest: accessRequests,
          requestedManager: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          },
        })
        .from(accessRequests)
        .leftJoin(users, eq(accessRequests.requestedManagerId, users.id))
        .where(
          and(
            or(
              ...teamMemberIds.map((id) =>
                eq(accessRequests.requestedManagerId, id),
              ),
            ),
            eq(accessRequests.status, 'pending'),
          ),
        )
        .orderBy(desc(accessRequests.createdAt));
    }

    return {
      direct: directRequests,
      team: teamRequests,
    };
  }

  async reassign(
    id: number,
    newManagerId: number,
    reviewerId: number,
    reviewComment?: string,
  ): Promise<AccessRequest> {
    const accessRequest = await this.findById(id);

    if (accessRequest.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const result = await this.db
      .update(accessRequests)
      .set({
        requestedManagerId: newManagerId,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComment,
        updatedAt: new Date(),
      })
      .where(eq(accessRequests.id, id))
      .returning();

    return result[0];
  }
}
