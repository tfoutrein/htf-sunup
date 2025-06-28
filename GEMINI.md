# Gemini Project Context

## Project Overview

This project is a full-stack application for "HTF Sunup", designed to manage daily challenges for the Happy Team Factory. It's structured as a monorepo using pnpm workspaces.

- **Frontend:** A Next.js 14 application with TypeScript and Tailwind CSS. It uses TanStack Query v5 for state management.
- **Backend:** A Nest.js API with TypeScript, backed by a PostgreSQL database and Drizzle ORM for data access. Authentication is handled via JWT with a role-based system (marraine, manager, fbo).

## Key Technologies

| Area     | Technology            | Notes                                |
| :------- | :-------------------- | :----------------------------------- |
| Monorepo | **pnpm workspaces**   | Manages dependencies and scripts.    |
| Frontend | **Next.js 14**        | React framework.                     |
|          | **TypeScript**        | Static typing.                       |
|          | **Tailwind CSS**      | Utility-first CSS framework.         |
|          | **TanStack Query v5** | Server state management.             |
| Backend  | **Nest.js**           | Node.js framework for building APIs. |
|          | **PostgreSQL**        | Relational database.                 |
|          | **Drizzle ORM**       | TypeScript ORM.                      |
|          | **JWT**               | Authentication.                      |
| CI/CD    | **GitHub Actions**    | Automated workflows.                 |
| Tooling  | **Docker**            | Containerization for development.    |
|          | **ESLint, Prettier**  | Code quality and formatting.         |

## Project Structure

```
/
├── apps/
│   ├── backend/        # Nest.js API
│   └── frontend/       # Next.js App
├── docs/               # Project documentation
├── docker/             # Docker configurations
├── package.json        # Root package.json with monorepo scripts
└── pnpm-workspace.yaml # Defines the workspaces
```

## Important Commands

The following commands should be run from the project root directory.

### General

- `pnpm install`: Install all dependencies for the monorepo.
- `pnpm dev`: Start both frontend and backend in development mode.
- `pnpm build`: Build both applications for production.
- `pnpm lint`: Lint all applications.
- `pnpm type-check`: Run TypeScript type checking across the monorepo.

### Backend (`--filter backend`)

- `pnpm --filter backend dev`: Start the backend API in watch mode.
- `pnpm --filter backend test`: Run backend tests.
- `pnpm --filter backend db:migrate`: Run database migrations.
- `pnpm --filter backend db:seed`: Seed the database with test data.

### Frontend (`--filter frontend`)

- `pnpm --filter frontend dev`: Start the frontend development server.

### Docker

- `pnpm docker:up`: Start all services defined in `docker-compose.yml`.
- `pnpm docker:down`: Stop all running services.
- `pnpm docker:logs`: View logs from the running services.

## CI/CD Pipeline

The `.github/workflows/ci.yml` file defines the continuous integration pipeline, which includes:

1.  **Lint and Type Check:** Ensures code quality and type safety.
2.  **Test Backend:** Runs the backend test suite against a PostgreSQL service.
3.  **Build Frontend & Backend:** Builds both applications to ensure they are deployable.

## Development Environment

- The recommended way to run the project locally is using Docker via `pnpm docker:up`.
- This will start the `postgres`, `backend`, and `frontend` services.
- The frontend is accessible at `http://localhost:3000`.
- The backend is accessible at `http://localhost:3001`.
- The API documentation (Swagger) is available at `http://localhost:3001/api`.
