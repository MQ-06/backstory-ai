"""Index transcript segments as searchable artifacts and chunks."""

from __future__ import annotations

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import Artifact, Chunk, Interview, Source, TranscriptSegment
from app.services.chunk_embed import embed_source_chunks
from app.services.code_linking import link_artifact_chunk
from app.services.transcribe import TranscriptSegmentData


def ingest_transcript_segments(
    db: Session,
    interview: Interview,
    segments: list[TranscriptSegmentData],
) -> int:
    """Persist segments, create artifacts/chunks, embed, and link to code."""
    if interview.source_id is None:
        raise RuntimeError("Interview has no source_id")

    source = db.get(Source, interview.source_id)
    if source is None:
        raise RuntimeError("Interview source not found")

    # Clear prior segments for re-transcribe
    db.execute(delete(TranscriptSegment).where(TranscriptSegment.interview_id == interview.id))
    db.flush()

    indexed = 0
    for idx, seg in enumerate(segments):
        external_id = f"interview:{interview.id}:segment:{idx}"
        title = f"Interview segment {idx + 1}"
        artifact = Artifact(
            engagement_id=interview.engagement_id,
            source_id=source.id,
            artifact_type="interview",
            external_id=external_id,
            title=title,
            body=seg.text,
            metadata_={
                "interview_id": str(interview.id),
                "segment_index": idx,
                "start_seconds": seg.start_seconds,
                "end_seconds": seg.end_seconds,
                "expert_name": interview.expert_name,
            },
        )
        db.add(artifact)
        db.flush()

        chunk = Chunk(
            engagement_id=interview.engagement_id,
            source_id=source.id,
            artifact_id=artifact.id,
            chunk_index=idx,
            content=seg.text,
            external_id=f"chunk:{external_id}",
        )
        db.add(chunk)
        db.flush()

        row = TranscriptSegment(
            interview_id=interview.id,
            segment_index=idx,
            start_seconds=seg.start_seconds,
            end_seconds=seg.end_seconds,
            text=seg.text,
            artifact_id=artifact.id,
        )
        db.add(row)
        link_artifact_chunk(
            db,
            engagement_id=interview.engagement_id,
            artifact=artifact,
            chunk=chunk,
        )
        indexed += 1

    embed_source_chunks(db, source)
    source.status = "indexed"
    source.status_detail = f"{indexed} interview segments indexed"
    interview.status = "indexed"
    interview.status_detail = f"Transcribed and indexed {indexed} segments"
    interview.error_message = None
    db.flush()
    return indexed
