FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY scripts/start-api.sh ./scripts/start-api.sh
RUN chmod +x ./scripts/start-api.sh

ENV API_HOST=0.0.0.0
ENV API_PORT=8080

EXPOSE 8080

CMD ["./scripts/start-api.sh"]
