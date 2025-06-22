import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, desc } from 'drizzle-orm';
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
      status: 'draft',
    };

    const [campaign] = await this.db.db
      .insert(campaigns)
      .values(newCampaign)
      .returning();
    return campaign;
  }

  async findAll(): Promise<Campaign[]> {
    return await this.db.db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));
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
      throw new BadRequestException(
        'Impossible de supprimer une campagne qui contient des défis',
      );
    }

    await this.db.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    const today = new Date().toISOString().split('T')[0];

    return await this.db.db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.status, 'active'),
          eq(campaigns.startDate, today), // You might want to use <= for startDate and >= for endDate
        ),
      )
      .orderBy(campaigns.startDate);
  }
}
