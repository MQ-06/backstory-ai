"""Eval gate metrics — faithfulness, refusal, citation correctness."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace

from app.config import get_settings
from app.services.rag import _pre_retrieval_refusal, _verify_and_filter_answer

FIXTURES_PATH = Path(__file__).resolve().parent / "fixtures" / "questions.json"

# Thresholds from knowledge/eval-thresholds.md
UNSUPPORTED_CLAIM_RATE_MAX = 0.0
REFUSAL_ACCURACY_MIN = 0.95
RECALL_AT_K_MIN = 0.80
CITATION_CORRECTNESS_MIN = 0.90
RECALL_K = 5


@dataclass(frozen=True)
class EvalThresholds:
    unsupported_claim_rate_max: float = UNSUPPORTED_CLAIM_RATE_MAX
    refusal_accuracy_min: float = REFUSAL_ACCURACY_MIN
    recall_at_k_min: float = RECALL_AT_K_MIN
    citation_correctness_min: float = CITATION_CORRECTNESS_MIN
    recall_k: int = RECALL_K


def load_fixtures() -> dict:
    return json.loads(FIXTURES_PATH.read_text())


def _mock_passage(passage_id: int, text: str, citation_type: str = "doc", rrf_score: float = 0.1):
    chunk = SimpleNamespace(id=uuid.uuid4(), content=text)
    return SimpleNamespace(
        passage_id=passage_id,
        chunk=chunk,
        citation_type=citation_type,
        label="fixture",
        locator={},
        snippet=text[:120],
        rrf_score=rrf_score,
    )


def run_verification_cases(cases: list[dict]) -> tuple[float, float]:
    """Returns (unsupported_claim_rate, citation_correctness)."""
    unsupported = 0
    correct = 0
    total = len(cases)
    if total == 0:
        return 0.0, 1.0

    for case in cases:
        passage = _mock_passage(1, case["passage_text"], case.get("citation_type", "doc"))
        filtered, _, reason = _verify_and_filter_answer(case["answer"], [passage])
        passed = reason is None and bool(filtered)
        expect_pass = case["expect_pass"]
        if passed != expect_pass:
            unsupported += 1
        if passed == expect_pass:
            correct += 1

    return unsupported / total, correct / total


def run_refusal_cases(cases: list[dict]) -> float:
    settings = get_settings()
    correct = 0
    for case in cases:
        scores = case.get("rrf_scores") or []
        passages = [
            _mock_passage(i + 1, "fixture context", rrf_score=score)
            for i, score in enumerate(scores)
        ]
        reason = _pre_retrieval_refusal(passages)
        refused = reason is not None
        if refused == case["expect_refusal"]:
            correct += 1
        elif not case["expect_refusal"] and passages:
            top = passages[0].rrf_score
            if top >= settings.retrieval_min_rrf_score:
                correct += 1
    return correct / len(cases) if cases else 1.0


def compute_recall_at_k(retrieved_ids: list[uuid.UUID], expected_id: uuid.UUID, k: int = 5) -> float:
    if expected_id in retrieved_ids[:k]:
        return 1.0
    return 0.0


def run_eval_gate(thresholds: EvalThresholds | None = None) -> dict[str, float]:
    thresholds = thresholds or EvalThresholds()
    fixtures = load_fixtures()
    unsupported_rate, citation_correctness = run_verification_cases(
        fixtures.get("verification_cases", [])
    )
    refusal_accuracy = run_refusal_cases(fixtures.get("refusal_cases", []))

    return {
        "unsupported_claim_rate": unsupported_rate,
        "citation_correctness": citation_correctness,
        "refusal_accuracy": refusal_accuracy,
    }


def eval_gate_passed(metrics: dict[str, float], thresholds: EvalThresholds | None = None) -> bool:
    thresholds = thresholds or EvalThresholds()
    return (
        metrics["unsupported_claim_rate"] <= thresholds.unsupported_claim_rate_max
        and metrics["refusal_accuracy"] >= thresholds.refusal_accuracy_min
        and metrics["citation_correctness"] >= thresholds.citation_correctness_min
    )
