import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, desc, lte, gte, ne, count } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import {
  campaigns,
  challenges,
  actions,
  type Campaign,
  type NewCampaign,
} from '../db/schema';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    userId: number,
  ): Promise<Campaign> {
    const { startDate, endDate, ...rest } = createCampaignDto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    const newCampaign: NewCampaign = {
      ...rest,
      startDate,
      endDate,
      createdBy: userId,
      status: createCampaignDto.status || 'draft',
    };

    const [campaign] = await this.db.db
      .insert(campaigns)
      .values(newCampaign)
      .returning();
    return campaign;
  }

  async findAll(): Promise<
    (Campaign & { challengeCount: number; totalDays: number })[]
  > {
    const campaignList = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.archived, false))
      .orderBy(desc(campaigns.createdAt));

    // Pour chaque campagne, récupérer le nombre de défis et calculer le nombre de jours
    const campaignsWithStats = await Promise.all(
      campaignList.map(async (campaign) => {
        // Compter les défis de la campagne
        const [challengeCountResult] = await this.db.db
          .select({ count: count() })
          .from(challenges)
          .where(eq(challenges.campaignId, campaign.id));

        // Calculer le nombre de jours dans la campagne
        const startDate = new Date(campaign.startDate);
        const endDate = new Date(campaign.endDate);
        const timeDifference = endDate.getTime() - startDate.getTime();
        const totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // +1 pour inclure le jour de fin

        return {
          ...campaign,
          challengeCount: challengeCountResult.count,
          totalDays,
        };
      }),
    );

    return campaignsWithStats;
  }

  async findOne(id: number): Promise<Campaign> {
    const [campaign] = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));

    if (!campaign) {
      throw new NotFoundException(`Campagne avec l'ID ${id} non trouvée`);
    }

    return campaign;
  }

  async findWithChallenges(id: number) {
    const campaign = await this.findOne(id);

    const campaignChallenges = await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, id))
      .orderBy(challenges.date);

    return {
      ...campaign,
      challenges: campaignChallenges,
    };
  }

  async update(
    id: number,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    await this.findOne(id); // Check if exists

    const { startDate, endDate, ...rest } = updateCampaignDto;

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        );
      }
    }

    const updateData = {
      ...rest,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      updatedAt: new Date(),
    };

    const [updatedCampaign] = await this.db.db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id))
      .returning();

    return updatedCampaign;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists

    // Check if campaign has challenges
    const [challenge] = await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, id))
      .limit(1);

    if (challenge) {
      // Si la campagne a des défis, on l'archive au lieu de la supprimer
      await this.archive(id);
      return;
    }

    // Sinon, suppression réelle si pas de défis
    await this.db.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async archive(id: number): Promise<Campaign> {
    await this.findOne(id); // Check if exists

    const [archivedCampaign] = await this.db.db
      .update(campaigns)
      .set({
        archived: true,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    return archivedCampaign;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const today = new Date().toISOString().split('T')[0];

    console.log('🐛 getActiveCampaigns DEBUG:', {
      today,
      query:
        'campaigns with status=active, archived=false, startDate<=today, endDate>=today',
    });

    try {
      const result = await this.db.db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.status, 'active'),
            eq(campaigns.archived, false),
            lte(campaigns.startDate, today),
            gte(campaigns.endDate, today),
          ),
        )
        .orderBy(campaigns.startDate);

      console.log('🐛 getActiveCampaigns RESULT:', {
        count: result.length,
        campaigns: result.map((c) => ({
          id: c.id,
          name: c.name,
          startDate: c.startDate,
          endDate: c.endDate,
        })),
      });

      return result;
    } catch (error) {
      console.error('🐛 getActiveCampaigns ERROR:', error);
      throw error;
    }
  }
}
