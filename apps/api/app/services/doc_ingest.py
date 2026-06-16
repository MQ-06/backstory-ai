"""Document upload ingestion — PDF, DOCX, Markdown, plain text."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Artifact, Chunk, Source
from app.services.ingest_common import chunk_text, clear_source_content

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".md", ".markdown", ".txt", ".html", ".htm"}


@dataclass
class DocIngestResult:
    chunk_count: int
    char_count: int

    @property
    def summary(self) -> str:
        return f"Indexed document — {self.chunk_count} chunks, {self.char_count:,} characters"


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text)
        return "\n\n".join(pages)

    if suffix == ".docx":
        from docx import Document

        doc = Document(str(path))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())

    if suffix in {".md", ".markdown", ".txt", ".html", ".htm", ""}:
        return path.read_text(encoding="utf-8", errors="replace")

    raise ValueError(f"Unsupported file type: {suffix or 'unknown'}")


def ingest_doc_source(db: Session, source: Source) -> DocIngestResult:
    config = source.config or {}
    storage_path = config.get("storage_path")
    if not storage_path:
        raise ValueError("storage_path missing from source config")

    path = Path(storage_path)
    if not path.exists():
        raise FileNotFoundError(f"Upload not found: {storage_path}")

    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}")

    clear_source_content(db, source.id)
    source.status_detail = f"Extracting text from {path.name}…"
    db.flush()

    text = extract_text(path)
    if not text.strip():
        raise ValueError(
            "No extractable text found. Scanned PDFs need OCR (planned for V1.1)."
        )

    filename = config.get("filename", path.name)
    artifact_external = f"doc:{source.id}:{filename}"
    artifact = Artifact(
        engagement_id=source.engagement_id,
        source_id=source.id,
        artifact_type="doc",
        external_id=artifact_external,
        title=filename,
        body=text[:5000],
        metadata_={"path": str(path), "chars": len(text)},
    )
    db.add(artifact)
    db.flush()

    chunk_count = 0
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
    config.update({"chunk_count": chunk_count, "char_count": len(text)})
    source.config = config

    return DocIngestResult(chunk_count=chunk_count, char_count=len(text))
