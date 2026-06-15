from dataclasses import dataclass

import httpx
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import Org

security = HTTPBearer(auto_error=False)

CLERK_JWKS_URL = "https://api.clerk.com/v1/jwks"


@dataclass
class AuthContext:
    clerk_user_id: str
    clerk_org_id: str | None
    org: Org | None


async def _fetch_clerk_jwks() -> dict:
    settings = get_settings()
    if not settings.clerk_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CLERK_SECRET_KEY not configured",
        )
    async with httpx.AsyncClient() as client:
        response = await client.get(
            CLERK_JWKS_URL,
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


async def verify_clerk_token(token: str) -> dict:
    """Verify Clerk session JWT and return claims."""
    settings = get_settings()
    jwks = await _fetch_clerk_jwks()
    try:
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Invalid token key")
        public_key = RSAAlgorithm.from_jwk(key)
        return jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc


async def get_or_create_org(db: AsyncSession, clerk_org_id: str, name: str = "Organization") -> Org:
    result = await db.execute(select(Org).where(Org.clerk_org_id == clerk_org_id))
    org = result.scalar_one_or_none()
    if org:
        return org
    org = Org(clerk_org_id=clerk_org_id, name=name)
    db.add(org)
    await db.flush()
    return org


async def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    claims = await verify_clerk_token(credentials.credentials)
    clerk_user_id = claims.get("sub")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")

    # Clerk org id lives in `o.id` (session) or org_id claim depending on token type
    clerk_org_id = claims.get("org_id") or (claims.get("o") or {}).get("id")

    org = None
    if clerk_org_id:
        org = await get_or_create_org(db, clerk_org_id)

    return AuthContext(clerk_user_id=clerk_user_id, clerk_org_id=clerk_org_id, org=org)


async def require_org(auth: AuthContext = Depends(get_auth_context)) -> AuthContext:
    if not auth.clerk_org_id or auth.org is None:
        raise HTTPException(
            status_code=403,
            detail="Organization required. Select or create an org in Clerk.",
        )
    return auth
