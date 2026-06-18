.PHONY: help up down db-migrate db-revision dev dev-web dev-api dev-worker test lint install

help:
	@echo "Backstory-AI — dev commands"
	@echo "  make install     Install JS + Python dependencies"
	@echo "  make up          Start Postgres + Redis (docker)"
	@echo "  make down        Stop docker services"
	@echo "  make db-migrate  Run Alembic migrations"
	@echo "  make dev         Start web + API (parallel)"
	@echo "  make dev-worker  Start Celery ingest worker (separate terminal)"
	@echo "  make test        Run all tests"

install:
	pnpm install
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

lint:
	cd apps/api && uv run ruff check .
	pnpm lint
