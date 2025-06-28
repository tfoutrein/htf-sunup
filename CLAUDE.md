# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Start both frontend and backend in development mode
pnpm dev

# Start only backend (NestJS on port 3001)
pnpm back:dev

# Start only frontend (Next.js on port 3000)
pnpm front:dev

# Build all applications
pnpm build

# Type checking across all packages
pnpm type-check

# Linting across all packages
pnpm lint

# Run all tests
pnpm test
```

### Backend Specific Commands

```bash
# Navigate to backend directory first: cd apps/backend

# Database migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Deploy migrations (production)
pnpm db:deploy

# Run backend tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Production build and start
pnpm build && pnpm start:prod
```

### Frontend Specific Commands

```bash
# Navigate to frontend directory first: cd apps/frontend

# Development server
pnpm dev

# Production build
pnpm build

# Production start
pnpm start

# Linting
pnpm lint
```

### Docker Development

```bash
# Start all services (PostgreSQL + Backend + Frontend)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down
```

## Architecture Overview

### Monorepo Structure

This is a **pnpm workspace monorepo** with two main applications:

- `apps/backend/` - NestJS API with PostgreSQL + Drizzle ORM
- `apps/frontend/` - Next.js 14 with TypeScript + Tailwind CSS

### Key Technologies

- **Backend**: NestJS, PostgreSQL, Drizzle ORM, JWT Auth, AWS S3 SDK, Swagger
- **Frontend**: Next.js 14, TanStack Query v5, TypeScript, Tailwind CSS, HeroUI components
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Storage**: S3-compatible storage (iDrive e2) for file uploads
- **State Management**: TanStack Query for server state, React hooks for local state

### Domain Model

HTF Sunup is a **team gamification platform** for managing daily challenge campaigns:

**Core Entities:**

- **Users** with roles: `marraine` (supervisor), `manager` (team lead), `fbo` (participant)
- **Campaigns** - Time-bounded challenge periods
- **Challenges** - Daily challenges within campaigns (1 per day)
- **Actions** - Individual tasks within challenges (1-6 per challenge)
- **UserActions** - User participation tracking with optional proof uploads

**Business Rules:**

- One challenge per day per campaign
- Challenges auto-activate based on date
- FBOs complete actions with optional proof uploads
- Managers track team progress, Marraines provide support
- Points system for gamification (0-100 points per action)

### Backend Architecture

**Database Layer:**

- Drizzle ORM with PostgreSQL
- Schema defined in `apps/backend/src/db/schema.ts`
- Migrations in `apps/backend/drizzle/`
- Relations properly defined for type safety

**API Layer:**

- RESTful endpoints with `/api` prefix
- JWT authentication with role-based access
- Swagger documentation available at `http://localhost:3001/api`
- File upload to S3-compatible storage

**Key Services:**

- `AuthService` - JWT authentication with bcrypt password hashing
- `StorageService` - S3-compatible file uploads with local fallback
- `UsersService` - Team hierarchy management (managers → FBOs)
- `CampaignsService` - Campaign lifecycle management
- `ChallengesService` - Daily challenge management
- `ActionsService` - Action definitions and user completion tracking

### Frontend Architecture

**Pages Structure:**

- Role-based dashboards: `/fbo/dashboard`, `/manager/dashboard`, `/marraine/dashboard`
- Campaign management: `/campaigns` with nested routes for challenges
- Authentication: `/login`, `/register`

**State Management:**

- **TanStack Query v5** for server state with intelligent caching
- Optimistic updates for better UX
- Query invalidation patterns for data consistency
- Custom hooks for data fetching (`useCampaigns`, `useChallenges`, etc.)

**Component Architecture:**

- Reusable UI components in `src/components/ui/`
- Business components in `src/components/campaigns/`
- Clean separation between presentation and business logic

**Key Components:**

- `CampaignCalendar.tsx` - Interactive calendar for challenge visualization
- `ActionForm.tsx` - Action completion with proof upload
- `Navigation.tsx` - Role-based navigation

### API Integration

**Centralized API Client:**

- `apps/frontend/src/services/api.ts` - Centralized API configuration
- Automatic JWT token management
- Error handling and response parsing
- Environment-based API URL configuration

**TanStack Query Patterns:**

- Query keys organized by resource type
- Optimistic updates for mutations
- Proper cache invalidation strategies
- Error boundaries for graceful fallbacks

### File Storage

**S3 Integration:**

- AWS SDK v3 for S3-compatible storage
- Environment-based configuration (production: iDrive e2, development: local)
- File type validation (images: jpg/png/gif, videos: mp4/mov)
- Organized folder structure: `proofs/{userId}/{actionId}-{timestamp}.{ext}`

## Important Development Patterns

### Database Queries

Always use Drizzle ORM operators for type safety:

```typescript
import { eq, and, desc } from 'drizzle-orm';

// Correct
const user = await db.select().from(users).where(eq(users.id, userId));

// Type-safe joins
const campaignsWithChallenges = await db
  .select()
  .from(campaigns)
  .leftJoin(challenges, eq(campaigns.id, challenges.campaignId));
```

### API Endpoints

Follow RESTful conventions with proper HTTP methods:

- GET for retrieval, POST for creation, PATCH for updates, DELETE for removal
- Use proper status codes and error handling
- Implement proper authentication guards

### TanStack Query Usage

Organize queries with proper key hierarchies:

```typescript
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  detail: (id: number) => [...campaignKeys.details(), id] as const,
  withChallenges: (id: number) =>
    [...campaignKeys.detail(id), 'challenges'] as const,
};
```

### Error Handling

- Backend: Use NestJS exceptions (`NotFoundException`, `BadRequestException`)
- Frontend: Implement proper error boundaries and user feedback
- Database: Handle constraint violations gracefully

## Test Data

The database seed creates test accounts:

- **Marraine**: `aurelia@htf.com` / `password`
- **Manager**: `jeromine@htf.com` / `password`
- **FBO**: `marie@htf.com` / `password`

## Environment Setup

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/htf_sunup_db

# JWT
JWT_SECRET=your-secret-key

# S3 Storage (production)
S3_ENDPOINT=https://b2y8.par5.idrivee2-11.com
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=happy-team-factory

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Code Quality Standards

Follow existing patterns in the codebase:

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional commit messages
- Proper error handling at all layers
- Type safety throughout the application

When making changes, ensure consistency with existing architectural patterns and maintain the separation of concerns between frontend and backend.
