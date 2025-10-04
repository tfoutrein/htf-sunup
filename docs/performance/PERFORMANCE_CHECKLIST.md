# ✅ Checklist - Optimisations Performance

Suivez cette checklist pour implémenter les optimisations de performance étape par étape.

---

## 🚀 Phase 1 - Quick Wins (30 minutes)

### Base de Données

- [ ] **Appliquer les indexes de performance**
  ```bash
  psql $DATABASE_URL -f apps/backend/drizzle/0011_add_performance_indexes.sql
  ```
  - [ ] Vérifier que les indexes sont créés: `psql $DATABASE_URL -c "\d+ users"`
  - [ ] Vérifier l'analyse des tables: `psql $DATABASE_URL -c "ANALYZE;"`

**Gain attendu**: +40% performance DB  
**Temps**: 5 minutes

---

### Backend - Fix N+1 Queries

- [ ] **Optimiser `getAllMembers()`**
  - [ ] Ouvrir `apps/backend/src/users/users.service.ts`
  - [ ] Aller à la ligne 370
  - [ ] Remplacer par JOIN (voir docs/PERFORMANCE_QUICK_START.md Section 3)
  - [ ] Tester: `curl http://localhost:3001/api/users/all-members`

**Gain attendu**: Réponse 800ms → 50ms (-94%)  
**Temps**: 10 minutes

---

### Backend - Activer le Cache

- [ ] **Installer les dépendances**

  ```bash
  cd apps/backend
  pnpm add @nestjs/cache-manager cache-manager
  ```

- [ ] **Configurer CacheModule**

  - [ ] Ouvrir `apps/backend/src/app.module.ts`
  - [ ] Importer `CacheModule` depuis `@nestjs/cache-manager`
  - [ ] Ajouter dans imports (voir cache-config.example.ts)

- [ ] **Implémenter dans UsersService**

  - [ ] Injecter `CACHE_MANAGER`
  - [ ] Cacher `getAllManagers()` pour 10 minutes
  - [ ] Invalider cache lors des updates

- [ ] **Tester le cache**

  ```bash
  # 1er appel (cache miss)
  time curl http://localhost:3001/api/public/users/managers

  # 2e appel (cache hit - devrait être plus rapide)
  time curl http://localhost:3001/api/public/users/managers
  ```

**Gain attendu**: +25% performance endpoints fréquents  
**Temps**: 10 minutes

---

### Frontend - Optimiser les Images

- [ ] **Configurer next.config.js**

  - [ ] Ouvrir `apps/frontend/next.config.js`
  - [ ] Comparer avec `next.config.optimized.example.js`
  - [ ] Ajouter la configuration images

- [ ] **Convertir les <img> tags**
  - [ ] Trouver tous les <img>: `grep -r "<img" apps/frontend/src/`
  - [ ] Remplacer par `<Image>` de next/image
  - [ ] Ajouter width/height requis
  - [ ] Tester visuellement

**Gain attendu**: -90% taille des images  
**Temps**: 5 minutes

---

### Test de Performance

- [ ] **Baseline avant optimisations**

  ```bash
  node scripts/test-api-performance.js > baseline.txt
  ```

- [ ] **Test après optimisations**
  ```bash
  node scripts/test-api-performance.js > optimized.txt
  diff baseline.txt optimized.txt
  ```

**Objectif**: Temps de réponse moyen < 200ms

---

## 🔧 Phase 2 - Optimisations Majeures (3-5 jours)

### Base de Données - CTE Récursives

- [ ] **Remplacer `getTeamHierarchy()`**

  - [ ] Ouvrir `apps/backend/src/users/users.service.ts`
  - [ ] Ligne 398-519
  - [ ] Implémenter CTE PostgreSQL (voir PERFORMANCE_AUDIT.md)
  - [ ] Tester avec équipe de test

- [ ] **Remplacer `getFullTeamList()`**
  - [ ] Même fichier, ligne 521-576
  - [ ] Utiliser CTE au lieu de récursion
  - [ ] Tester l'endpoint

**Gain attendu**: 3-5s → 100-200ms (-95%)  
**Temps**: 1 jour

---

### Backend - Endpoint Dashboard Unifié

- [ ] **Créer DashboardController**

  ```bash
  cd apps/backend/src
  nest g controller dashboard
  ```

- [ ] **Implémenter getDashboardData()**

  - [ ] Agréger: userActions, stats, streaks, badges, bonuses
  - [ ] Retourner en un seul objet
  - [ ] Tester: `GET /api/dashboard/data?campaignId=1`

- [ ] **Refactor Frontend**
  - [ ] Modifier `useDashboardData.ts`
  - [ ] Remplacer 5 appels par 1 seul
  - [ ] Tester le chargement

**Gain attendu**: 5 requêtes → 1 requête  
**Temps**: 1 jour

---

### Backend - Pagination

- [ ] **Créer PaginationDto**

  ```typescript
  // apps/backend/src/common/dto/pagination.dto.ts
  export class PaginationDto {
    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 20;
  }
  ```

- [ ] **Implémenter dans CampaignsService**

  - [ ] Méthode `findAllPaginated()`
  - [ ] Retourner data + pagination metadata

- [ ] **Implémenter dans ChallengesService**
- [ ] **Implémenter dans DailyBonusService**

- [ ] **Mettre à jour le Frontend**
  - [ ] Ajouter UI de pagination
  - [ ] Gérer state page/limit
  - [ ] Tester navigation

**Gain attendu**: Réduction payload 70-90%  
**Temps**: 1 jour

---

### Frontend - Mémorisation des Composants

- [ ] **StatisticsSection**

  - [ ] Wrap avec `memo()`
  - [ ] Utiliser `useMemo` pour calculs
  - [ ] Utiliser `useCallback` pour handlers
  - [ ] Tester re-renders (React DevTools Profiler)

