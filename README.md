# Backstory-AI

**Code tells you what — Backstory remembers why.**

Memory layer for legacy systems: cited answers from code, tickets, documents, and expert interviews — with honest refusal when evidence is missing.

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 15, TypeScript, Clerk, TanStack Query, shadcn/ui |
| API | FastAPI, SQLAlchemy async, Alembic |
| Data | Postgres + pgvector, Redis, Cloudflare R2 (later) |
| Jobs | Celery (later sprints) |

## Quick start

**Prerequisites:** Node 20+, pnpm 9+, Python 3.12+, [uv](https://docs.astral.sh/uv/), Docker, [Clerk](https://clerk.com) with Organizations enabled.

```bash
git clone git@github.com:MQ-06/backstory-ai.git
cd backstory-ai

cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# Edit both with your Clerk keys; add http://localhost:3000 to Clerk allowed origins

make install
make up
make db-migrate
make dev
```

- **Web:** http://localhost:3000
- **API:** http://localhost:8000/health

Full setup and verification checklist: [docs/SPRINT0.md](docs/SPRINT0.md).

## Repository map

| Path | Purpose |
|------|---------|
| [FEATURES.md](FEATURES.md) | What each feature does (source of truth) |
| [PRD.md](PRD.md) | How to build, prioritize, architect |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Sprint plan |
| [AGENTS.md](AGENTS.md) | AI + developer entry point |
| [knowledge/](knowledge/index.md) | Distilled project facts |
| `apps/web/` | Next.js frontend |
| `apps/api/` | FastAPI backend |

## MVP scope

Features **1–10** only (Foundation + Answer Receipts + Archaeology Brief). See [FEATURES.md](FEATURES.md).

## Development

```bash
make test          # API pytest
pnpm --dir apps/web typecheck
pnpm --dir apps/web build
```

CI runs on push via [.github/workflows/ci.yml](.github/workflows/ci.yml).

## License

Proprietary — all rights reserved unless otherwise noted.
