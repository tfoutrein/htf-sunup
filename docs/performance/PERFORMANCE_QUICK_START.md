# 🚀 Guide Rapide - Optimisations Performance

Ce guide vous permet d'appliquer rapidement les optimisations critiques identifiées dans l'audit de performance.

---

## ⚡ Quick Wins (30 minutes)

### 1. Ajouter les Indexes Database (5 min)

```bash
cd apps/backend

# Appliquer le script SQL d'indexes
psql $DATABASE_URL -f drizzle/0011_add_performance_indexes.sql

# Ou via Docker si vous utilisez docker-compose
docker exec -i htf-sunup-postgres psql -U postgres -d htf_sunup_db < drizzle/0011_add_performance_indexes.sql
```

**Impact attendu**: Réduction de 30-50% du temps de réponse des requêtes DB

---

### 2. Tester les Performances API (5 min)

```bash
# Sans authentification (tests basiques)
node scripts/test-api-performance.js

# Avec authentification (tests complets)
# 1. Se connecter à l'app et récupérer le token depuis localStorage
# 2. Lancer le test avec le token
TEST_TOKEN="votre_token_jwt" node scripts/test-api-performance.js
```

**Résultats**:

- Temps de réponse moyen
- Endpoints les plus lents
- Recommandations automatiques

---

### 3. Optimiser getAllMembers() (10 min)

**Fichier**: `apps/backend/src/users/users.service.ts`

**Remplacer** (lignes 370-395):

```typescript
async getAllMembers(): Promise<any[]> {
  const fboMembers = await this.db
    .select()
    .from(users)
    .where(eq(users.role, 'fbo'));

  const membersWithManager = await Promise.all(
    fboMembers.map(async (member) => {
      let managerName = 'Aucun';
      if (member.managerId) {
        const manager = await this.findOne(member.managerId); // ❌ N+1 problem
        if (manager) {
          managerName = manager.name;
        }
      }
      return { ...member, managerName };
    }),
  );

  return membersWithManager;
}
```

**Par** (solution optimisée):

```typescript
async getAllMembers(): Promise<any[]> {
  // Import nécessaire en haut du fichier
  // import { sql } from 'drizzle-orm';

  const result = await this.db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      managerId: users.managerId,
      profilePicture: users.profilePicture,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      // Joindre le nom du manager directement
      managerName: sql<string>`COALESCE(manager.name, 'Aucun')`,
    })
    .from(users)
    .leftJoin(
      sql`users as manager`,
      sql`manager.id = ${users.managerId}`
    )
    .where(eq(users.role, 'fbo'))
    .orderBy(users.name);

  return result;
}
```

**Test**:

```bash
cd apps/backend
pnpm build
pnpm start:dev

# Vérifier que l'endpoint fonctionne
curl http://localhost:3001/api/users/all-members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Ajouter next/image (10 min)

**Fichier**: `apps/frontend/next.config.js`

**Ajouter**:

```javascript
const nextConfig = {
  // ... config existante
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Ajouter vos domaines d'images externes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.idrivee2-11.com',
      },
    ],
  },
};
```

**Remplacer les `<img>` par `<Image>`**:

Chercher tous les usages:

```bash
cd apps/frontend
grep -r "<img" src/
```

Exemple de conversion:

```tsx
// Avant
<img src="/logo1.png" alt="Logo" className="w-20 h-20" />;

// Après
import Image from 'next/image';

<Image
  src="/logo1.png"
  alt="Logo"
  width={80}
  height={80}
  className="w-20 h-20"
  priority // Pour les images above-the-fold
/>;
```

---

## 🔧 Optimisations Moyennes (2-3 heures)

### 5. Installer et Configurer Cache (30 min)

```bash
cd apps/backend

# Installer les dépendances
pnpm add @nestjs/cache-manager cache-manager
```

**Fichier**: `apps/backend/src/app.module.ts`

```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    // En haut avec les autres imports
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes par défaut
      max: 100, // 100 entrées max en cache
    }),
    // ... autres imports
  ],
})
```

**Utilisation dans les services**:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ... autres injections
  ) {}

  async getAllManagers(): Promise<User[]> {
    const cacheKey = 'managers:all';

    // Vérifier le cache
    const cached = await this.cacheManager.get<User[]>(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: managers');
      return cached;
    }

    // Requête DB
    const managers = await this.db
      .select()
      .from(users)
      .where(eq(users.role, 'manager'));

    // Mettre en cache pour 10 minutes
    await this.cacheManager.set(cacheKey, managers, 600);
    console.log('💾 Cached: managers');

    return managers;
  }

  // Invalider le cache lors de modifications
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    // Invalider le cache des managers si c'est un manager
    if (user[0].role === 'manager') {
      await this.cacheManager.del('managers:all');
      console.log('🗑️  Cache invalidated: managers');
    }

    return user[0];
  }
}
```

