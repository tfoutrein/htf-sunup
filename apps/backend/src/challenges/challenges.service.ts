import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import {
  challenges,
  actions,
  campaigns,
  type Challenge,
  type NewChallenge,
} from '../db/schema';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(private readonly db: DatabaseService) {}

  async create(createChallengeDto: CreateChallengeDto): Promise<Challenge> {
    const { campaignId, ...rest } = createChallengeDto;

    // Verify campaign exists
    const [campaign] = await this.db.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));

    if (!campaign) {
      throw new NotFoundException(
        `Campagne avec l'ID ${campaignId} non trouvée`,
      );
    }

    // Check if challenge already exists for this date
    const [existingChallenge] = await this.db.db
      .select()
      .from(challenges)
      .where(
        and(
          eq(challenges.campaignId, campaignId),
          eq(challenges.date, createChallengeDto.date),
        ),
      );

    if (existingChallenge) {
      throw new BadRequestException(
        `Un défi existe déjà pour la date ${createChallengeDto.date} dans cette campagne`,
      );
    }

    const newChallenge: NewChallenge = {
      campaignId,
      ...rest,
    };

    const [challenge] = await this.db.db
      .insert(challenges)
      .values(newChallenge)
      .returning();
    return challenge;
  }

  async findAll(): Promise<Challenge[]> {
    return await this.db.db
      .select()
      .from(challenges)
      .orderBy(desc(challenges.date));
  }

  async findByCampaign(campaignId: number): Promise<Challenge[]> {
    return await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.campaignId, campaignId))
      .orderBy(challenges.date);
  }

  async findOne(id: number): Promise<Challenge> {
    const [challenge] = await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id));

    if (!challenge) {
      throw new NotFoundException(`Défi avec l'ID ${id} non trouvé`);
    }

    return challenge;
  }

  async findWithActions(id: number) {
    const challenge = await this.findOne(id);

    const challengeActions = await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, id))
      .orderBy(actions.order);

    return {
      ...challenge,
      actions: challengeActions,
    };
  }

  async findByDate(date: string): Promise<Challenge[]> {
    return await this.db.db
      .select()
      .from(challenges)
      .where(eq(challenges.date, date))
      .orderBy(challenges.campaignId);
  }

  async update(
    id: number,
    updateChallengeDto: UpdateChallengeDto,
  ): Promise<Challenge> {
    await this.findOne(id); // Check if exists

    const updateData = {
      ...updateChallengeDto,
      updatedAt: new Date(),
    };

    const [updatedChallenge] = await this.db.db
      .update(challenges)
      .set(updateData)
      .where(eq(challenges.id, id))
      .returning();

    return updatedChallenge;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists

    // Check if challenge has actions
    const [action] = await this.db.db
      .select()
      .from(actions)
      .where(eq(actions.challengeId, id))
      .limit(1);

    if (action) {
      throw new BadRequestException(
        'Impossible de supprimer un défi qui contient des actions',
      );
    }

    await this.db.db.delete(challenges).where(eq(challenges.id, id));
  }

  async getTodayChallenges(): Promise<Challenge[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.findByDate(today);
  }
}
