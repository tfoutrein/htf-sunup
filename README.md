# HTF Sunup

Application de gestion des défis quotidiens pour la Happy Team Factory - Équipe d'entrepreneurs Forever Living.

**Objectif :** Gérer les campagnes de défis quotidiens pour booster l'activité des équipes pendant l'été 2025.

## 🏆 Fonctionnalités Principales

### Architecture des Défis

- **Campagnes** : Périodes définies (ex: "Les défis de l'été") contenant plusieurs défis
- **Défis quotidiens** : Ensemble de 1 à 6 actions à réaliser chaque jour
- **Actions** : Tâches individuelles (Vente, Recrutement, Réseaux sociaux)

### Rôles Utilisateurs

- **Marraine** (Aurélia) : Gestion globale des campagnes et supervision
- **Managers** : Co-gestion des campagnes et suivi de leurs équipes
- **FBO** : Validation des actions quotidiennes avec preuves

## 🚀 Stack Technique

- **Frontend**: Next.js 14 avec TypeScript et Tailwind CSS
- **Backend**: Nest.js avec TypeScript ✅
- **Base de données**: PostgreSQL avec Drizzle ORM ✅
- **Authentification**: JWT avec rôles (marraine/manager/fbo) ✅
- **Stockage**: S3 compatible (iDrive e2) pour les preuves d'actions ✅
- **Gestion d'état**: TanStack Query v5 pour le cache et la synchronisation ✅
- **Monorepo**: pnpm workspaces
- **Containerisation**: Docker & Docker Compose
- **API**: REST avec documentation Swagger

## 📁 Structure du Projet

```
htf-sunup/
├── apps/
│   ├── frontend/          # Application Next.js
│   │   ├── src/
│   │   │   ├── app/       # Pages par rôle (marraine, manager, fbo)
│   │   │   ├── components/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── backend/           # API Nest.js ✅
│       ├── src/
│       │   ├── auth/      # Authentification JWT ✅
│       │   ├── users/     # Gestion utilisateurs ✅
│       │   ├── campaigns/ # Gestion campagnes ✅
│       │   ├── challenges/# Gestion défis ✅
│       │   ├── actions/   # Gestion actions ✅
│       │   ├── user-actions/ # Actions utilisateurs & upload preuves ✅
│       │   ├── storage/   # Service S3 pour upload fichiers ✅
│       │   ├── db/        # Schema & migrations ✅
│       │   └── main.ts
│       ├── drizzle/       # Migrations Drizzle ✅
│       └── package.json
├── docs/                  # Documentation
│   └── MVP_PLAN.md       # Plan détaillé du MVP ✅
├── docker-compose.yml     # Configuration Docker complète
└── package.json          # Configuration monorepo
```

## 🏃‍♂️ Démarrage Rapide

### 1. Installation

```bash
# Cloner le projet
git clone <votre-repo> htf-sunup
cd htf-sunup

# Installer les dépendances
pnpm install
```

### 2. Démarrage avec Docker (Recommandé)

```bash
# Démarrer tous les services (PostgreSQL + Backend + Frontend)
docker-compose up -d

# Vérifier que les services sont démarrés
docker-compose ps

# Les migrations et le seed sont automatiquement appliqués
```

### 3. Développement Local (Alternative)

```bash
# Démarrer uniquement PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Appliquer les migrations
pnpm db:migrate

# Seed initial avec données de test
pnpm db:seed

# Démarrer le backend et frontend en parallèle
pnpm dev
```

## 🔧 Scripts Disponibles

### Scripts Globaux (racine)

```bash
pnpm dev          # Démarrer frontend et backend en parallèle
pnpm back:dev     # Démarrer uniquement le backend
pnpm front:dev    # Démarrer uniquement le frontend
pnpm build        # Build tous les apps
pnpm start        # Démarrer tous les apps en production

# Docker
pnpm docker:up    # docker-compose up -d
pnpm docker:down  # docker-compose down
pnpm docker:logs  # docker-compose logs -f

# Base de données
pnpm db:migrate   # Migrations Drizzle
pnpm db:seed      # Seed avec données de test
```

## 🌐 URLs et Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api (avec préfixe global /api)
- **API Documentation**: http://localhost:3001/api (Swagger)
- **PostgreSQL**: localhost:5432
- **Stockage S3**: https://b2y8.par5.idrivee2-11.com (iDrive e2)

## 🗄️ Base de Données ✅ **IMPLÉMENTÉE**

### Schéma Complet

