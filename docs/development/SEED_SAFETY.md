# 🛡️ Sécurité du Script de Seed

## Vue d'ensemble

Le script `seed.ts` dispose d'une protection renforcée contre l'exécution accidentelle en production. Ce document explique comment fonctionne cette protection et comment l'utiliser correctement.

## 🔒 Protection Production

### Détection Automatique

Le script détecte automatiquement les environnements de production via :

1. **Variable d'environnement** : `NODE_ENV === 'production'`
2. **URL de base de données** : Hostname complet de la production Render
   - ✅ Spécifique : `dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com`
   - ❌ Plus de détection large comme `render.com` ou `htf_sunup_postgres`

### Comportement par Défaut

En production, le seed **se bloque immédiatement** :

```bash
🚨 ============================================
🚨 ERREUR CRITIQUE : SEED BLOQUÉ EN PRODUCTION
🚨 ============================================

❌ Le seed ne peut PAS être exécuté en production.
❌ Il supprimerait tous les utilisateurs réels !

💡 Le seed est réservé au développement local.
💡 En production, les utilisateurs existent déjà.
```

## ⚠️ Override de Sécurité

### Quand Utiliser

**ATTENTION** : L'override ne doit être utilisé que dans des cas **EXTRÊMEMENT RARES** :

- Reset complet d'un environnement de staging/test
- Migration de données avec backup complet
- **JAMAIS** en production avec des utilisateurs réels

### Comment Utiliser

```bash
# ⚠️ DANGER : Force le seed même en production
FORCE_SEED=true pnpm db:seed
```

Avec l'override activé, le script :

1. Affiche un avertissement critique
2. **Attend 5 secondes** pour permettre l'annulation (Ctrl+C)
3. Exécute le seed si non interrompu

### Exemple de Sortie

```bash
⚠️  ============================================
⚠️  ATTENTION : FORCE SEED ACTIVÉ EN PRODUCTION
⚠️  ============================================

⚠️  FORCE_SEED=true détecté.
⚠️  Le seed va s'exécuter malgré la détection production.
⚠️  Toutes les données seront SUPPRIMÉES !

⏳ Attente de 5 secondes pour annulation (Ctrl+C)...
```

## ✅ Développement Local

### Utilisation Normale

En local, le seed fonctionne sans restriction :

```bash
# Environnement local (localhost ou 127.0.0.1)
pnpm db:seed
```

Le script :

- ✅ S'exécute normalement
- ✅ Crée les utilisateurs de test
- ✅ Peuple la base avec des données de démo

### Bases de Développement

Les bases suivantes sont considérées comme **développement** :

- ✅ `localhost:5432`
- ✅ `127.0.0.1:5432`
- ✅ Toute autre base ne contenant PAS l'URL de production spécifique
- ✅ Bases de test/staging sur Render (URL différente)

## 🎯 Cas d'Usage Recommandés

### ✅ À Faire

1. **Développement local**

   ```bash
   docker-compose up -d postgres
   pnpm db:migrate
   pnpm db:seed  # ← Sûr et recommandé
   ```

2. **Reset de la base locale**

   ```bash
   pnpm db:reset  # Inclut migrate + seed
   ```

3. **Tests e2e**
   ```bash
   # Dans les scripts de test
   beforeAll(async () => {
     await runMigrations();
     await runSeed();  // ← Sûr dans les tests
   });
   ```

### ❌ À Ne Pas Faire

1. **Production réelle**

   ```bash
   # ❌ JAMAIS
   NODE_ENV=production pnpm db:seed

   # ❌ JAMAIS
   DATABASE_URL=postgresql://...render.com/... pnpm db:seed
   ```

2. **Sans backup**
   ```bash
   # ❌ JAMAIS sans backup préalable
   FORCE_SEED=true pnpm db:seed
   ```

## 🔧 Détails Techniques

### Code de Protection

```typescript
// Override explicite
const forceSeed = process.env.FORCE_SEED === 'true';

// Détection précise de la production
const isProductionDatabase =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes(
    'dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com',
  );

// Blocage si production ET pas de force
if (isProductionDatabase && !forceSeed) {
  console.error('🚨 SEED BLOQUÉ EN PRODUCTION');
  process.exit(1);
}

// Avertissement si force activé en production
if (forceSeed && isProductionDatabase) {
  console.warn('⚠️ FORCE SEED ACTIVÉ');
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
```

### Pourquoi Une Détection Spécifique ?

**Avant** (trop large) :

```typescript
// ❌ Bloquait les bases de dev avec "render.com" dans l'URL
connectionString.includes('render.com');
// ❌ Bloquait les bases de dev nommées "htf_sunup_postgres"
connectionString.includes('htf_sunup_postgres');
```

**Après** (précis) :

```typescript
// ✅ Cible uniquement la base de production exacte
connectionString.includes(
  'dpg-d1b8fsadbo4c73c9ier0-a.oregon-postgres.render.com',
);
```

## 📚 Références

- Script de seed : [`apps/backend/src/db/seed.ts`](../../apps/backend/src/db/seed.ts)
- Guide de démarrage rapide : [`QUICK_START.md`](QUICK_START.md)
- Guide de déploiement : [`../deployment/DEPLOYMENT.md`](../deployment/DEPLOYMENT.md)

## 🔄 Historique

- **v1.0** (Juillet 2025) : Protection initiale avec détection large
- **v2.0** (Octobre 2025) : Détection spécifique + override FORCE_SEED
  - Fix du bug de détection trop large
  - Ajout du délai de sécurité de 5 secondes
  - Documentation complète

---

**⚠️ RAPPEL IMPORTANT** : Le seed supprime TOUTES les données existantes. Utilisez-le uniquement en développement ou avec un backup complet en environnement de test/staging.
