import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
  campaignValidations,
  campaignUnlockConditions,
  campaignValidationConditions,
  users,
  campaigns,
  challenges,
  userActions,
  dailyBonus,
} from '../db/schema';
import { UpdateCampaignValidationDto } from './dto/update-campaign-validation.dto';
import { CampaignValidationResponseDto } from './dto/campaign-validation-response.dto';
import { CreateUnlockConditionDto } from './dto/create-unlock-condition.dto';
import { UpdateUnlockConditionDto } from './dto/update-unlock-condition.dto';
import { UpdateConditionFulfillmentDto } from './dto/update-condition-fulfillment.dto';

@Injectable()
export class CampaignValidationService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  /**
   * Récupère toutes les validations de campagne pour les FBO sous la hiérarchie d'un manager
   */
  async getCampaignValidationsForManager(
    managerId: number,
    campaignId: number,
  ): Promise<CampaignValidationResponseDto[]> {
    // Récupérer tous les FBO dans la hiérarchie du manager
    const fboIds = await this.getFBOsInHierarchy(managerId);

    if (fboIds.length === 0) {
      return [];
    }

    // Récupérer ou créer les validations pour chaque FBO
    const validations = await Promise.all(
      fboIds.map(async (fboId) => {
        return this.getOrCreateCampaignValidation(fboId, campaignId);
      }),
    );

    return validations;
  }

  /**
   * Met à jour une validation de campagne
   */
  async updateCampaignValidation(
    managerId: number,
    userId: number,
    campaignId: number,
    updateDto: UpdateCampaignValidationDto,
  ): Promise<CampaignValidationResponseDto> {
    // Vérifier que le manager a le droit de valider ce FBO
    const canValidate = await this.canManagerValidateFBO(managerId, userId);
    if (!canValidate) {
      throw new ForbiddenException(
        'You do not have permission to validate this FBO',
      );
    }

    // Vérifier que la campagne existe
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaign.length === 0) {
      throw new NotFoundException('Campaign not found');
    }

    // Récupérer ou créer la validation
    let validation = await this.db
      .select()
      .from(campaignValidations)
      .where(
        and(
          eq(campaignValidations.userId, userId),
          eq(campaignValidations.campaignId, campaignId),
        ),
      )
      .limit(1);

    let validationId: number;
    if (validation.length === 0) {
      // Créer une nouvelle validation temporaire pour obtenir l'ID
      const newValidation = await this.db
        .insert(campaignValidations)
        .values({
          userId,
          campaignId,
          status: 'pending', // On met pending temporairement
        })
        .returning();

      validation = newValidation;
      validationId = validation[0].id;
    } else {
      validationId = validation[0].id;
    }

    // VÉRIFICATION DES CONDITIONS DE DÉBLOCAGE
    // Si le statut est 'approved', vérifier que toutes les conditions sont remplies
    if (updateDto.status === 'approved') {
      const allConditionsFulfilled =
        await this.checkAllConditionsFulfilled(validationId);

      if (!allConditionsFulfilled) {
        throw new BadRequestException(
          'Cannot approve validation: all unlock conditions must be fulfilled',
        );
      }
    }

    // Mettre à jour la validation avec le statut réel
    const updatedValidation = await this.db
      .update(campaignValidations)
      .set({
        status: updateDto.status,
        validatedBy: updateDto.status !== 'pending' ? managerId : null,
        validatedAt: updateDto.status !== 'pending' ? new Date() : null,
        comment: updateDto.comment,
        updatedAt: new Date(),
      })
      .where(eq(campaignValidations.id, validationId))
      .returning();

    validation = updatedValidation;

    // Retourner la validation complète avec les données enrichies
    return this.getOrCreateCampaignValidation(userId, campaignId);
  }

  /**
   * Récupère ou crée une validation de campagne avec toutes les données enrichies
   */
  async getOrCreateCampaignValidation(
    userId: number,
    campaignId: number,
  ): Promise<CampaignValidationResponseDto> {
    // Récupérer les informations de base
    const userInfo = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userInfo.length === 0) {
      throw new NotFoundException('User not found');
    }

    const campaignInfo = await this.db
      .select({
        id: campaigns.id,
        name: campaigns.name,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaignInfo.length === 0) {
      throw new NotFoundException('Campaign not found');
    }

    // Récupérer ou créer la validation
    let validation = await this.db
      .select()
      .from(campaignValidations)
      .where(
        and(
          eq(campaignValidations.userId, userId),
          eq(campaignValidations.campaignId, campaignId),
        ),
      )
      .limit(1);

    if (validation.length === 0) {
      // Créer une validation par défaut
      const newValidation = await this.db
        .insert(campaignValidations)
        .values({
          userId,
          campaignId,
          status: 'pending',
        })
        .returning();

      validation = newValidation;
    }

    // Calculer les gains totaux
    const totalEarnings = await this.calculateTotalEarnings(userId, campaignId);

    // Calculer la complétude des défis
    const { completedChallenges, totalChallenges } =
      await this.calculateChallengeCompletion(userId, campaignId);

    const completionPercentage =
      totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

    return {
      id: validation[0].id,
      userId: userInfo[0].id,
      userName: userInfo[0].name,
      userEmail: userInfo[0].email,
      campaignId: campaignInfo[0].id,
      campaignName: campaignInfo[0].name,
      status: validation[0].status,
      validatedBy: validation[0].validatedBy,
      validatedAt: validation[0].validatedAt,
      comment: validation[0].comment,
      totalEarnings,
      completedChallenges,
      totalChallenges,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      createdAt: validation[0].createdAt,
      updatedAt: validation[0].updatedAt,
    };
  }

  /**
   * Récupère tous les FBO dans la hiérarchie d'un manager (récursif)
   */
  private async getFBOsInHierarchy(managerId: number): Promise<number[]> {
    const fboIds: number[] = [];

    // Récupérer les utilisateurs directs du manager
    const directReports = await this.db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.managerId, managerId));

    for (const report of directReports) {
      if (report.role === 'fbo') {
        fboIds.push(report.id);
      } else if (report.role === 'manager') {
        // Récursion pour les managers subordonnés
        const subFBOs = await this.getFBOsInHierarchy(report.id);
        fboIds.push(...subFBOs);
      }
    }

    return fboIds;
  }

  /**
   * Vérifie si un manager peut valider un FBO (hiérarchie)
   */
  private async canManagerValidateFBO(
    managerId: number,
    fboId: number,
  ): Promise<boolean> {
    const fboIds = await this.getFBOsInHierarchy(managerId);
    return fboIds.includes(fboId);
  }

  /**
   * Calcule les gains totaux d'un FBO pour une campagne
   */
  private async calculateTotalEarnings(
    userId: number,
    campaignId: number,
  ): Promise<number> {
    // Gains des défis complets (un défi est complet si toutes ses actions sont complétées)
    const challengeEarnings = await this.db
      .select({
        challengeId: challenges.id,
        valueInEuro: challenges.valueInEuro,
        totalActions: sql<number>`COUNT(${userActions.id})`,
        completedActions: sql<number>`COUNT(CASE WHEN ${userActions.completed} = true THEN 1 END)`,
      })
      .from(challenges)
      .leftJoin(
        userActions,
        and(
          eq(userActions.challengeId, challenges.id),
          eq(userActions.userId, userId),
        ),
      )
      .where(eq(challenges.campaignId, campaignId))
      .groupBy(challenges.id, challenges.valueInEuro)
      .having(
        sql`COUNT(${userActions.id}) > 0 AND COUNT(${userActions.id}) = COUNT(CASE WHEN ${userActions.completed} = true THEN 1 END)`,
      );

    // Calculer le total des défis complets
    const challengeTotal = challengeEarnings.reduce((sum, challenge) => {
      return sum + Number(challenge.valueInEuro);
    }, 0);

    // Gains des bonus quotidiens
    const bonusEarnings = await this.db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${dailyBonus.amount}), 0)`,
      })
      .from(dailyBonus)
      .where(
        and(
          eq(dailyBonus.userId, userId),
          eq(dailyBonus.campaignId, campaignId),
          eq(dailyBonus.status, 'approved'),
        ),
      );

    const bonusTotal = bonusEarnings[0]?.totalAmount || 0;

    return Number(challengeTotal) + Number(bonusTotal);
  }

  /**
   * Calcule la complétude des défis pour un FBO dans une campagne
   */
  private async calculateChallengeCompletion(
    userId: number,
    campaignId: number,
  ): Promise<{ completedChallenges: number; totalChallenges: number }> {
    // Nombre total de défis dans la campagne
    const totalChallenges = await this.db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(challenges)
      .where(eq(challenges.campaignId, campaignId));

    // Nombre de défis complétés (un défi est complet si toutes ses actions sont complétées)
    const challengeCompletion = await this.db
      .select({
        challengeId: challenges.id,
        totalActions: sql<number>`COUNT(${userActions.id})`,
        completedActions: sql<number>`COUNT(CASE WHEN ${userActions.completed} = true THEN 1 END)`,
      })
      .from(challenges)
      .leftJoin(
        userActions,
        and(
          eq(userActions.challengeId, challenges.id),
          eq(userActions.userId, userId),
        ),
      )
      .where(eq(challenges.campaignId, campaignId))
      .groupBy(challenges.id)
      .having(
        sql`COUNT(${userActions.id}) > 0 AND COUNT(${userActions.id}) = COUNT(CASE WHEN ${userActions.completed} = true THEN 1 END)`,
      );

    return {
      completedChallenges: challengeCompletion.length,
      totalChallenges: totalChallenges[0]?.count || 0,
    };
  }

  /**
   * === GESTION DES CONDITIONS DE DÉBLOCAGE ===
   */

  /**
   * Crée des conditions de déblocage pour une campagne
   */
  async createUnlockConditions(
    campaignId: number,
    conditions: CreateUnlockConditionDto[],
  ) {
    // Vérifier que la campagne existe
    const campaign = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (campaign.length === 0) {
      throw new NotFoundException('Campaign not found');
    }

    // Insérer toutes les conditions
    const createdConditions = await this.db
      .insert(campaignUnlockConditions)
      .values(
        conditions.map((condition, index) => ({
          campaignId,
          description: condition.description,
          displayOrder: condition.displayOrder ?? index + 1,
        })),
      )
      .returning();

    return createdConditions;
  }

  /**
   * Récupère toutes les conditions de déblocage d'une campagne
   */
  async getUnlockConditionsByCampaign(campaignId: number) {
    const conditions = await this.db
      .select()
      .from(campaignUnlockConditions)
      .where(eq(campaignUnlockConditions.campaignId, campaignId))
      .orderBy(campaignUnlockConditions.displayOrder);

    return conditions;
  }

  /**
   * Met à jour une condition de déblocage
   */
  async updateUnlockCondition(
    conditionId: number,
    updateDto: UpdateUnlockConditionDto,
  ) {
    const condition = await this.db
      .select()
      .from(campaignUnlockConditions)
      .where(eq(campaignUnlockConditions.id, conditionId))
      .limit(1);

    if (condition.length === 0) {
      throw new NotFoundException('Condition not found');
    }

    const updated = await this.db
      .update(campaignUnlockConditions)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(eq(campaignUnlockConditions.id, conditionId))
      .returning();

    return updated[0];
  }

  /**
   * Supprime une condition de déblocage
   */
  async deleteUnlockCondition(conditionId: number) {
    const condition = await this.db
      .select()
      .from(campaignUnlockConditions)
      .where(eq(campaignUnlockConditions.id, conditionId))
      .limit(1);

    if (condition.length === 0) {
      throw new NotFoundException('Condition not found');
    }

    await this.db
      .delete(campaignUnlockConditions)
      .where(eq(campaignUnlockConditions.id, conditionId));

    return { message: 'Condition deleted successfully' };
  }

  /**
   * Met à jour le fulfillment d'une condition pour une validation spécifique
   */
  async updateConditionFulfillment(
    validationId: number,
    conditionId: number,
    updateDto: UpdateConditionFulfillmentDto,
    managerId: number,
  ) {
    // Vérifier que la validation existe
    const validation = await this.db
      .select()
      .from(campaignValidations)
      .where(eq(campaignValidations.id, validationId))
      .limit(1);

    if (validation.length === 0) {
      throw new NotFoundException('Validation not found');
    }

    // Vérifier que le manager a le droit
    const canValidate = await this.canManagerValidateFBO(
      managerId,
      validation[0].userId,
    );
    if (!canValidate) {
      throw new ForbiddenException(
        'You do not have permission to validate this FBO',
      );
    }

    // Vérifier que la condition existe et appartient à la bonne campagne
    const condition = await this.db
      .select()
      .from(campaignUnlockConditions)
      .where(
        and(
          eq(campaignUnlockConditions.id, conditionId),
          eq(campaignUnlockConditions.campaignId, validation[0].campaignId),
        ),
      )
      .limit(1);

    if (condition.length === 0) {
      throw new NotFoundException(
        'Condition not found or does not belong to this campaign',
      );
    }

    // Créer ou mettre à jour le fulfillment
    const existingFulfillment = await this.db
      .select()
      .from(campaignValidationConditions)
      .where(
        and(
          eq(campaignValidationConditions.validationId, validationId),
          eq(campaignValidationConditions.conditionId, conditionId),
        ),
      )
      .limit(1);

    let fulfillment;
    if (existingFulfillment.length === 0) {
      // Créer
      const newFulfillment = await this.db
        .insert(campaignValidationConditions)
        .values({
          validationId,
          conditionId,
          isFulfilled: updateDto.isFulfilled,
          fulfilledAt: updateDto.isFulfilled ? new Date() : null,
          fulfilledBy: updateDto.isFulfilled ? managerId : null,
          comment: updateDto.comment,
        })
        .returning();
      fulfillment = newFulfillment[0];
    } else {
      // Mettre à jour
      const updated = await this.db
        .update(campaignValidationConditions)
        .set({
          isFulfilled: updateDto.isFulfilled,
          fulfilledAt: updateDto.isFulfilled ? new Date() : null,
          fulfilledBy: updateDto.isFulfilled ? managerId : null,
          comment: updateDto.comment,
          updatedAt: new Date(),
        })
        .where(eq(campaignValidationConditions.id, existingFulfillment[0].id))
        .returning();
      fulfillment = updated[0];
    }

    return fulfillment;
  }

  /**
   * Récupère tous les fulfillments pour une validation
   */
  async getConditionFulfillments(validationId: number) {
    const validation = await this.db
      .select()
      .from(campaignValidations)
      .where(eq(campaignValidations.id, validationId))
      .limit(1);

    if (validation.length === 0) {
      throw new NotFoundException('Validation not found');
    }

    // Récupérer toutes les conditions de la campagne
    const conditions = await this.getUnlockConditionsByCampaign(
      validation[0].campaignId,
    );

    // Récupérer les fulfillments existants
    const fulfillments = await this.db
      .select()
      .from(campaignValidationConditions)
      .where(eq(campaignValidationConditions.validationId, validationId));

    // Créer un map des fulfillments pour accès rapide
    const fulfillmentMap = new Map(fulfillments.map((f) => [f.conditionId, f]));

    // Combiner conditions avec leurs fulfillments
    return conditions.map((condition) => ({
      condition,
      fulfillment: fulfillmentMap.get(condition.id) || null,
    }));
  }

  /**
   * Vérifie si toutes les conditions d'une validation sont remplies
   */
  async checkAllConditionsFulfilled(validationId: number): Promise<boolean> {
    const validation = await this.db
      .select()
      .from(campaignValidations)
      .where(eq(campaignValidations.id, validationId))
      .limit(1);

    if (validation.length === 0) {
      throw new NotFoundException('Validation not found');
    }

    // Récupérer toutes les conditions de la campagne
    const conditions = await this.getUnlockConditionsByCampaign(
      validation[0].campaignId,
    );

    // Si aucune condition, on considère que c'est OK
    if (conditions.length === 0) {
      return true;
    }

    // Récupérer les fulfillments
    const fulfillments = await this.db
      .select()
      .from(campaignValidationConditions)
      .where(
        and(
          eq(campaignValidationConditions.validationId, validationId),
          eq(campaignValidationConditions.isFulfilled, true),
        ),
      );

    // Toutes les conditions doivent être remplies
    return fulfillments.length === conditions.length;
  }
}
