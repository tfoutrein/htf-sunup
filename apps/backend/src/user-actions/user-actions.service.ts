import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import {
  userActions,
  actions,
  type UserAction,
  type NewUserAction,
} from '../db/schema';
import { CreateUserActionDto } from './dto/create-user-action.dto';
import { UpdateUserActionDto } from './dto/update-user-action.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UserActionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    createUserActionDto: CreateUserActionDto & { userId: number },
  ): Promise<UserAction> {
    console.log('CreateUserActionDto', createUserActionDto);
    const { actionId, challengeId, userId, ...rest } = createUserActionDto;

    // Vérifier que l'action existe
    const [action] = await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.id, actionId));

    if (!action) {
      throw new NotFoundException(`Action avec l'ID ${actionId} non trouvée`);
    }

    // Vérifier qu'il n'y a pas déjà une user action pour cette action et cet utilisateur
    const [existingUserAction] = await this.db.db
      .select()
      .from(userActions)
      .where(
        and(
          eq(userActions.actionId, actionId),
          eq(userActions.userId, userId),
          eq(userActions.challengeId, challengeId),
        ),
      );

    if (existingUserAction) {
      throw new BadRequestException(
        'Une action utilisateur existe déjà pour cette action et cet utilisateur',
      );
    }

    const newUserAction: NewUserAction = {
      actionId,
      challengeId,
      userId,
      completed: rest.completed || false,
      proofUrl: rest.proofUrl || null,
    };

    const [userAction] = await this.db.db
      .insert(userActions)
      .values(newUserAction)
      .returning();

    return userAction;
  }

  async findOne(id: number): Promise<UserAction> {
    const [userAction] = await this.db.db
      .select()
      .from(userActions)
      .where(eq(userActions.id, id));

    if (!userAction) {
      throw new NotFoundException(
        `Action utilisateur avec l'ID ${id} non trouvée`,
      );
    }

    return userAction;
  }

  async update(
    id: number,
    updateUserActionDto: UpdateUserActionDto,
  ): Promise<UserAction> {
    await this.findOne(id); // Vérifier que l'action existe

    const updateData = {
      ...updateUserActionDto,
      updatedAt: new Date(),
      ...(updateUserActionDto.completed && { completedAt: new Date() }),
    };

    const [updatedUserAction] = await this.db.db
      .update(userActions)
      .set(updateData)
      .where(eq(userActions.id, id))
      .returning();

    return updatedUserAction;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Vérifier que l'action existe

    await this.db.db.delete(userActions).where(eq(userActions.id, id));
  }

  async uploadProof(
    id: number,
    file: Express.Multer.File,
  ): Promise<UserAction> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const userAction = await this.findOne(id); // Check if action exists and get details

    const fileExtension = file.originalname.split('.').pop();
    const key = `proofs/${userAction.userId}/${id}-${Date.now()}.${fileExtension}`;

    const proofUrl = await this.storageService.uploadFile(file, key);

    const [updatedUserAction] = await this.db.db
      .update(userActions)
      .set({ proofUrl: proofUrl, updatedAt: new Date() })
      .where(eq(userActions.id, id))
      .returning();

    return updatedUserAction;
  }

  async getProofUrl(id: number): Promise<{ url: string }> {
    const userAction = await this.findOne(id);

    if (!userAction.proofUrl) {
      throw new NotFoundException('Aucune preuve trouvée pour cette action');
    }

    try {
      // Extract the key from the stored URL
      const key = this.storageService.extractKeyFromUrl(userAction.proofUrl);

      if (!key) {
        throw new BadRequestException('URL de preuve invalide');
      }

      // Generate a signed URL (valid for 1 hour)
      const signedUrl = await this.storageService.getSignedUrl(key, 3600);

      return { url: signedUrl };
    } catch (error) {
      console.error('Error generating proof URL:', error);
      throw new BadRequestException("Impossible de générer l'URL de preuve");
    }
  }
}
