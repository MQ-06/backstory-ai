# Production promotion checklist

Use after staging demo is validated. Staging deploy: **Actions → Deploy staging** (manual).

## Pre-promotion

- [ ] CI green on `develop`: pytest, eval gate, web lint, Playwright smoke + demo API tests
- [ ] Staging health: `curl https://<staging-api>/health` → `{"status":"ok"}`
- [ ] Staging web loads; sign-in works with Clerk production instance (or dedicated prod Clerk)
- [ ] `make demo-seed` (or equivalent) run against **staging** DB; demo script completed once
- [ ] Langfuse traces visible for ask + refusal on staging
- [ ] R2 bucket configured if using cloud media (`R2_*` env on Fly + Vercel)

## Fly.io (API + worker)

```bash
# From apps/api — promote same image/config as staging after review
fly deploy --config fly.toml --remote-only        # API
fly deploy --config fly.worker.toml --remote-only  # worker
```

Set production secrets (Fly dashboard or `fly secrets set`):

- `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `CORS_ORIGINS`
- `GROQ_API_KEY` or `GOOGLE_API_KEY`, `GITHUB_TOKEN`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (if using R2)
- `LANGFUSE_*`, `SENTRY_DSN` (optional)

**Do not** set `E2E_TEST_MODE=1` in production.

## Vercel (web)

- Promote staging preview to production domain, or merge `develop` → `main` with Vercel auto-deploy
- `NEXT_PUBLIC_API_URL` → production Fly API URL
- Clerk publishable key matches production instance

## Post-promotion smoke

- [ ] `/health` on prod API
- [ ] Sign in → create engagement → connect source → indexed
- [ ] One grounded Ask with citation OR honest refusal
- [ ] Rollback plan: previous Fly release + Vercel instant rollback documented in Fly/Vercel UI

## Rollback

- **Fly:** `fly releases list` → `fly deploy --image <previous>`
- **Vercel:** Deployments → Promote previous production deployment
