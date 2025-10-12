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
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

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

      return result;
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      throw error;
    }
  }

  // === GESTION DES VIDÉOS DE PRÉSENTATION ===

  async uploadPresentationVideo(
    id: number,
    file: Express.Multer.File,
  ): Promise<Campaign> {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const campaign = await this.findOne(id); // Vérifie que la campagne existe

    // Valider le type de fichier vidéo
    const allowedMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Type de fichier non supporté. Formats autorisés: MP4, WebM, MOV, AVI',
      );
    }

    // Limiter la taille du fichier (100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB en bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Fichier trop volumineux. Taille maximale: 100MB',
      );
    }

    // Supprimer l'ancienne vidéo si elle existe
    if (campaign.presentationVideoUrl) {
      try {
        const oldKey = campaign.presentationVideoUrl
          .split('/')
          .slice(-3)
          .join('/');
        await this.storageService.deleteFile(oldKey);
      } catch (error) {
        console.warn("Échec de suppression de l'ancienne vidéo:", error);
      }
    }

    // Générer la clé de stockage
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const key = `campaign-videos/${id}/${timestamp}.${fileExtension}`;

    // Uploader le fichier
    const videoUrl = await this.storageService.uploadFile(file, key);

    // Mettre à jour la campagne
    const [updatedCampaign] = await this.db.db
      .update(campaigns)
      .set({
        presentationVideoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    return updatedCampaign;
  }

  async deletePresentationVideo(id: number): Promise<Campaign> {
    const campaign = await this.findOne(id);

    if (!campaign.presentationVideoUrl) {
      throw new BadRequestException('Aucune vidéo de présentation à supprimer');
    }

    // Supprimer le fichier du stockage S3
    try {
      const key = campaign.presentationVideoUrl.split('/').slice(-3).join('/');
      await this.storageService.deleteFile(key);
    } catch (error) {
      console.error('Erreur lors de la suppression de la vidéo:', error);
      throw new BadRequestException(
        'Échec de la suppression de la vidéo du stockage',
      );
    }

    // Mettre à jour la campagne
    const [updatedCampaign] = await this.db.db
      .update(campaigns)
      .set({
        presentationVideoUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    return updatedCampaign;
  }

  // Obtenir une URL signée pour la vidéo de présentation (valide 1 heure)
  async getPresentationVideoSignedUrl(
    id: number,
  ): Promise<{ url: string } | null> {
    const campaign = await this.findOne(id);

    if (!campaign.presentationVideoUrl) {
      return null;
    }

    try {
      // Extraire la clé et le bucket du fichier depuis l'URL stockée
      const key = this.storageService.extractKeyFromUrl(
        campaign.presentationVideoUrl,
      );
      const bucket = this.storageService.extractBucketFromUrl(
        campaign.presentationVideoUrl,
      );

      if (!key || !bucket) {
        console.error(
          'Invalid video URL format:',
          campaign.presentationVideoUrl,
        );
        throw new Error('Format URL invalide');
      }

      console.log(`Generating signed URL for bucket: ${bucket}, key: ${key}`);

      // Générer l'URL signée valide pendant 1 heure avec le bon bucket
      const signedUrl = await this.storageService.getSignedUrl(
        key,
        3600,
        bucket,
      );
      return { url: signedUrl };
    } catch (error) {
      console.error('Erreur génération URL signée vidéo:', error);
      throw new BadRequestException("Impossible de générer l'URL de la vidéo");
    }
  }
}