```sql
-- Utilisateurs avec rôles
Users (id, name, email, password, role, manager_id)
├── Roles: 'marraine' | 'manager' | 'fbo'

-- Campagnes de défis (globales)
Campaigns (id, name, description, start_date, end_date, status, created_by)
├── Statuts: 'active' | 'inactive' | 'completed'

-- Défis quotidiens
Challenges (id, campaign_id, date, title, description)
├── Contrainte unicité (campaign_id, date)

-- Actions des défis
Actions (id, challenge_id, title, description, type, order)
├── Types: 'vente' | 'recrutement' | 'reseaux_sociaux'
├── Ordre: 1-6 actions par défi

-- Assignations et validations
UserActions (id, user_id, action_id, challenge_id, completed, proof_url)
```

### Données de Test

Le seed crée automatiquement :

- **1 Marraine** : aurelia@htf.com (mot de passe: `password`)
- **3 Managers** : jeromine@htf.com, gaelle@htf.com, audrey@htf.com
- **3 FBO** : marie@htf.com, pierre@htf.com, sophie@htf.com
- **1 Campagne active** : "Les défis de l'été de la Happy Team"
- **1 Défi** pour aujourd'hui avec 3 actions

## 🔄 API Backend ✅ **COMPLÈTE**

### Authentification

```bash
POST /api/auth/login    # Connexion (retourne JWT)
POST /api/auth/register # Inscription
```

### Endpoints Campagnes

```bash
GET    /campaigns           # Liste des campagnes
POST   /campaigns           # Créer une campagne
GET    /campaigns/active    # Campagnes actives
GET    /campaigns/:id       # Détails d'une campagne
GET    /campaigns/:id/challenges # Campagne avec ses défis
PATCH  /campaigns/:id       # Modifier une campagne
DELETE /campaigns/:id       # Supprimer une campagne
```

### Endpoints Défis

```bash
GET    /challenges          # Liste des défis (filtres disponibles)
POST   /challenges          # Créer un défi
GET    /challenges/today    # Défis du jour
GET    /challenges/:id      # Détails d'un défi
GET    /challenges/:id/actions # Défi avec ses actions
PATCH  /challenges/:id      # Modifier un défi
DELETE /challenges/:id      # Supprimer un défi
```

### Endpoints Actions

```bash
GET    /actions/challenge/:challengeId # Actions d'un défi
POST   /actions             # Créer une action (liée à un défi)
PATCH  /actions/:id         # Modifier une action
DELETE /actions/:id         # Supprimer une action
```

### Endpoints Utilisateurs

```bash
GET    /users              # Liste des utilisateurs
POST   /users              # Créer un utilisateur
GET    /users/:id          # Détails d'un utilisateur
PATCH  /users/:id          # Modifier un utilisateur
DELETE /users/:id          # Supprimer un utilisateur
```

### Test des Endpoints

```bash
# Authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aurelia@htf.com","password":"password"}'

# Utiliser le token retourné
export TOKEN="your-jwt-token"

# Tester les campagnes
curl -X GET http://localhost:3001/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Tester les défis du jour
curl -X GET http://localhost:3001/challenges/today \
  -H "Authorization: Bearer $TOKEN"
```

### Upload de Preuves d'Actions

```bash
# Upload d'une preuve (photo/vidéo) pour une action utilisateur
POST /api/user-actions/:id/proof   # Upload fichier avec FormData

# Obtenir les badges/statistiques utilisateur
GET  /api/actions/user/:userId/badges  # Badges et stats gamification
```

#### Test de l'Upload de Preuves

```bash
# Créer un FormData pour l'upload
curl -X POST http://localhost:3001/api/user-actions/1/proof \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"

# Réponse : UserAction mis à jour avec proofUrl
{
  "id": 1,
  "userId": 2,
  "actionId": 1,
  "completed": true,
  "proofUrl": "https://b2y8.par5.idrivee2-11.com/happy-team-factory/proofs/2/1-1735162800000.jpg"
}
```

## 📁 Stockage S3 (iDrive e2)

### Configuration

Le système utilise un stockage S3 compatible (iDrive e2) pour l'upload de preuves :

```bash
# Variables d'environnement requises dans .env
S3_ENDPOINT=https://b2y8.par5.idrivee2-11.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=happy-team-factory
```

### Structure des Fichiers

```
bucket/
└── proofs/
    └── {userId}/
        └── {actionId}-{timestamp}.{extension}
```

**Exemple** : `proofs/2/1-1735162800000.jpg`

### Types de Fichiers Supportés

- **Images** : JPG, JPEG, PNG, GIF, WebP
- **Vidéos** : MP4, MOV, AVI, WebM
- **Taille max** : 10MB par fichier

### Interface Utilisateur

Dans la modal de completion d'action, l'utilisateur peut :

1. **Sélectionner un fichier** via l'input file
2. **Voir le fichier sélectionné** avec nom et taille affichés
3. **Uploader la preuve** lors de la validation
4. **Accéder à l'URL publique** une fois uploadée

