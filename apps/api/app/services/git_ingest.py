"""Git repository ingestion — shallow clone, files, commits, chunks."""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Artifact, Chunk, CodeEntity, Source
from app.services.ingest_common import clear_source_content

logger = logging.getLogger(__name__)

# Limits for MVP ingest (tune per engagement later).
MAX_FILE_BYTES = 512_000
MAX_COMMITS = 100
CHUNK_MAX_LINES = 80
CHUNK_OVERLAP_LINES = 10

SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "__pycache__",
    ".venv",
    "venv",
    ".turbo",
    "coverage",
    ".pytest_cache",
}

SKIP_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp4",
    ".mp3",
    ".wasm",
    ".bin",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".lock",
}

TEXT_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".md",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".sql",
    ".sh",
    ".bash",
    ".go",
    ".rs",
    ".java",
    ".kt",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".rb",
    ".php",
    ".swift",
    ".scala",
    ".vue",
    ".css",
    ".scss",
    ".html",
    ".xml",
    ".ini",
    ".cfg",
    ".env.example",
    "dockerfile",
    "makefile",
}


@dataclass
class GitIngestResult:
    head_sha: str
    file_count: int
    commit_count: int
    chunk_count: int

    @property
    def summary(self) -> str:
        return (
            f"Indexed {self.file_count} files, {self.commit_count} commits, "
            f"{self.chunk_count} chunks @ {self.head_sha[:7]}"
        )


def should_ingest_path(relative_path: str) -> bool:
    parts = Path(relative_path).parts
    if any(part in SKIP_DIR_NAMES for part in parts):
        return False
    suffix = Path(relative_path).suffix.lower()
    name = Path(relative_path).name.lower()
    if suffix in SKIP_EXTENSIONS:
        return False
    if suffix in TEXT_EXTENSIONS or name in TEXT_EXTENSIONS:
        return True
    # Extensionless small files (Makefile, Dockerfile handled above)
    return suffix == "" and name not in SKIP_DIR_NAMES


def detect_language(path: str) -> str | None:
    suffix = Path(path).suffix.lower()
    name = Path(path).name.lower()
    mapping = {
        ".py": "python",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".go": "go",
        ".rs": "rust",
        ".java": "java",
        ".md": "markdown",
        ".sql": "sql",
        ".yaml": "yaml",
        ".yml": "yaml",
        "dockerfile": "dockerfile",
        "makefile": "makefile",
    }
    return mapping.get(suffix) or mapping.get(name)


def chunk_lines(lines: list[str], max_lines: int = CHUNK_MAX_LINES, overlap: int = CHUNK_OVERLAP_LINES):
    """Yield (chunk_index, line_start, line_end, text) — 1-based line numbers."""
    if not lines:
        return
    start = 0
    index = 0
    while start < len(lines):
        end = min(start + max_lines, len(lines))
        text = "".join(lines[start:end])
        if text.strip():
            yield index, start + 1, end, text
            index += 1
        if end >= len(lines):
            break
        start = max(end - overlap, start + 1)


def _run_git(args: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(stderr or f"git {' '.join(args)} failed")
    return result.stdout.strip()


def clone_repo(repo_url: str, dest: Path) -> None:
    _run_git(
        [
            "clone",
            "--depth",
            str(MAX_COMMITS),
            "--single-branch",
            repo_url,
            str(dest),
        ]
    )


def get_head_sha(repo_dir: Path) -> str:
    return _run_git(["rev-parse", "HEAD"], cwd=repo_dir)


def list_commits(repo_dir: Path) -> list[dict[str, str]]:
    fmt = "%H%x1f%an%x1f%ae%x1f%at%x1f%s"
    output = _run_git(["log", f"--format={fmt}", f"-{MAX_COMMITS}"], cwd=repo_dir)
    commits: list[dict[str, str]] = []
    for line in output.splitlines():
        if not line.strip():
            continue
        sha, author, email, ts, subject = line.split("\x1f", 4)
        commits.append(
            {
                "sha": sha,
                "author": author,
                "email": email,
                "timestamp": ts,
                "subject": subject,
            }
        )
    return commits


def ingest_git_source(db: Session, source: Source, repo_url: str) -> GitIngestResult:
    """Clone a public Git repo and persist files + commits as searchable chunks."""
    if not repo_url:
        raise ValueError("repo_url is required")

    clear_source_content(db, source.id)
    source.status_detail = "Cloning repository…"
    db.flush()

    tmpdir = Path(tempfile.mkdtemp(prefix="backstory-git-"))
    try:
        clone_repo(repo_url, tmpdir)
        head_sha = get_head_sha(tmpdir)

        source.status_detail = f"Parsing files @ {head_sha[:7]}…"
        db.flush()

        file_count = 0
        chunk_count = 0

        for root, dirs, files in os.walk(tmpdir):
            dirs[:] = [d for d in dirs if d not in SKIP_DIR_NAMES]
            for filename in files:
                full_path = Path(root) / filename
                rel_path = str(full_path.relative_to(tmpdir)).replace("\\", "/")
                if not should_ingest_path(rel_path):
                    continue
                try:
                    size = full_path.stat().st_size
                except OSError:
                    continue
                if size > MAX_FILE_BYTES or size == 0:
                    continue
                try:
                    raw = full_path.read_bytes()
                    text = raw.decode("utf-8")
                except (UnicodeDecodeError, OSError):
                    continue

                file_external = f"file:{head_sha}:{rel_path}"
                entity = CodeEntity(
                    engagement_id=source.engagement_id,
                    source_id=source.id,
                    entity_type="file",
                    path=rel_path,
                    commit_sha=head_sha,
                    language=detect_language(rel_path),
                    external_id=file_external,
                    metadata_={"bytes": size},
                )
                db.add(entity)
                db.flush()
                file_count += 1

                lines = text.splitlines(keepends=True)
                for idx, line_start, line_end, chunk_text in chunk_lines(lines):
                    chunk_external = f"chunk:{file_external}:{idx}"
                    db.add(
                        Chunk(
                            engagement_id=source.engagement_id,
                            source_id=source.id,
                            code_entity_id=entity.id,
                            chunk_index=idx,
                            content=chunk_text,
                            line_start=line_start,
                            line_end=line_end,
                            external_id=chunk_external,
                        )
                    )
                    chunk_count += 1

        source.status_detail = "Indexing commit history…"
        db.flush()

        commit_count = 0
        for commit in list_commits(tmpdir):
            sha = commit["sha"]
            subject = commit["subject"]
            body = f"{subject}\n\nAuthor: {commit['author']} <{commit['email']}>"
            artifact_external = f"commit:{sha}"
            artifact = Artifact(
                engagement_id=source.engagement_id,
                source_id=source.id,
                artifact_type="commit",
                external_id=artifact_external,
                title=subject,
                body=body,
                metadata_=commit,
            )
            db.add(artifact)
            db.flush()
            commit_count += 1

            db.add(
                Chunk(
                    engagement_id=source.engagement_id,
                    source_id=source.id,
                    artifact_id=artifact.id,
                    chunk_index=0,
                    content=body,
                    external_id=f"chunk:{artifact_external}:0",
                )
            )
            chunk_count += 1

        config = dict(source.config or {})
        config.update(
            {
                "head_sha": head_sha,
                "file_count": file_count,
                "commit_count": commit_count,
                "chunk_count": chunk_count,
            }
        )
        source.config = config

        return GitIngestResult(
            head_sha=head_sha,
            file_count=file_count,
            commit_count=commit_count,
            chunk_count=chunk_count,
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
