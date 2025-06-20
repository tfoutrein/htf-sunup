# 🚀 Guide de Démarrage Rapide

## Utiliser ce Template

### 1. Créer un Nouveau Projet

```bash
# Méthode 1: Cloner le template
git clone <url-du-template> mon-nouveau-projet
cd mon-nouveau-projet
rm -rf .git
git init

# Méthode 2: Utiliser GitHub Template
# Cliquer sur "Use this template" sur GitHub
```

### 2. Configuration Initiale

```bash
# Installer pnpm si pas déjà installé
npm install -g pnpm

# Installer les dépendances
pnpm install

# Copier la configuration d'environnement
cp .env.example .env

# Configurer les hooks Git
pnpm run prepare
```

### 3. Démarrage en 2 Minutes

```bash
# Option A: Développement local (recommandé)
# Démarrer PostgreSQL seul
docker-compose -f docker-compose.dev.yml up -d

# Configurer la base de données
pnpm db:migrate
pnpm db:seed

# Démarrer les applications
pnpm dev                    # Les deux en parallèle
# OU séparément :
pnpm back:dev              # Backend seul
pnpm front:dev             # Frontend seul
```

```bash
# Option B: Tout avec Docker
docker-compose up -d

# Attendre que les services démarrent, puis :
docker-compose exec backend npx drizzle-kit push:pg
docker-compose exec backend npx ts-node src/db/seed.ts
```

### 4. Vérification

Ouvrir dans le navigateur :

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## Personnalisation du Projet

### 1. Renommer le Projet

```bash
# Modifier package.json (racine)
{
  "name": "mon-nouveau-projet",
  "description": "Ma description"
}

# Modifier apps/frontend/package.json
{
  "name": "@mon-projet/frontend"
}

# Modifier apps/backend/package.json
{
  "name": "@mon-projet/backend"
}
```

### 2. Configuration Base de Données

Modifier `.env` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ma_db
```

### 3. URLs et Domaines

Modifier `.env` :

```env
NEXT_PUBLIC_API_URL=https://api.mon-domaine.com
FRONTEND_URL=https://mon-domaine.com
```

## Développement Quotidien

### Démarrage Rapide

```bash
# Démarrer la DB (une seule fois)
docker-compose -f docker-compose.dev.yml up -d

# Développement quotidien
pnpm dev          # Frontend + Backend en parallèle
# OU
pnpm back:dev     # Backend uniquement
pnpm front:dev    # Frontend uniquement
```

### Commandes Utiles

```bash
# Logs de la base de données
docker-compose -f docker-compose.dev.yml logs -f

# Reset de la DB
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
pnpm db:migrate
pnpm db:seed

# Arrêter tout
docker-compose -f docker-compose.dev.yml down
```

### Commits

```bash
# Utiliser les conventional commits
git add .
git commit -m "feat: add user authentication"
git commit -m "fix: resolve database connection issue"
git commit -m "docs: update API documentation"
```

## Structure Recommandée

### Ajout d'une nouvelle fonctionnalité

```bash
# Backend (Nest.js)
cd apps/backend
pnpm exec nest generate module ma-fonctionnalite
pnpm exec nest generate controller ma-fonctionnalite
pnpm exec nest generate service ma-fonctionnalite

# Frontend (Next.js)
# Créer dans apps/frontend/src/components/
# Créer dans apps/frontend/src/app/
```

### Ajout d'une dépendance

```bash
# Frontend uniquement
pnpm --filter frontend add ma-librairie

# Backend uniquement
pnpm --filter backend add ma-librairie

# Globale (monorepo)
pnpm add -w ma-librairie
```

## Bonnes Pratiques

### 1. Schéma de Base de Données

Modifier `apps/backend/src/db/schema.ts` puis :

```bash
pnpm db:migrate
```

### 2. Variables d'Environnement

Ajouter dans `.env.example` et documenter dans le README.

### 3. Types Partagés

Créer `packages/types` pour partager les types entre frontend et backend.

### 4. Tests

```bash
# Backend
cd apps/backend
pnpm test
pnpm test:e2e

# Ajouter des tests frontend selon les besoins
```

## Déploiement Rapide

### Préparation

```bash
# Build local
pnpm build

# Vérification
pnpm lint
pnpm type-check
```

### Docker Production

```bash
# Build des images
docker-compose build

# Test local en mode production
docker-compose up
```

### Variables d'Environnement Production

```env
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
NEXT_PUBLIC_API_URL=https://api.mon-domaine.com
FRONTEND_URL=https://mon-domaine.com
NODE_ENV=production
```

---

🎉 **Votre projet est prêt !** Consultez le README.md principal pour plus de détails.
