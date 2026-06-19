# Staging deploy checklist

Use before and after **Actions → Deploy staging**. See also [PROD_PROMOTION.md](./PROD_PROMOTION.md).

## Required secrets

### GitHub Actions

| Secret | Used for |
|--------|----------|
| `FLY_API_TOKEN` | Fly deploy (API + worker) |

### Fly.io (API + worker apps)

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Neon or Fly Postgres async URL |
| `REDIS_URL` | Upstash or Fly Redis |
| `CLERK_SECRET_KEY` | Staging Clerk instance |
| `CORS_ORIGINS` | `https://<vercel-staging>,http://localhost:3000` |
| `GROQ_API_KEY` or `GOOGLE_API_KEY` | Ask generation |
| `GITHUB_TOKEN` | Optional; real repo ingest |
| `R2_*` | Optional; interview media in cloud |
| `LANGFUSE_*`, `SENTRY_DSN` | Optional; observability |

**Do not** set `E2E_TEST_MODE=1` on staging.

### Vercel (web)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Staging Fly API URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Match staging Clerk |
| `CLERK_SECRET_KEY` | Server components / middleware |

Add staging web URL to **Clerk allowed origins**.

## Deploy steps

1. Merge PR to `develop` with CI green.
2. GitHub → **Actions** → **Deploy staging** → Run workflow.
3. Confirm health: `curl https://<staging-api>/health` → `{"status":"ok"}`.
4. Migrate staging DB: `uv run alembic upgrade head` (against staging `DATABASE_URL`).
5. Seed demo:
   ```bash
   export DATABASE_URL=<staging-db-url>
   export DEMO_CLERK_ORG_ID=org_xxxxxxxx
   cd apps/api && uv run python scripts/seed_demo.py
   ```
6. Ensure Fly **worker** app is running (`fly.worker.toml`).
7. Browser walkthrough on staging URL (runbook steps 4–8).
8. Langfuse: one Ask trace + one refusal trace visible.

## Post-deploy smoke

- [ ] Sign in on staging web
- [ ] Select seeded engagement
- [ ] Ask → citation or honest refusal
- [ ] Library lists artifacts
- [ ] Brief shows signals from seed