```typescript
// Exemple de feedback visuel après sélection
{proofFile && (
  <div className="mt-2 p-2 bg-gray-50 rounded-md border">
    <p className="text-sm text-gray-600">
      <span className="font-medium">Fichier sélectionné :</span> {proofFile.name}
    </p>
    <p className="text-xs text-gray-500 mt-1">
      Taille : {(proofFile.size / 1024 / 1024).toFixed(2)} MB
    </p>
  </div>
)}
```

## 🎯 État d'Implémentation

### ✅ **BACKEND COMPLET** (22 juin 2025)

- **Authentification JWT** : Système complet avec rôles
- **Base de données** : Schema complet avec migrations
- **API REST** : Tous les endpoints CRUD fonctionnels
- **Logique métier** : Validations, contraintes, relations
- **Tests** : Endpoints validés et fonctionnels
- **Documentation** : Swagger disponible

### ✅ **FRONTEND MODERNE** (25 juin 2025)

- **TanStack Query v5** : Gestion d'état serveur avec cache intelligent
- **Optimistic Updates** : Interface réactive avec mises à jour instantanées
- **Cache automatique** : Réduction des appels API et performance optimisée
- **Pages complètes** : Login, dashboards, gestion campagnes et défis
- **Composants réutilisables** : Système de design cohérent

### ✅ **UPLOAD PREUVES D'ACTIONS** (25 juin 2025)

- **Stockage S3** : Intégration iDrive e2 avec AWS SDK
- **Upload sécurisé** : Validation de fichiers et gestion des erreurs
- **Interface intuitive** : Feedback visuel avec nom et taille du fichier
- **Organisation des fichiers** : Structure hiérarchique par utilisateur
- **URLs publiques** : Accès direct aux preuves uploadées
- **Types de médias** : Support images et vidéos (JPG, PNG, MP4, etc.)
- **Configuration centralisée** : Variables d'environnement via .env

### 📋 **PROCHAINES ÉTAPES**

1. **Interface gestion campagnes** (marraine/managers)
2. **Dashboard FBO adapté** (défis de la campagne active)
3. **Vue hebdomadaire imprimable** (planning défis)

## 🛠️ Développement

### Authentification

Utilisez les comptes de test créés par le seed :

```bash
# Marraine (gestion globale)
Email: aurelia@htf.com
Password: password

# Manager (gestion d'équipe)
Email: jeromine@htf.com
Password: password

# FBO (validation d'actions)
Email: marie@htf.com
Password: password
```

### Ajout de Nouvelles Fonctionnalités

1. **Backend** : Créer module/service/contrôleur dans `apps/backend/src/`
2. **Frontend** : Ajouter pages/composants dans `apps/frontend/src/`
3. **Base de données** : Modifier `schema.ts` et générer migration

### Structure des Commits

```bash
feat: add campaign management interface
fix: resolve challenge date validation
docs: update API documentation
refactor: optimize challenge queries
```

## 🐳 Docker

### Services

- **postgres** : Base de données PostgreSQL
- **backend** : API Nest.js (port 3001)
- **frontend** : Application Next.js (port 3000)

### Commandes Utiles

```bash
# Logs en temps réel
docker-compose logs -f backend

# Accéder au conteneur
docker-compose exec backend bash

# Redémarrer un service
docker-compose restart backend

# Voir l'état des services
docker-compose ps
```

## 📊 Monitoring

### Logs d'Application

```bash
# Logs backend
docker-compose logs backend

# Logs base de données
docker-compose logs postgres
```

### Base de Données

```bash
# Connexion directe à PostgreSQL
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d htf_sunup_db

# Vérifier les données
SELECT * FROM campaigns;
SELECT * FROM challenges;
SELECT * FROM actions;
```

## 🚀 Déploiement

Le projet est configuré pour un déploiement automatique :

- **Frontend** : Vercel
- **Backend + PostgreSQL** : Render

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les détails.

## 📚 Documentation

- **Plan MVP** : [docs/MVP_PLAN.md](./docs/MVP_PLAN.md) - Plan détaillé du projet
- **API** : http://localhost:3001/api - Documentation Swagger
- **TanStack Query** : [docs/TANSTACK_QUERY_DOCUMENTATION.md](./docs/TANSTACK_QUERY_DOCUMENTATION.md) - Gestion du cache et état serveur
- **Déploiement** : [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement

## 🤝 Contribution

1. Créer une branche feature depuis `main`
2. Implémenter la fonctionnalité
3. Tester les endpoints avec Postman/curl
4. Commiter avec conventional commits
5. Créer une Pull Request

## 📝 Licence

Ce projet est sous licence MIT.

---

**HTF Sunup** - Gestion des défis quotidiens pour booster l'activité des équipes Forever Living 🌅
