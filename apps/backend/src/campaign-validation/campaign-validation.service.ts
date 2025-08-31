import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
  campaignValidations,
  users,
  campaigns,
  challenges,
  userActions,
  dailyBonus,
} from '../db/schema';
import { UpdateCampaignValidationDto } from './dto/update-campaign-validation.dto';
import { CampaignValidationResponseDto } from './dto/campaign-validation-response.dto';

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

    if (validation.length === 0) {
      // Créer une nouvelle validation
      const newValidation = await this.db
        .insert(campaignValidations)
        .values({
          userId,
          campaignId,
          status: updateDto.status,
          validatedBy: updateDto.status !== 'pending' ? managerId : null,
          validatedAt: updateDto.status !== 'pending' ? new Date() : null,
          comment: updateDto.comment,
        })
        .returning();

      validation = newValidation;
    } else {
      // Mettre à jour la validation existante
      const updatedValidation = await this.db
        .update(campaignValidations)
        .set({
          status: updateDto.status,
          validatedBy: updateDto.status !== 'pending' ? managerId : null,
          validatedAt: updateDto.status !== 'pending' ? new Date() : null,
          comment: updateDto.comment,
          updatedAt: new Date(),
        })
        .where(eq(campaignValidations.id, validation[0].id))
        .returning();

      validation = updatedValidation;
    }

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
}