- [ ] **CampaignList**

  - [ ] Même approche
  - [ ] Mémoriser filtres/tris

- [ ] **DailyBonusList**
  - [ ] Même approche
  - [ ] Mémoriser calculs de stats

**Gain attendu**: -50% re-renders inutiles  
**Temps**: 2-3 heures

---

### Frontend - Optimiser Aurora

- [ ] **Ajouter détection d'appareil**

  - [ ] Détecter mobile
  - [ ] Détecter CPU faible (< 4 cores)
  - [ ] Fallback CSS gradient

- [ ] **Limiter le framerate**

  - [ ] Passer de 60 FPS à 30 FPS
  - [ ] Implémenter lastFrame check

- [ ] **Pause hors vue**
  - [ ] IntersectionObserver
  - [ ] Pause animation si non visible

**Gain attendu**: -60% consommation CPU/GPU  
**Temps**: 30 minutes

---

### Frontend - Code Splitting

- [ ] **Dynamic imports pour modals**

  ```typescript
  const ValidationPopup = dynamic(() => import('./ValidationPopup'));
  ```

- [ ] **Lazy loading composants lourds**

  - [ ] Aurora component
  - [ ] Charts/graphs
  - [ ] Forms complexes

- [ ] **Route-based splitting** (déjà fait par Next.js)

**Gain attendu**: -30% bundle initial  
**Temps**: 1 heure

---

## 🏗️ Phase 3 - Infrastructure (1 semaine)

### Redis Cache Distribué

- [ ] **Setup Redis**

  ```bash
  docker run -d -p 6379:6379 redis:alpine
  ```

- [ ] **Installer dépendances**

  ```bash
  pnpm add cache-manager-redis-store redis
  ```

- [ ] **Configurer CacheModule**

  - [ ] remotePatterns avec store: redisStore
  - [ ] Configuration host/port/ttl

- [ ] **Migrer cache mémoire → Redis**
  - [ ] Tester persistence
  - [ ] Tester invalidation

**Gain attendu**: Cache partagé entre instances  
**Temps**: 1-2 jours

---

### Rate Limiting

- [ ] **Installer ThrottlerModule**

  ```bash
  pnpm add @nestjs/throttler
  ```

- [ ] **Configurer globalement**

  - [ ] 100 requêtes/minute par défaut

- [ ] **Protéger endpoints sensibles**
  - [ ] Login: 5 tentatives/minute
  - [ ] Register: 3 tentatives/heure
  - [ ] Upload: 10 uploads/minute

**Gain attendu**: Protection contre abus  
**Temps**: 4 heures

---

### Monitoring

- [ ] **Winston Logger**

  ```bash
  pnpm add nest-winston winston
  ```

  - [ ] Configurer transports
  - [ ] Logs fichiers (error.log, combined.log)

- [ ] **Sentry APM** (optionnel)

  - [ ] Compte gratuit (5K events/mois)
  - [ ] Backend + Frontend
  - [ ] Tracking erreurs + performance

- [ ] **Lighthouse CI**
  ```bash
  npm install -g @lhci/cli
  ```
  - [ ] Configuration lighthouserc.json
  - [ ] Intégrer dans CI/CD

**Gain attendu**: Visibilité production  
**Temps**: 1 jour

---

### PgBouncer

- [ ] **Setup Docker**

  ```yaml
  # docker-compose.yml
  pgbouncer:
    image: pgbouncer/pgbouncer
    # ... configuration
  ```

- [ ] **Configurer pools**

  - [ ] transaction mode
  - [ ] 25 connexions par pool
  - [ ] max 1000 clients

- [ ] **Pointer backend vers PgBouncer**
  - [ ] Port 6432 au lieu de 5432

**Gain attendu**: Gestion efficace connexions  
**Temps**: 4 heures

---

### Load Testing

- [ ] **Installer k6**

  ```bash
  brew install k6  # macOS
  # ou docker
  ```

- [ ] **Créer scénarios de test**

  - [ ] Login/Logout
  - [ ] Dashboard load
  - [ ] CRUD operations
  - [ ] Upload de preuves

- [ ] **Exécuter tests**

  ```bash
  k6 run load-test.js
  ```

- [ ] **Analyser résultats**
  - [ ] Identifier bottlenecks
  - [ ] Vérifier scalabilité

**Gain attendu**: Confiance en scalabilité  
**Temps**: 1 jour

---

## 📊 Validation Finale

### Métriques Cibles

- [ ] **Backend API**

  - [ ] Temps de réponse moyen < 100ms
  - [ ] P95 < 200ms
  - [ ] P99 < 500ms
  - [ ] Requêtes SQL par page < 10

- [ ] **Frontend**

  - [ ] Lighthouse Performance > 85
  - [ ] FCP < 1.0s
  - [ ] LCP < 2.0s
  - [ ] TTI < 2.5s
  - [ ] CLS < 0.1

- [ ] **Base de Données**
  - [ ] Toutes les requêtes indexées
  - [ ] Pas de N+1 queries
  - [ ] Temps de requête moyen < 50ms

---

## 🎯 Score Final

```
Phase 1 (Quick Wins)       [    ] → Score: __/100
Phase 2 (Optimisations)    [    ] → Score: __/100
Phase 3 (Infrastructure)   [    ] → Score: __/100

Score Global Performance:  __/100
```

**Objectifs**:

- MVP: > 70/100 ✅
- Production: > 85/100 ✅
- Scale: > 90/100 ✅

---

**Dernière mise à jour**: \***\*\_\_\_\*\***  
**Complété par**: \***\*\_\_\_\*\***  
**Validé par**: \***\*\_\_\_\*\***
