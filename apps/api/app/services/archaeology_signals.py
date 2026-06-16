"""Risk signal computation from ingested Git commits, code entities, and tickets."""

from __future__ import annotations

import uuid
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Artifact, CodeEntity, Link

AFTER_HOURS_START = 22
AFTER_HOURS_END = 6
MAX_SIGNALS = 15


@dataclass(frozen=True)
class RiskSignal:
    signal_type: str
    label: str
    path: str | None
    score: float
    evidence: dict

    def to_dict(self) -> dict:
        return asdict(self)


def _is_after_hours(ts: int) -> bool:
    hour = datetime.fromtimestamp(ts, tz=UTC).hour
    return hour >= AFTER_HOURS_START or hour < AFTER_HOURS_END


def compute_risk_signals(
    db: Session,
    *,
    engagement_id: uuid.UUID,
    module_path: str | None = None,
    expert_name: str | None = None,
) -> list[RiskSignal]:
    """Derive ranked risk signals from indexed engagement content."""
    signals: list[RiskSignal] = []

    commits = db.execute(
        select(Artifact).where(
            Artifact.engagement_id == engagement_id,
            Artifact.artifact_type == "commit",
        )
    ).scalars().all()

    author_counts: Counter[str] = Counter()
    after_hours: list[Artifact] = []
    for commit in commits:
        meta = commit.metadata_ or {}
        author = meta.get("author") or "unknown"
        author_counts[author] += 1
        ts = meta.get("timestamp")
        if ts and _is_after_hours(int(ts)):
            after_hours.append(commit)

    if expert_name:
        expert_commits = [
            c for c in commits if (c.metadata_ or {}).get("author", "").lower() == expert_name.lower()
        ]
        if expert_commits:
            signals.append(
                RiskSignal(
                    signal_type="expert_activity",
                    label=f"{expert_name} authored {len(expert_commits)} indexed commits",
                    path=None,
                    score=min(len(expert_commits) / 10.0, 1.0),
                    evidence={
                        "expert_name": expert_name,
                        "commit_count": len(expert_commits),
                        "sample_subjects": [c.title for c in expert_commits[:3] if c.title],
                    },
                )
            )

    for commit in after_hours[:5]:
        meta = commit.metadata_ or {}
        ts = int(meta.get("timestamp", 0))
        when = datetime.fromtimestamp(ts, tz=UTC).strftime("%Y-%m-%d %H:%M UTC")
        signals.append(
            RiskSignal(
                signal_type="after_hours",
                label=f"After-hours commit: {commit.title or meta.get('sha', '')[:7]}",
                path=None,
                score=0.85,
                evidence={
                    "commit_sha": meta.get("sha"),
                    "author": meta.get("author"),
                    "timestamp": when,
                    "subject": commit.title,
                },
            )
        )

    if author_counts:
        top_author, top_count = author_counts.most_common(1)[0]
        total = sum(author_counts.values())
        if total >= 3 and top_count / total >= 0.6:
            signals.append(
                RiskSignal(
                    signal_type="single_owner",
                    label=f"Bus factor: {top_author} authored {top_count}/{total} commits",
                    path=None,
                    score=top_count / total,
                    evidence={"author": top_author, "commit_count": top_count, "total_commits": total},
                )
            )

    entity_query = select(CodeEntity).where(CodeEntity.engagement_id == engagement_id)
    if module_path:
        normalized = module_path.strip().strip("/")
        entity_query = entity_query.where(CodeEntity.path.contains(normalized))
    entities = db.execute(entity_query.limit(200)).scalars().all()

    path_ticket_counts: dict[str, int] = defaultdict(int)
    links = db.execute(select(Link).where(Link.engagement_id == engagement_id)).scalars().all()
    entity_paths = {e.id: e.path for e in entities}
    for link in links:
        path = entity_paths.get(link.code_entity_id)
        if path:
            path_ticket_counts[path] += 1

    for entity in sorted(entities, key=lambda e: len(e.path), reverse=True)[:10]:
        if module_path and module_path not in entity.path:
            continue
        ticket_links = path_ticket_counts.get(entity.path, 0)
        if ticket_links >= 1:
            signals.append(
                RiskSignal(
                    signal_type="ticket_spike",
                    label=f"Tickets linked to {entity.path} ({ticket_links} links)",
                    path=entity.path,
                    score=min(0.5 + ticket_links * 0.1, 1.0),
                    evidence={
                        "path": entity.path,
                        "ticket_link_count": ticket_links,
                        "code_entity_id": str(entity.id),
                    },
                )
            )

    large_files = sorted(entities, key=lambda e: (e.metadata_ or {}).get("bytes", 0), reverse=True)[:5]
    for entity in large_files:
        size = (entity.metadata_ or {}).get("bytes", 0)
        if size < 10_000:
            continue
        signals.append(
            RiskSignal(
                signal_type="high_churn",
                label=f"Large/complex module: {entity.path}",
                path=entity.path,
                score=min(size / 200_000, 1.0),
                evidence={
                    "path": entity.path,
                    "bytes": size,
                    "code_entity_id": str(entity.id),
                },
            )
        )

    tickets = db.execute(
        select(Artifact).where(
            Artifact.engagement_id == engagement_id,
            Artifact.artifact_type == "ticket",
        )
    ).scalars().all()
    if len(tickets) >= 5:
        signals.append(
            RiskSignal(
                signal_type="ticket_density",
                label=f"{len(tickets)} tickets indexed — dense change history",
                path=None,
                score=min(len(tickets) / 50.0, 1.0),
                evidence={"issue_count": len(tickets)},
            )
        )

    signals.sort(key=lambda s: s.score, reverse=True)
    return signals[:MAX_SIGNALS]
