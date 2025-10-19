import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import { UsersService } from '../users/users.service';
import {
  dailyBonus,
  campaignBonusConfig,
  campaigns,
  users,
  type DailyBonus,
  type NewDailyBonus,
  type CampaignBonusConfig,
  type NewCampaignBonusConfig,
} from '../db/schema';
import { CreateDailyBonusDto, BonusType } from './dto/create-daily-bonus.dto';
import { UpdateDailyBonusDto, BonusStatus } from './dto/update-daily-bonus.dto';
import {
  CreateCampaignBonusConfigDto,
  UpdateCampaignBonusConfigDto,
} from './dto/campaign-bonus-config.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DailyBonusService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
  ) {}

  // === GESTION DES DAILY BONUS ===

  async create(
    createDailyBonusDto: CreateDailyBonusDto & { userId: number },
  ): Promise<DailyBonus> {
    const { campaignId, bonusDate, bonusType, amount, userId, proofUrl } =
      createDailyBonusDto;

    // Vérifier que la campagne existe et est active
    const [campaign] = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException(
        `Campagne avec l'ID ${campaignId} non trouvée`,
      );
    }

    // Vérifier que les bonus sont activés pour cette campagne
    if (!campaign.bonusesEnabled) {
      throw new BadRequestException(
        'Les bonus quotidiens ne sont pas autorisés pour cette campagne',
      );
    }

    if (campaign.status !== 'active' || campaign.archived) {
      throw new BadRequestException("La campagne n'est pas active");
    }

    // Vérifier que la date est dans la période de campagne
    if (bonusDate < campaign.startDate || bonusDate > campaign.endDate) {
      throw new BadRequestException(
        'La date du bonus doit être dans la période de campagne',
      );
    }

    // Suppression de la vérification de doublon - on peut maintenant avoir plusieurs bonus du même type par jour

    const newDailyBonus: NewDailyBonus = {
      userId,
      campaignId,
      bonusDate,
      bonusType,
      amount,
      proofUrl: proofUrl || null,
      status: 'approved', // Directement approuvé - plus de système d'approbation
    };

    const [dailyBonusRecord] = await this.db.db
      .insert(dailyBonus)
      .values(newDailyBonus)
      .returning();

    return dailyBonusRecord;
  }

  async findOne(id: number): Promise<DailyBonus> {
    const [bonus] = await this.db.db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.id, id));

    if (!bonus) {
      throw new NotFoundException(`Bonus quotidien avec l'ID ${id} non trouvé`);
    }

    return bonus;
  }

  async findUserDailyBonuses(
    userId: number,
    campaignId?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<DailyBonus[]> {
    let whereConditions = [eq(dailyBonus.userId, userId)];

    if (campaignId) {
      whereConditions.push(eq(dailyBonus.campaignId, campaignId));
    }

    if (startDate) {
      whereConditions.push(gte(dailyBonus.bonusDate, startDate));
    }

    if (endDate) {
      whereConditions.push(lte(dailyBonus.bonusDate, endDate));
    }

    return await this.db.db
      .select()
      .from(dailyBonus)
      .where(and(...whereConditions))
      .orderBy(desc(dailyBonus.bonusDate), desc(dailyBonus.createdAt));
  }

  async findCampaignDailyBonuses(
    campaignId: number,
    managerId?: number,
  ): Promise<any[]> {
    // Si un managerId est fourni, on filtre par ses FBO
    let query = this.db.db
      .select({
        bonus: dailyBonus,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(dailyBonus)
      .innerJoin(users, eq(dailyBonus.userId, users.id))
      .where(eq(dailyBonus.campaignId, campaignId));

    if (managerId) {
      query = query.where(
        and(
          eq(dailyBonus.campaignId, campaignId),
          eq(users.managerId, managerId),
        ),
      );
    }

    return await query.orderBy(
      desc(dailyBonus.bonusDate),
      desc(dailyBonus.createdAt),
    );
  }

  async findUserCampaignBonuses(
    userId: number,
    campaignId: number,
    managerId: number,
  ): Promise<DailyBonus[]> {
    console.log('🐛 findUserCampaignBonuses called with:', {
      userId,
      campaignId,
      managerId,
    });

    // Vérifier que l'utilisateur existe
    const user = await this.db.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    console.log('🐛 findUserCampaignBonuses user found:', user[0]);

    if (!user[0]) {
      console.log('🐛 findUserCampaignBonuses - User not found');
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur fait partie de l'équipe complète du manager (hiérarchie)
    const isInTeam = await this.usersService.isMemberInTeam(userId, managerId);

    console.log('🐛 findUserCampaignBonuses isInTeam:', isInTeam);

    if (!isInTeam) {
      console.log(
        '🐛 findUserCampaignBonuses - User not in manager team hierarchy',
      );
      throw new NotFoundException(
        'Utilisateur non trouvé ou pas dans votre équipe',
      );
    }

    // Récupérer les bonus de cet utilisateur pour cette campagne
    const bonuses = await this.db.db
      .select()
      .from(dailyBonus)
      .where(
        and(
          eq(dailyBonus.userId, userId),
          eq(dailyBonus.campaignId, campaignId),
        ),
      )
      .orderBy(desc(dailyBonus.bonusDate), desc(dailyBonus.createdAt));

    console.log('🐛 findUserCampaignBonuses bonuses found:', bonuses.length);
    return bonuses;
  }

  async update(
    id: number,
    updateDailyBonusDto: UpdateDailyBonusDto,
    reviewerId?: number,
  ): Promise<DailyBonus> {
    await this.findOne(id); // Vérifier que le bonus existe

    const updateData: any = {
      ...updateDailyBonusDto,
      updatedAt: new Date(),
    };

    // Si le statut change, ajouter les informations de révision
    if (updateDailyBonusDto.status && reviewerId) {
      updateData.reviewedBy = reviewerId;
      updateData.reviewedAt = new Date();
    }

    const [updatedBonus] = await this.db.db
      .update(dailyBonus)
      .set(updateData)
      .where(eq(dailyBonus.id, id))
      .returning();

    return updatedBonus;
  }

  async remove(id: number, userId: number): Promise<void> {
    const bonus = await this.findOne(id);

    // Seul le créateur peut supprimer son bonus
    if (bonus.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres bonus',
      );
    }

    // Maintenant tous les bonus sont automatiquement approuvés, on peut les supprimer
    await this.db.db.delete(dailyBonus).where(eq(dailyBonus.id, id));
  }

  // === GESTION DES PREUVES PHOTO ===

  async uploadProof(
    id: number,
    file: Express.Multer.File,
    userId: number,
  ): Promise<DailyBonus> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const bonus = await this.findOne(id);

    // Vérifier que l'utilisateur peut modifier ce bonus
    if (bonus.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres bonus',
      );
    }

    const fileExtension = file.originalname.split('.').pop();
    const key = `daily-bonus-proofs/${userId}/${id}-${Date.now()}.${fileExtension}`;

    const proofUrl = await this.storageService.uploadFile(file, key);

    const [updatedBonus] = await this.db.db
      .update(dailyBonus)
      .set({ proofUrl, updatedAt: new Date() })
      .where(eq(dailyBonus.id, id))
      .returning();

    return updatedBonus;
  }

  async getProofUrl(id: number): Promise<{ url: string }> {
    const bonus = await this.findOne(id);

    if (!bonus.proofUrl) {
      throw new NotFoundException('Aucune preuve trouvée pour ce bonus');
    }

    try {
      const key = this.storageService.extractKeyFromUrl(bonus.proofUrl);

      if (!key) {
        throw new BadRequestException('URL de preuve invalide');
      }

      const signedUrl = await this.storageService.getSignedUrl(key, 3600);
      return { url: signedUrl };
    } catch (error) {
      console.error('Error generating proof URL:', error);
      throw new BadRequestException("Impossible de générer l'URL de preuve");
    }
  }

  // === GESTION DE LA CONFIGURATION DES BONUS PAR CAMPAGNE ===

  async createBonusConfig(
    createConfigDto: CreateCampaignBonusConfigDto,
  ): Promise<CampaignBonusConfig> {
    const { campaignId, basketBonusAmount, sponsorshipBonusAmount } =
      createConfigDto;

    // Vérifier que la campagne existe
    const [campaign] = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException(
        `Campagne avec l'ID ${campaignId} non trouvée`,
      );
    }

    // Vérifier qu'il n'y a pas déjà une config pour cette campagne
    const [existingConfig] = await this.db.db
      .select()
      .from(campaignBonusConfig)
      .where(eq(campaignBonusConfig.campaignId, campaignId));

    if (existingConfig) {
      throw new BadRequestException(
        'Une configuration existe déjà pour cette campagne',
      );
    }

    const newConfig: NewCampaignBonusConfig = {
      campaignId,
      basketBonusAmount,
      sponsorshipBonusAmount,
    };

    const [config] = await this.db.db
      .insert(campaignBonusConfig)
      .values(newConfig)
      .returning();

    return config;
  }

  async getBonusConfig(campaignId: number): Promise<CampaignBonusConfig> {
    const [config] = await this.db.db
      .select()
      .from(campaignBonusConfig)
      .where(eq(campaignBonusConfig.campaignId, campaignId));

    if (!config) {
      // Créer une config par défaut si elle n'existe pas
      const defaultConfig: NewCampaignBonusConfig = {
        campaignId,
        basketBonusAmount: '1.00',
        sponsorshipBonusAmount: '5.00',
      };

      const [newConfig] = await this.db.db
        .insert(campaignBonusConfig)
        .values(defaultConfig)
        .returning();

      return newConfig;
    }

    return config;
  }

  async updateBonusConfig(
    campaignId: number,
    updateConfigDto: UpdateCampaignBonusConfigDto,
  ): Promise<CampaignBonusConfig> {
    // Vérifier que la config existe (ou la créer)
    await this.getBonusConfig(campaignId);

    const [updatedConfig] = await this.db.db
      .update(campaignBonusConfig)
      .set({
        ...updateConfigDto,
        updatedAt: new Date(),
      })
      .where(eq(campaignBonusConfig.campaignId, campaignId))
      .returning();

    return updatedConfig;
  }

  // === UTILITAIRES ===

  async getUserDailyBonusStats(
    userId: number,
    campaignId: number,
  ): Promise<{
    totalBonuses: number;
    totalAmount: string;
    pendingBonuses: number;
    approvedBonuses: number;
    rejectedBonuses: number;
    basketBonuses: number;
    sponsorshipBonuses: number;
  }> {
    const bonuses = await this.findUserDailyBonuses(userId, campaignId);

    const stats = {
      totalBonuses: bonuses.length,
      totalAmount: bonuses
        .reduce((sum, b) => sum + parseFloat(b.amount), 0) // Compter tous les bonus (plus de filtrage sur approved)
        .toFixed(2),
      pendingBonuses: bonuses.filter((b) => b.status === 'pending').length,
      approvedBonuses: bonuses.filter((b) => b.status === 'approved').length,
      rejectedBonuses: bonuses.filter((b) => b.status === 'rejected').length,
      basketBonuses: bonuses.filter((b) => b.bonusType === 'basket').length,
      sponsorshipBonuses: bonuses.filter((b) => b.bonusType === 'sponsorship')
        .length,
    };

    return stats;
  }
}
