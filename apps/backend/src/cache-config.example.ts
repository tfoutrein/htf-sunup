/**
 * Configuration du cache pour améliorer les performances
 *
 * Installation:
 * 1. Copier ce fichier vers app.module.ts
 * 2. Importer CacheModule
 * 3. Ajouter dans les imports du module
 *
 * Usage dans les services:
 * @Inject(CACHE_MANAGER) private cacheManager: Cache
 */

import { CacheModule } from '@nestjs/cache-manager';

// Configuration à ajouter dans AppModule imports
export const cacheConfig = CacheModule.register({
  isGlobal: true,
  ttl: 300, // 5 minutes par défaut
  max: 100, // 100 entrées max en cache
});

/**
 * Exemple d'utilisation dans un service:
 *
 * import { CACHE_MANAGER } from '@nestjs/cache-manager';
 * import { Cache } from 'cache-manager';
 *
 * @Injectable()
 * export class ExampleService {
 *   constructor(
 *     @Inject(CACHE_MANAGER) private cacheManager: Cache,
 *   ) {}
 *
 *   async getCachedData(key: string): Promise<any> {
 *     // Vérifier le cache
 *     const cached = await this.cacheManager.get(key);
 *     if (cached) return cached;
 *
 *     // Récupérer les données
 *     const data = await this.fetchData();
 *
 *     // Mettre en cache
 *     await this.cacheManager.set(key, data, 600);
 *
 *     return data;
 *   }
 *
 *   async invalidateCache(key: string): Promise<void> {
 *     await this.cacheManager.del(key);
 *   }
 * }
 */
