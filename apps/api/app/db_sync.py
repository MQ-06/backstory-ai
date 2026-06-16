from collections.abc import Generator
from contextlib import contextmanager

from pgvector.psycopg import register_vector
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

settings = get_settings()

sync_engine = create_engine(settings.database_url_sync, pool_pre_ping=True)


@event.listens_for(sync_engine, "connect")
def _register_pgvector(dbapi_connection, connection_record) -> None:
    register_vector(dbapi_connection)


SyncSessionLocal = sessionmaker(sync_engine, class_=Session, expire_on_commit=False)


@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    session = SyncSessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
