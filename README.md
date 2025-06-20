# Next.js + Nest.js Template

Template de projet full-stack avec Next.js en frontend, Nest.js en backend et PostgreSQL comme base de données, le tout dans une architecture monorepo.

## 🚀 Stack Technique

- **Frontend**: Next.js 14 avec TypeScript et Tailwind CSS
- **Backend**: Nest.js avec TypeScript
- **Base de données**: PostgreSQL avec Drizzle ORM
- **Monorepo**: pnpm workspaces
- **Containerisation**: Docker & Docker Compose
- **Linting**: ESLint + Prettier
- **Commits**: Conventional Commits avec Commitlint et Husky

## 📁 Structure du Projet

```
next-nest-template/
├── apps/
│   ├── frontend/          # Application Next.js
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── backend/           # API Nest.js
│       ├── src/
│       │   ├── db/
│       │   ├── users/
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── package.json
│       └── Dockerfile
├── packages/              # Packages partagés (vide pour l'instant)
├── docker-compose.yml     # Configuration Docker complète
├── docker-compose.dev.yml # Base de données seule pour dev local
├── package.json           # Configuration monorepo
└── pnpm-workspace.yaml    # Configuration pnpm workspaces
```

## 🏃‍♂️ Démarrage Rapide

### 1. Installation

```bash
# Cloner le template
git clone <votre-repo> mon-projet
cd mon-projet

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env
```

### 2. Développement Local (Recommandé)

```bash
# Démarrer uniquement PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# Installer les dépendances
pnpm install

# Créer les tables de base de données
pnpm db:migrate

# Seed initial de la base de données
pnpm db:seed

# Démarrer le backend et frontend en parallèle
pnpm dev
```

### 3. Développement avec Docker (Alternative)

```bash
# Démarrer tous les services
docker-compose up

# Dans un autre terminal, créer les tables
docker-compose exec backend pnpm db:migrate

# Seed initial
docker-compose exec backend pnpm db:seed
```

## 🔧 Scripts Disponibles

### Scripts Globaux (racine)

```bash
pnpm dev          # Démarrer frontend et backend en parallèle
pnpm back:dev     # Démarrer uniquement le backend
pnpm front:dev    # Démarrer uniquement le frontend
pnpm build        # Build tous les apps
pnpm start        # Démarrer tous les apps en production
pnpm lint         # Linter tous les apps
pnpm type-check   # Vérification TypeScript
pnpm test         # Tests de tous les apps

# Docker
pnpm docker:up    # docker-compose up -d
pnpm docker:down  # docker-compose down
pnpm docker:logs  # docker-compose logs -f

# Base de données
pnpm db:migrate   # Migrations Drizzle
pnpm db:seed      # Seed initial
```

### Scripts Frontend

```bash
cd apps/frontend
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Build pour production
pnpm start        # Serveur de production
pnpm lint         # ESLint
pnpm type-check   # TypeScript check
```

### Scripts Backend

```bash
cd apps/backend
pnpm dev          # Nest.js dev server (port 3001)
pnpm build        # Build pour production
pnpm start        # Serveur de production
pnpm start:prod   # Serveur de production optimisé
pnpm lint         # ESLint
pnpm test         # Tests Jest
pnpm test:e2e     # Tests end-to-end
```

## 🌐 URLs et Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api (Swagger)
- **PostgreSQL**: localhost:5432

## 🗄️ Base de Données

### Configuration

La base de données utilise Drizzle ORM avec PostgreSQL. La configuration se trouve dans :

- `apps/backend/src/db/schema.ts` - Schéma des tables
- `apps/backend/drizzle.config.ts` - Configuration Drizzle
- `apps/backend/src/db/database.module.ts` - Module NestJS

### Migrations

```bash
# Générer et appliquer les migrations
pnpm db:migrate

# Seed de développement
pnpm db:seed
```

## 🔄 API Backend

L'API Nest.js fournit :

### Endpoints Principaux

- `GET /` - Hello World
- `GET /health` - Health check
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `GET /api/users/:id` - Récupérer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Documentation API

Swagger disponible sur http://localhost:3001/api

## 🎨 Frontend

Le frontend Next.js utilise :

- **App Router** - Nouveau système de routing Next.js 13+
- **Tailwind CSS** - Framework CSS utilitaire
- **TypeScript** - Typage statique
- **Composants** - Structure modulaire

## 🛠️ Développement

### Conventional Commits

Le projet utilise les conventional commits avec Commitlint :

```bash
feat: add user management
fix: resolve database connection issue
docs: update README
style: format code with prettier
refactor: reorganize user service
test: add user controller tests
```

### Hooks Git

- **pre-commit**: Lint-staged pour formatter et vérifier le code
- **commit-msg**: Validation des messages de commit

### Linting et Formatting

```bash
# Linter tout le projet
pnpm lint

# Formatter avec Prettier (automatique avec pre-commit)
pnpm exec prettier --write .
```

## 🐳 Docker

### Développement

```bash
# Base de données seule
docker-compose -f docker-compose.dev.yml up -d

# Stack complète
docker-compose up
```

### Production

```bash
# Build des images
docker-compose build

# Démarrage en production
docker-compose up -d
```

## 🚀 Déploiement

### Variables d'Environnement

Créer un fichier `.env` basé sur `.env.example` :

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXT_PUBLIC_API_URL=https://api.mondomaine.com
PORT=3001
FRONTEND_URL=https://mondomaine.com
```

### Build pour Production

```bash
# Build tous les apps
pnpm build

# Ou individuellement
pnpm --filter frontend build
pnpm --filter backend build
```

## 🧪 Tests

```bash
# Tests backend
cd apps/backend
pnpm test
pnpm test:e2e
pnpm test:cov

# Tests peuvent être ajoutés au frontend selon les besoins
```

## 📦 Ajout de Packages

### Package global (monorepo)

```bash
pnpm add -w nom-du-package
```

### Package spécifique à une app

```bash
# Frontend
pnpm --filter frontend add nom-du-package

# Backend
pnpm --filter backend add nom-du-package
```

## 🔧 Personnalisation

### Ajouter une nouvelle app

1. Créer le dossier dans `apps/`
2. Ajouter le `package.json` avec le nom `@template/nom-app`
3. Ajouter les scripts dans le `package.json` racine si nécessaire

### Ajouter un package partagé

1. Créer le dossier dans `packages/`
2. Créer le `package.json` avec le nom `@template/nom-package`
3. L'importer dans les apps : `import { ... } from '@template/nom-package'`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'feat: add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- Créer une issue pour rapporter un bug
- Créer une discussion pour poser une question
- Consulter la documentation des technologies utilisées :
  - [Next.js](https://nextjs.org/docs)
  - [Nest.js](https://docs.nestjs.com/)
  - [Drizzle ORM](https://orm.drizzle.team/)
  - [Tailwind CSS](https://tailwindcss.com/docs)

---

_Template créé avec ❤️ pour accélérer le développement full-stack_
