"""GitHub Issues ticket import."""

from __future__ import annotations

import re
from dataclasses import dataclass

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Artifact, Chunk, Source
from app.services.ingest_common import chunk_text, clear_source_content

_REPO_KEY_RE = re.compile(r"^[\w.-]+/[\w.-]+$")
MAX_ISSUES = 100


@dataclass
class TicketIngestResult:
    issue_count: int
    chunk_count: int

    @property
    def summary(self) -> str:
        return f"Indexed {self.issue_count} issues, {self.chunk_count} chunks"


def parse_project_key(project_key: str) -> tuple[str, str]:
    key = project_key.strip().strip("/")
    if not _REPO_KEY_RE.match(key):
        raise ValueError("project_key must be owner/repo (e.g. pallets/click)")
    owner, repo = key.split("/", 1)
    return owner, repo


def fetch_github_issues(owner: str, repo: str) -> list[dict]:
    settings = get_settings()
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    params = {"state": "all", "per_page": MAX_ISSUES, "sort": "updated", "direction": "desc"}

    with httpx.Client(timeout=30.0) as client:
        response = client.get(url, headers=headers, params=params)
        if response.status_code == 404:
            raise ValueError(f"Repository not found: {owner}/{repo}")
        if response.status_code == 403:
            raise ValueError(
                "GitHub rate limit exceeded. Add GITHUB_TOKEN to apps/api/.env and retry."
            )
        response.raise_for_status()
        data = response.json()

    issues = [item for item in data if "pull_request" not in item]
    return issues[:MAX_ISSUES]


def ingest_ticket_source(db: Session, source: Source) -> TicketIngestResult:
    config = source.config or {}
    project_key = config.get("project_key", "")
    owner, repo = parse_project_key(project_key)

    clear_source_content(db, source.id)
    source.status_detail = f"Fetching issues from {owner}/{repo}…"
    db.flush()

    issues = fetch_github_issues(owner, repo)
    chunk_count = 0

    for issue in issues:
        number = issue["number"]
        title = issue.get("title") or f"Issue #{number}"
        body = issue.get("body") or ""
        state = issue.get("state", "unknown")
        text = f"# {title}\n\nState: {state}\n\n{body}".strip()

        artifact_external = f"github_issue:{owner}/{repo}:{number}"
        artifact = Artifact(
            engagement_id=source.engagement_id,
            source_id=source.id,
            artifact_type="ticket",
            external_id=artifact_external,
            title=title,
            body=body[:5000] if body else None,
            metadata_={
                "number": number,
                "state": state,
                "html_url": issue.get("html_url"),
                "repo": f"{owner}/{repo}",
            },
        )
        db.add(artifact)
        db.flush()

        for idx, chunk_content in chunk_text(text):
            db.add(
                Chunk(
                    engagement_id=source.engagement_id,
                    source_id=source.id,
                    artifact_id=artifact.id,
                    chunk_index=idx,
                    content=chunk_content,
                    external_id=f"chunk:{artifact_external}:{idx}",
                )
            )
            chunk_count += 1

    config = dict(config)
    config.update({"issue_count": len(issues), "chunk_count": chunk_count, "repo": f"{owner}/{repo}"})
    source.config = config

    return TicketIngestResult(issue_count=len(issues), chunk_count=chunk_count)
