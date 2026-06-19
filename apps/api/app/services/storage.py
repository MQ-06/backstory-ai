"""Object storage — local disk by default, Cloudflare R2 when configured."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Protocol

from app.config import get_settings

logger = logging.getLogger(__name__)


class StorageBackend(Protocol):
    def save_bytes(self, key: str, data: bytes, *, content_type: str | None = None) -> str: ...

    def read_bytes(self, stored_path: str) -> bytes: ...

    def resolve_path(self, stored_path: str) -> Path: ...


class LocalStorageBackend:
    def __init__(self, base_dir: str) -> None:
        self.base_dir = Path(base_dir)

    def save_bytes(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        dest = self.base_dir / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return str(dest)

    def read_bytes(self, stored_path: str) -> bytes:
        return Path(stored_path).read_bytes()

    def resolve_path(self, stored_path: str) -> Path:
        return Path(stored_path)


class R2StorageBackend:
    """S3-compatible storage for Cloudflare R2."""

    def __init__(
        self,
        *,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        local_cache_dir: str,
    ) -> None:
        import boto3

        endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
        self.bucket_name = bucket_name
        self.local_cache_dir = Path(local_cache_dir)
        self.local_cache_dir.mkdir(parents=True, exist_ok=True)
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
        )

    def save_bytes(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        extra: dict = {}
        if content_type:
            extra["ContentType"] = content_type
        self.client.put_object(Bucket=self.bucket_name, Key=key, Body=data, **extra)
        return f"r2://{self.bucket_name}/{key}"

    def read_bytes(self, stored_path: str) -> bytes:
        if stored_path.startswith("r2://"):
            _, rest = stored_path.split("r2://", 1)
            bucket, key = rest.split("/", 1)
            response = self.client.get_object(Bucket=bucket, Key=key)
            return response["Body"].read()
        return Path(stored_path).read_bytes()

    def resolve_path(self, stored_path: str) -> Path:
        if not stored_path.startswith("r2://"):
            return Path(stored_path)
        _, rest = stored_path.split("r2://", 1)
        _, key = rest.split("/", 1)
        safe_name = Path(key).name
        cache_path = self.local_cache_dir / safe_name
        if not cache_path.exists():
            cache_path.write_bytes(self.read_bytes(stored_path))
        return cache_path


_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    global _backend
    if _backend is not None:
        return _backend

    settings = get_settings()
    if (
        settings.r2_bucket_name
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_account_id
    ):
        logger.info("Using R2 storage backend bucket=%s", settings.r2_bucket_name)
        _backend = R2StorageBackend(
            account_id=settings.r2_account_id,
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            bucket_name=settings.r2_bucket_name,
            local_cache_dir=settings.upload_dir,
        )
    else:
        _backend = LocalStorageBackend(settings.upload_dir)
    return _backend


def engagement_upload_dir(engagement_id: str, source_id: str) -> Path:
    settings = get_settings()
    path = Path(settings.upload_dir) / engagement_id / source_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload_bytes(engagement_id: str, source_id: str, filename: str, data: bytes) -> str:
    safe_name = Path(filename).name
    key = f"{engagement_id}/{source_id}/{safe_name}"
    return get_storage_backend().save_bytes(key, data, content_type="application/octet-stream")
