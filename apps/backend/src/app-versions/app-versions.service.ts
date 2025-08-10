import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and } from 'drizzle-orm';
import { DatabaseService } from '../db/database.module';
import * as schema from '../db/schema';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { UpdateAppVersionDto } from './dto/update-app-version.dto';

@Injectable()
export class AppVersionsService {
  constructor(private readonly db: DatabaseService) {}

  // Créer une nouvelle version (pour le développement)
  async create(createAppVersionDto: CreateAppVersionDto) {
    const [version] = await this.db
      .insert(schema.appVersions)
      .values({
        version: createAppVersionDto.version,
        title: createAppVersionDto.title,
        releaseDate: createAppVersionDto.releaseDate,
        isActive: createAppVersionDto.isActive ?? true,
        isMajor: createAppVersionDto.isMajor ?? false,
        shortDescription: createAppVersionDto.shortDescription,
        fullReleaseNotes: createAppVersionDto.fullReleaseNotes,
      })
      .returning();

    return version;
  }

  // Récupérer toutes les versions (ordonnées par date de release desc)
  async findAll() {
    return await this.db
      .select()
      .from(schema.appVersions)
      .orderBy(desc(schema.appVersions.releaseDate));
  }

  // Récupérer les versions actives
  async findActive() {
    return await this.db
      .select()
      .from(schema.appVersions)
      .where(eq(schema.appVersions.isActive, true))
      .orderBy(desc(schema.appVersions.releaseDate));
  }

  // Récupérer une version par son ID
  async findOne(id: number) {
    const [version] = await this.db
      .select()
      .from(schema.appVersions)
      .where(eq(schema.appVersions.id, id));

    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    return version;
  }

  // Récupérer la dernière version active
  async findLatest() {
    const [latest] = await this.db
      .select()
      .from(schema.appVersions)
      .where(eq(schema.appVersions.isActive, true))
      .orderBy(desc(schema.appVersions.releaseDate))
      .limit(1);

    return latest;
  }

  // Vérifier si un utilisateur a vu une version spécifique
  async hasUserSeenVersion(userId: number, versionId: number) {
    const [tracking] = await this.db
      .select()
      .from(schema.userVersionTracking)
      .where(
        and(
          eq(schema.userVersionTracking.userId, userId),
          eq(schema.userVersionTracking.versionId, versionId),
          eq(schema.userVersionTracking.hasSeenPopup, true),
        ),
      );

    return !!tracking;
  }

  // Marquer une version comme vue par un utilisateur
  async markVersionAsSeen(userId: number, versionId: number) {
    // Vérifier si l'entrée existe déjà
    const [existingTracking] = await this.db
      .select()
      .from(schema.userVersionTracking)
      .where(
        and(
          eq(schema.userVersionTracking.userId, userId),
          eq(schema.userVersionTracking.versionId, versionId),
        ),
      );

    if (existingTracking) {
      // Mettre à jour l'entrée existante
      const [updated] = await this.db
        .update(schema.userVersionTracking)
        .set({
          hasSeenPopup: true,
          seenAt: new Date(),
        })
        .where(
          and(
            eq(schema.userVersionTracking.userId, userId),
            eq(schema.userVersionTracking.versionId, versionId),
          ),
        )
        .returning();

      return updated;
    } else {
      // Créer une nouvelle entrée
      const [created] = await this.db
        .insert(schema.userVersionTracking)
        .values({
          userId,
          versionId,
          hasSeenPopup: true,
          seenAt: new Date(),
        })
        .returning();

      return created;
    }
  }

  // Récupérer les versions non vues par un utilisateur
  async getUnseenVersionsForUser(userId: number) {
    // Récupérer toutes les versions actives
    const activeVersions = await this.findActive();

    // Récupérer les versions déjà vues par l'utilisateur
    const seenVersions = await this.db
      .select({
        versionId: schema.userVersionTracking.versionId,
      })
      .from(schema.userVersionTracking)
      .where(
        and(
          eq(schema.userVersionTracking.userId, userId),
          eq(schema.userVersionTracking.hasSeenPopup, true),
        ),
      );

    const seenVersionIds = seenVersions.map((sv) => sv.versionId);

    // Filtrer les versions non vues
    return activeVersions.filter((v) => !seenVersionIds.includes(v.id));
  }

  // Récupérer la plus récente version non vue par un utilisateur
  async getLatestUnseenVersionForUser(userId: number) {
    const unseenVersions = await this.getUnseenVersionsForUser(userId);
    return unseenVersions.length > 0 ? unseenVersions[0] : null;
  }

  // Mettre à jour une version
  async update(id: number, updateAppVersionDto: UpdateAppVersionDto) {
    const [updated] = await this.db
      .update(schema.appVersions)
      .set(updateAppVersionDto)
      .where(eq(schema.appVersions.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    return updated;
  }

  // Supprimer une version
  async remove(id: number) {
    const [deleted] = await this.db
      .delete(schema.appVersions)
      .where(eq(schema.appVersions.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    return deleted;
  }
}
