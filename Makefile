.PHONY: help up down db-migrate db-revision demo-seed demo-verify demo-walkthrough e2e-install dev dev-web dev-api dev-worker test lint install

help:
	@echo "Backstory-AI — dev commands"
	@echo "  make install     Install JS + Python dependencies"
	@echo "  make up          Start Postgres + Redis (docker)"
	@echo "  make down        Stop docker services"
	@echo "  make db-migrate  Run Alembic migrations"
	@echo "  make demo-seed   Seed payroll demo engagement (set DEMO_CLERK_ORG_ID)"
	@echo "  make demo-verify Run demo path API tests"
	@echo "  make demo-walkthrough Verify seeded demo (Ask/Capture/Library data path)"
	@echo "  make e2e-install Install Playwright Chromium (~300MB, once per Playwright upgrade)"
	@echo "  make e2e-install-force Re-download browsers if version mismatch (1223 vs 1228)"
	@echo "  make dev         Start web + API (parallel)"
	@echo "  make dev-worker  Start Celery ingest worker (separate terminal)"
	@echo "  make test        Run API + web unit tests"
	@echo "  make test-e2e    Run Playwright E2E (API :8001, web dev :3002)"

install:
	pnpm install
	pnpm test:e2e:install
	cd apps/api && uv sync --dev

up:
	docker compose up -d
	@echo "Waiting for Postgres..."
	@sleep 3
	@docker compose ps

down:
	docker compose down

db-migrate:
	cd apps/api && uv run alembic upgrade head

db-revision:
	cd apps/api && uv run alembic revision --autogenerate -m "$(name)"

demo-seed:
	cd apps/api && uv run python scripts/seed_demo.py
	@echo "Done. Set DEMO_CLERK_ORG_ID to your Clerk org id before seeding (see apps/api/scripts/DEMO_RUNBOOK.md)."

demo-verify:
	cd apps/api && uv run pytest -q tests/test_demo_path.py

demo-walkthrough:
	cd apps/api && uv run python scripts/verify_demo_walkthrough.py

e2e-install:
	cd e2e && CI=1 pnpm install --no-frozen-lockfile && pnpm exec playwright install chromium chromium-headless-shell

e2e-install-force:
	cd e2e && CI=1 pnpm install --no-frozen-lockfile && pnpm exec playwright install --force chromium chromium-headless-shell

dev:
	@echo "Starting API (8000) + web (3000) — Ctrl+C stops both"
	@$(MAKE) -j2 dev-api dev-web

dev-web:
	pnpm --filter web dev

dev-api:
	cd apps/api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-worker:
	cd apps/api && uv run celery -A app.worker worker -Q ingest,transcribe -l info

test:
	cd apps/api && uv run pytest -q
	pnpm --filter web test

test-e2e: e2e-install
	@echo "Running E2E (API :8001, web dev :3002 — safe alongside make dev on :3000)…"
	E2E_TEST_MODE=1 pnpm test:e2e

lint:
	cd apps/api && uv run ruff check .
	pnpm lint
