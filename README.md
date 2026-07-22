# WhatsApp SaaS Platform

Multi-tenant WhatsApp Business API SaaS platform built with NestJS (API) and Next.js (Web).

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| API          | NestJS + Fastify                    |
| Web          | Next.js 16 (App Router)            |
| Database     | PostgreSQL + Prisma ORM             |
| Cache/Session| Redis (ioredis)                     |
| Auth         | Cookie-based sessions (HttpOnly)    |
| Monorepo     | pnpm workspaces + Turborepo        |
| Security     | Argon2id hashing, CSRF tokens       |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** (for PostgreSQL and Redis)

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url> && cd <project>
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — at minimum change: DATABASE_URL, SESSION_SECRET, SESSION_COOKIE_SECRET
```

### 3. Start infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 4. Database setup

```bash
pnpm --filter @repo/database exec npx prisma migrate deploy
pnpm --filter @repo/database seed
```

### 5. Run dev servers

```bash
pnpm dev
```

- **API**: http://localhost:3333
- **Web**: http://localhost:3000

## Project Structure

```
├── apps/
│   ├── api/          # NestJS + Fastify backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── contracts/    # Shared TypeScript types & Zod schemas
│   ├── database/     # Prisma schema, migrations, seed
│   ├── observability/# Logging (pino) utilities
│   └── security/     # Argon2 hashing, input sanitisation
├── infra/            # Docker Compose for local dev
└── scripts/          # Helper scripts
```

## Available Commands

| Command                                        | Description              |
| ---------------------------------------------- | ------------------------ |
| `pnpm dev`                                     | Start all dev servers    |
| `pnpm build`                                   | Build all packages       |
| `pnpm lint`                                    | ESLint across monorepo   |
| `pnpm typecheck`                               | TypeScript check         |
| `pnpm test`                                    | Run unit tests           |
| `pnpm --filter @repo/database seed`            | Seed demo data           |

## Auth Flow

1. `GET /auth/csrf` → returns `csrfToken` + sets signed `preauth_session` cookie
2. `POST /auth/login` with `{ email, password }` + `x-csrf-token` header → sets signed `session_id` cookie (HttpOnly)
3. `GET /auth/me` → returns authenticated user
4. `POST /auth/logout` → destroys session

Sessions are stored in Redis with SHA-256 hashed keys. Idle timeout + absolute expiration enforced server-side.

## License

Private — all rights reserved.
