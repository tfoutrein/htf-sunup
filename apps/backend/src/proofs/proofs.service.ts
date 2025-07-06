import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../db/database.module';
import { eq, and, count } from 'drizzle-orm';
import { proofs, userActions, dailyBonus, users } from '../db/schema';
import type { Proof, NewProof } from '../db/schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProofsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  // Récupérer toutes les preuves d'une action utilisateur
  async getProofsByUserAction(userActionId: number): Promise<Proof[]> {
    const proofsData = await this.databaseService.db
      .select()
      .from(proofs)
      .where(eq(proofs.userActionId, userActionId))
      .orderBy(proofs.createdAt);

    return proofsData;
  }

  // Récupérer toutes les preuves d'un bonus quotidien
  async getProofsByDailyBonus(dailyBonusId: number): Promise<Proof[]> {
    const proofsData = await this.databaseService.db
      .select()
      .from(proofs)
      .where(eq(proofs.dailyBonusId, dailyBonusId))
      .orderBy(proofs.createdAt);

    return proofsData;
  }

  // Compter les preuves d'une action utilisateur
  async countProofsByUserAction(userActionId: number): Promise<number> {
    try {
      console.log(
        `🔍 [ProofsService] Counting proofs for userActionId: ${userActionId}`,
      );

      const result = await this.databaseService.db
        .select({ count: count() })
        .from(proofs)
        .where(eq(proofs.userActionId, userActionId));

      const proofCount = result[0].count;
      console.log(
        `📊 [ProofsService] Found ${proofCount} proofs for userActionId: ${userActionId}`,
      );

      return proofCount;
    } catch (error) {
      console.error(
        `❌ [ProofsService] Error counting proofs for userActionId ${userActionId}:`,
        error,
      );
      // Retourner 0 en cas d'erreur pour permettre la continuation du processus
      console.log(
        `⚠️ [ProofsService] Returning 0 as fallback for userActionId: ${userActionId}`,
      );
      return 0;
    }
  }

  // Compter les preuves d'un bonus quotidien
  async countProofsByDailyBonus(dailyBonusId: number): Promise<number> {
    try {
      console.log(
        `🔍 [ProofsService] Counting proofs for dailyBonusId: ${dailyBonusId}`,
      );

      const result = await this.databaseService.db
        .select({ count: count() })
        .from(proofs)
        .where(eq(proofs.dailyBonusId, dailyBonusId));

      const proofCount = result[0].count;
      console.log(
        `📊 [ProofsService] Found ${proofCount} proofs for dailyBonusId: ${dailyBonusId}`,
      );

      return proofCount;
    } catch (error) {
      console.error(
        `❌ [ProofsService] Error counting proofs for dailyBonusId ${dailyBonusId}:`,
        error,
      );
      // Retourner 0 en cas d'erreur pour permettre la continuation du processus
      console.log(
        `⚠️ [ProofsService] Returning 0 as fallback for dailyBonusId: ${dailyBonusId}`,
      );
      return 0;
    }
  }

  // Ajouter une preuve à une action utilisateur
  async addProofToUserAction(
    userActionId: number,
    file: Express.Multer.File,
  ): Promise<Proof> {
    console.log(
      `🎯 [ProofsService] Adding proof to userActionId: ${userActionId}`,
    );

    // Vérifier que l'action utilisateur existe
    console.log(
      `🔍 [ProofsService] Checking if userAction ${userActionId} exists...`,
    );
    const userAction = await this.databaseService.db
      .select()
      .from(userActions)
      .where(eq(userActions.id, userActionId))
      .limit(1);

    if (userAction.length === 0) {
      console.error(`❌ [ProofsService] UserAction ${userActionId} not found`);
      throw new NotFoundException(
        `UserAction avec l'ID ${userActionId} non trouvée`,
      );
    }

    console.log(`✅ [ProofsService] UserAction ${userActionId} exists:`, {
      id: userAction[0].id,
      userId: userAction[0].userId,
      actionId: userAction[0].actionId,
      challengeId: userAction[0].challengeId,
      completed: userAction[0].completed,
    });

    // Vérifier qu'on ne dépasse pas 5 preuves
    console.log(
      `📊 [ProofsService] Checking proof count for userActionId: ${userActionId}`,
    );
    const currentCount = await this.countProofsByUserAction(userActionId);
    console.log(`📊 [ProofsService] Current proof count: ${currentCount}/5`);

    if (currentCount >= 5) {
      console.error(
        `❌ [ProofsService] Too many proofs for userActionId ${userActionId}: ${currentCount}/5`,
      );
      throw new BadRequestException(
        'Maximum 5 preuves autorisées par action utilisateur',
      );
    }

    console.log(
      `✅ [ProofsService] Proof count OK (${currentCount}/5), proceeding with upload...`,
    );
    return this.uploadAndSaveProof(file, userActionId, null);
  }

  // Ajouter une preuve à un bonus quotidien
  async addProofToDailyBonus(
    dailyBonusId: number,
    file: Express.Multer.File,
  ): Promise<Proof> {
    console.log(
      `🎯 [ProofsService] Adding proof to dailyBonusId: ${dailyBonusId}`,
    );

    // Vérifier que le bonus quotidien existe
    console.log(
      `🔍 [ProofsService] Checking if dailyBonus ${dailyBonusId} exists...`,
    );
    const bonus = await this.databaseService.db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.id, dailyBonusId))
      .limit(1);

    if (bonus.length === 0) {
      console.error(`❌ [ProofsService] DailyBonus ${dailyBonusId} not found`);
      throw new NotFoundException(
        `DailyBonus avec l'ID ${dailyBonusId} non trouvé`,
      );
    }

    console.log(`✅ [ProofsService] DailyBonus ${dailyBonusId} exists:`, {
      id: bonus[0].id,
      userId: bonus[0].userId,
      campaignId: bonus[0].campaignId,
      bonusType: bonus[0].bonusType,
      amount: bonus[0].amount,
    });

    // Vérifier qu'on ne dépasse pas 5 preuves
    console.log(
      `📊 [ProofsService] Checking proof count for dailyBonusId: ${dailyBonusId}`,
    );
    const currentCount = await this.countProofsByDailyBonus(dailyBonusId);
    console.log(`📊 [ProofsService] Current proof count: ${currentCount}/5`);

    if (currentCount >= 5) {
      console.error(
        `❌ [ProofsService] Too many proofs for dailyBonusId ${dailyBonusId}: ${currentCount}/5`,
      );
      throw new BadRequestException(
        'Maximum 5 preuves autorisées par bonus quotidien',
      );
    }

    console.log(
      `✅ [ProofsService] Proof count OK (${currentCount}/5), proceeding with upload...`,
    );
    return this.uploadAndSaveProof(file, null, dailyBonusId);
  }

  // Supprimer une preuve
  async deleteProof(proofId: number): Promise<void> {
    const proof = await this.findOne(proofId);

    try {
      // Supprimer le fichier du stockage
      const key = this.storageService.extractKeyFromUrl(proof.url);
      if (key) {
        await this.storageService.deleteFile(key);
      }
    } catch (error) {
      console.warn(
        `Erreur lors de la suppression du fichier: ${error.message}`,
      );
      // Continue même si la suppression du fichier échoue
    }

    // Supprimer l'enregistrement de la base de données
    await this.databaseService.db.delete(proofs).where(eq(proofs.id, proofId));
  }

  // Récupérer une preuve par ID
  async findOne(proofId: number): Promise<Proof> {
    const proof = await this.databaseService.db
      .select()
      .from(proofs)
      .where(eq(proofs.id, proofId))
      .limit(1);

    if (proof.length === 0) {
      throw new NotFoundException(`Preuve avec l'ID ${proofId} non trouvée`);
    }

    return proof[0];
  }

  // Générer une URL signée pour une preuve
  async getSignedUrl(proofId: number): Promise<{ url: string }> {
    const proof = await this.findOne(proofId);

    try {
      const key = this.storageService.extractKeyFromUrl(proof.url);
      if (!key) {
        throw new BadRequestException('URL de preuve invalide');
      }

      // Générer une URL signée valide 1 heure
      const signedUrl = await this.storageService.getSignedUrl(key, 3600);
      return { url: signedUrl };
    } catch (error) {
      console.error('Error generating proof URL:', error);
      throw new BadRequestException("Impossible de générer l'URL de preuve");
    }
  }

  // Méthode privée pour uploader et sauvegarder une preuve
  private async uploadAndSaveProof(
    file: Express.Multer.File,
    userActionId: number | null,
    dailyBonusId: number | null,
  ): Promise<Proof> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    console.log(`📤 [uploadAndSaveProof] Uploading file: ${file.originalname}`);

    // Valider le type de fichier
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.error(
        `❌ [uploadAndSaveProof] Invalid file type: ${file.mimetype}`,
      );
      throw new BadRequestException(
        'Type de fichier non supporté. Types autorisés: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM',
      );
    }

    // Limiter la taille du fichier (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      console.error(
        `❌ [uploadAndSaveProof] File too large: ${file.size} bytes`,
      );
      throw new BadRequestException(
        'Fichier trop volumineux. Taille maximale: 10MB',
      );
    }

    // Déterminer le type de fichier
    const type = file.mimetype.startsWith('image/') ? 'image' : 'video';

    // Générer la clé de stockage
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const entityType = userActionId ? 'user-action' : 'daily-bonus';
    const entityId = userActionId || dailyBonusId;
    const key = `proofs/${entityType}/${entityId}/${timestamp}.${fileExtension}`;
    console.log(`🔑 [uploadAndSaveProof] Generated key: ${key}`);

    try {
      // Uploader le fichier
      const url = await this.storageService.uploadFile(file, key);
      console.log(
        `✅ [uploadAndSaveProof] File uploaded successfully. URL: ${url}`,
      );

      // Sauvegarder en base de données
      const newProof: NewProof = {
        url,
        type,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        userActionId,
        dailyBonusId,
      };

      const [savedProof] = await this.databaseService.db
        .insert(proofs)
        .values(newProof)
        .returning();

      console.log(
        `✅ [uploadAndSaveProof] Proof saved successfully. ID: ${savedProof.id}`,
      );
      return savedProof;
    } catch (error) {
      console.error('Error uploading proof:', error);
      throw new BadRequestException("Erreur lors de l'upload de la preuve");
    }
  }

  // Méthode helper pour vérifier si userId est manager (à n'importe quel niveau) de targetUserId
  private async isManagerInHierarchy(
    userId: number,
    targetUserId: number,
  ): Promise<boolean> {
    console.log(
      `🏗️ [isManagerInHierarchy] Checking if user ${userId} is manager of user ${targetUserId}`,
    );

    // Si c'est le même utilisateur, pas besoin de vérifier la hiérarchie
    if (userId === targetUserId) {
      console.log(`👤 [isManagerInHierarchy] Same user, direct ownership`);
      return true;
    }

    // Récupérer l'utilisateur cible
    const targetUser = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      console.log(
        `❌ [isManagerInHierarchy] Target user ${targetUserId} not found`,
      );
      return false;
    }

    const target = targetUser[0];
    console.log(
      `👤 [isManagerInHierarchy] Target user: ${target.name}, managerId: ${target.managerId}`,
    );

    // Si l'utilisateur n'a pas de manager, arrêter la recherche
    if (!target.managerId) {
      console.log(
        `🔚 [isManagerInHierarchy] Target user has no manager, stopping search`,
      );
      return false;
    }

    // Si le manager direct correspond à userId, on a trouvé !
    if (target.managerId === userId) {
      console.log(
        `✅ [isManagerInHierarchy] User ${userId} is direct manager of ${targetUserId}`,
      );
      return true;
    }

    // Sinon, remonter la hiérarchie récursivement
    console.log(
      `⬆️ [isManagerInHierarchy] Checking higher level: is ${userId} manager of ${target.managerId}?`,
    );
    return this.isManagerInHierarchy(userId, target.managerId);
  }

  // Méthode utilitaire pour vérifier si une preuve appartient à un utilisateur ou est dans sa hiérarchie
  async verifyProofOwnership(
    proofId: number,
    userId: number,
  ): Promise<boolean> {
    console.log(
      `🔍 [verifyProofOwnership] Checking proof ${proofId} for user ${userId}`,
    );

    const proof = await this.findOne(proofId);
    console.log(`📄 [verifyProofOwnership] Proof data:`, {
      id: proof.id,
      userActionId: proof.userActionId,
      dailyBonusId: proof.dailyBonusId,
    });

    if (proof.userActionId) {
      console.log(
        `🎯 [verifyProofOwnership] Checking via userActions for actionId ${proof.userActionId}`,
      );

      // Vérifier via userActions - propriétaire direct ou manager
      const userAction = await this.databaseService.db
        .select({
          userAction: userActions,
          owner: users,
        })
        .from(userActions)
        .leftJoin(users, eq(userActions.userId, users.id))
        .where(eq(userActions.id, proof.userActionId))
        .limit(1);

      console.log(
        `📊 [verifyProofOwnership] UserAction query result:`,
        userAction,
      );

      if (userAction.length === 0) {
        console.log(
          `❌ [verifyProofOwnership] No userAction found for ID ${proof.userActionId}`,
        );
        return false;
      }

      const actionOwner = userAction[0];
      console.log(`👤 [verifyProofOwnership] Action owner data:`, {
        actionUserId: actionOwner.userAction.userId,
        ownerName: actionOwner.owner?.name,
        ownerManagerId: actionOwner.owner?.managerId,
        requestingUserId: userId,
      });

      // Vérifier si l'utilisateur est dans la hiérarchie managériale du propriétaire
      const hasAccess = await this.isManagerInHierarchy(
        userId,
        actionOwner.userAction.userId,
      );

      if (hasAccess) {
        console.log(
          `✅ [verifyProofOwnership] User ${userId} has access to action proof`,
        );
        return true;
      }

      console.log(
        `❌ [verifyProofOwnership] User ${userId} has no access to this action proof`,
      );
      return false;
    }

    if (proof.dailyBonusId) {
      console.log(
        `🎯 [verifyProofOwnership] Checking via dailyBonus for bonusId ${proof.dailyBonusId}`,
      );

      // Vérifier via dailyBonus - propriétaire direct ou manager
      const bonus = await this.databaseService.db
        .select({
          bonus: dailyBonus,
          owner: users,
        })
        .from(dailyBonus)
        .leftJoin(users, eq(dailyBonus.userId, users.id))
        .where(eq(dailyBonus.id, proof.dailyBonusId))
        .limit(1);

      console.log(`📊 [verifyProofOwnership] DailyBonus query result:`, bonus);

      if (bonus.length === 0) {
        console.log(
          `❌ [verifyProofOwnership] No dailyBonus found for ID ${proof.dailyBonusId}`,
        );
        return false;
      }

      const bonusOwner = bonus[0];
      console.log(`👤 [verifyProofOwnership] Bonus owner data:`, {
        bonusUserId: bonusOwner.bonus.userId,
        ownerName: bonusOwner.owner?.name,
        ownerManagerId: bonusOwner.owner?.managerId,
        requestingUserId: userId,
      });

      // Vérifier si l'utilisateur est dans la hiérarchie managériale du propriétaire
      const hasAccess = await this.isManagerInHierarchy(
        userId,
        bonusOwner.bonus.userId,
      );

      if (hasAccess) {
        console.log(
          `✅ [verifyProofOwnership] User ${userId} has access to bonus proof`,
        );
        return true;
      }

      console.log(
        `❌ [verifyProofOwnership] User ${userId} has no access to this bonus proof`,
      );
      return false;
    }

    console.log(
      `❌ [verifyProofOwnership] Proof ${proofId} has neither userActionId nor dailyBonusId`,
    );
    return false;
  }
}