**Test**:

```bash
# Redémarrer le backend
pnpm start:dev

# Premier appel (cache miss)
time curl http://localhost:3001/api/public/users/managers

# Second appel (cache hit - devrait être plus rapide)
time curl http://localhost:3001/api/public/users/managers
```

---

### 6. Mémoriser les Composants React (1h)

**Composants prioritaires**:

- `StatisticsSection`
- `CampaignList`
- `DailyBonusList`

**Exemple**: `apps/frontend/src/components/dashboard/StatisticsSection.tsx`

```tsx
import { memo, useMemo } from 'react';

export const StatisticsSection = memo(({
  campaignStats,
  userStreaks,
  userBadges,
}: StatisticsSectionProps) => {
  // Mémoriser les calculs coûteux
  const badgesCount = useMemo(() => {
    return userBadges.filter(badge => badge.earned).length;
  }, [userBadges]);

  const streakDays = useMemo(() => {
    return userStreaks?.currentStreak || 0;
  }, [userStreaks]);

  // ... reste du composant identique

  return (
    // ... JSX identique
  );
});

StatisticsSection.displayName = 'StatisticsSection';
```

**Test**:

```bash
cd apps/frontend

# Installer React DevTools dans votre navigateur
# Ouvrir l'app et activer le Profiler
# Vérifier que les re-renders ont diminué
```

---

### 7. Optimiser Aurora Animation (30 min)

**Fichier**: `apps/frontend/src/components/ui/Aurora.tsx`

**Ajouter détection mobile et limitation FPS**:

```tsx
export function Aurora(props: AuroraProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    // Désactiver sur mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowPerf =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    setIsEnabled(!isMobile && !isLowPerf);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    const ctn = ctnDom.current;
    if (!ctn) return;

    // ... setup du renderer (code existant)

    const update = (t: number) => {
      animateId = requestAnimationFrame(update);

      // Limiter à 30 FPS
      const now = Date.now();
      if (now - lastFrameRef.current < 33) return;
      lastFrameRef.current = now;

      // ... reste de l'update (code existant)
    };

    // ... reste du code
  }, [isEnabled, amplitude]); // Ajouter isEnabled aux deps

  // Fallback pour mobile
  if (!isEnabled) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
    );
  }

  return <div ref={ctnDom} className="w-full h-full" />;
}
```

---

## 📊 Vérification des Résultats

### Avant de commencer

```bash
# Prendre des mesures baseline
node scripts/test-api-performance.js > baseline-results.txt
```

### Après optimisations

```bash
# Comparer les résultats
node scripts/test-api-performance.js > optimized-results.txt

# Comparer
diff baseline-results.txt optimized-results.txt
```

### Utiliser Lighthouse

```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Tester le frontend
lighthouse http://localhost:3000 \
  --only-categories=performance \
  --output=html \
  --output-path=./lighthouse-report.html

# Ouvrir le rapport
open lighthouse-report.html
```

---

## 🎯 Résultats Attendus

### Base de Données

- ✅ Indexes créés sur toutes les colonnes critiques
- ✅ Requêtes 30-50% plus rapides
- ✅ Pas de N+1 queries

### Backend API

- ✅ Temps de réponse moyen < 200ms
- ✅ Cache actif sur endpoints fréquents
- ✅ Logs de performance visibles

### Frontend

- ✅ Images optimisées (WebP/AVIF)
- ✅ Composants mémorisés
- ✅ Animation Aurora optimisée
- ✅ Lighthouse Performance Score > 80

---

## ❓ Troubleshooting

### Les indexes ne s'appliquent pas

```bash
# Vérifier que les indexes existent
psql $DATABASE_URL -c "\d+ users"

# Forcer l'analyse des tables
psql $DATABASE_URL -c "ANALYZE;"
```

### Le cache ne fonctionne pas

```bash
# Vérifier les logs du backend
cd apps/backend
pnpm start:dev

# Chercher les logs "Cache hit" ou "Cached"
```

### Images Next.js ne s'affichent pas

```bash
# Vérifier la config
cat apps/frontend/next.config.js

# Vérifier les erreurs console dans le navigateur
# Souvent liées aux dimensions width/height manquantes
```

---

## 📞 Support

Pour plus de détails, consultez:

- 📄 [Audit Complet](./PERFORMANCE_AUDIT.md)
- 📚 [Documentation API](../api/API_DOCUMENTATION.md)
- 🚀 [Guide de Déploiement](../deployment/DEPLOYMENT.md)

---

**Dernière mise à jour**: 4 Octobre 2025
