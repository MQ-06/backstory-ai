from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers.engagements import router as engagements_router
from app.routers.sources import router as sources_router
from app.routers.ask import router as ask_router
from app.routers.briefs import router as briefs_router
from app.routers.interviews import router as interviews_router
from app.routers.library import router as library_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Backstory API",
        description="Memory layer for legacy systems",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content={"detail": str(exc)})

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(engagements_router, prefix="/api/v1")
    app.include_router(sources_router, prefix="/api/v1")
    app.include_router(ask_router, prefix="/api/v1")
    app.include_router(briefs_router, prefix="/api/v1")
    app.include_router(interviews_router, prefix="/api/v1")
    app.include_router(library_router, prefix="/api/v1")
    return app


app = create_app()
