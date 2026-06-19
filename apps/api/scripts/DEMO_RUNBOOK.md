# Acme Payroll Demo Runbook

Internal script for the Streetlight Payroll MVP demo path (Features 1–10).

## Prerequisites

- Docker: `make up`
- Migrations: `make db-migrate`
- API worker (separate terminal): `make dev-worker`
- Web + API: `make dev`
- Clerk org id from your dev session (Organization → copy ID)

## Seed demo data

**Get your org ID from the app (easiest):**

1. Sign in at http://localhost:3000 and select/create an organization (top bar switcher).
2. Open **Settings** (`/admin`) → **Demo seed — Clerk org ID**.
3. Copy the command shown there, paste into your terminal, then run it.

Or set manually:

```bash
export DEMO_CLERK_ORG_ID=org_xxxxxxxx   # from Settings page, not Clerk dashboard
make demo-seed
```

This creates **Streetlight Payroll Demo** with:

- `payroll_calc.py` code + embeddings
- Ticket #4821 (month-end crash)
- Month-end procedures doc
- Ahmed interview segment (banking API workaround)
- Pre-linked code ↔ ticket edges
- Sample Archaeology Brief questions

## Demo script (15 minutes)

1. **Sign in** at http://localhost:3000/sign-in — select the org matching `DEMO_CLERK_ORG_ID`.
2. **Engagement** — choose *Streetlight Payroll Demo* in the sidebar.
3. **Sources** (`/sources`) — confirm Git / tickets / doc show **Indexed** (seed writes directly; no worker wait).
4. **Ask** (`/ask`) — question: *Why does the payroll batch fail on months with 31 days?*
   - Expect: **Answer Receipt** with code and/or ticket citations, OR honest **I don't have this** if LLM keys are missing.
5. **Capture → Archaeology Brief** — open brief tab; sidebar shows **real risk signals** (not demo constants).
   - Regenerate with expert `Ahmed` and module `payroll_calc` if needed.
6. **Capture → Interview Studio** — start interview from brief; record consent; upload or record clip.
7. **Ask again** — *What did Ahmed say about the banking API workaround?*
   - Expect: interview clip citation with timestamp when transcription is indexed.
8. **Library** (`/library`) — browse indexed `payroll_calc.py`, ticket #4821, interview artifacts.

## Verify locally

```bash
# Automated walkthrough checks (library, brief, retrieval, LLM config)
export DEMO_CLERK_ORG_ID=org_xxxxxxxx
make demo-walkthrough

# API unit tests for demo path
make demo-verify

# E2E (install browsers once: make e2e-install — or run make test-e2e which installs first)
make e2e-install          # ~300MB download, one time
make test-e2e             # all 9 tests (API :8001, web dev :3002; safe alongside make dev)
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Engagement not visible | `DEMO_CLERK_ORG_ID` must match signed-in Clerk org |
| Ask returns refusal only | Set `GROQ_API_KEY` or `GOOGLE_API_KEY`; check worker logs |
| Brief has no signals | Run `make demo-seed` again; confirm sources indexed |
| Citations lack GitHub links | Git source must include `repo_url` in config (seed sets this) |
| Worker clones `github.com/demo/payroll` and fails | From old E2E runs — restart worker; fixed in latest tests |
| Playwright browser missing | `make e2e-install-force` then `make test-e2e` |
| E2E sign-in fails / body hidden | Stop reusing `make dev` on :3000 — E2E uses its own dev server on `localhost:3002` with `.next-e2e` |
| E2E `ERR_NETWORK_CHANGED` | Run `make test-e2e` (Playwright starts isolated `next dev`, not hot reload on :3000) |

## Staging

After `deploy-staging` workflow succeeds, repeat steps 4–7 against staging URLs with the same seeded org (run seed against staging DB once).

See `.github/PROD_PROMOTION.md` before promoting to production.

## Recommended next path

| Your goal | Next step |
|-----------|-----------|
| **Demo to someone next week** | Run `make demo-walkthrough`, rehearse the 15‑min script twice in the browser |
| **Real customer repo, not seed** | Sources → connect GitHub repo + issues + PDF; run `make dev-worker` until **Indexed** |
| **Share a URL (not localhost)** | GitHub Actions → Deploy staging; seed staging DB; repeat walkthrough on staging URL |
| **Production** | Only after staging demo works end-to-end (see `.github/PROD_PROMOTION.md`) |

**Default recommendation after seed:** rehearse the browser walkthrough locally until Ask shows citations or honest refusal, then plan staging if you need a shareable link.
