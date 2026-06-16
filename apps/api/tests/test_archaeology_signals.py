"""Archaeology signal computation tests."""

import uuid
from datetime import UTC, datetime

from app.services.archaeology_signals import RiskSignal, _is_after_hours, compute_risk_signals


def test_is_after_hours():
    # 23:00 UTC
    ts = int(datetime(2024, 1, 15, 23, 0, tzinfo=UTC).timestamp())
    assert _is_after_hours(ts) is True
    # 14:00 UTC
    ts_day = int(datetime(2024, 1, 15, 14, 0, tzinfo=UTC).timestamp())
    assert _is_after_hours(ts_day) is False


def test_risk_signal_to_dict():
    signal = RiskSignal(
        signal_type="after_hours",
        label="test",
        path=None,
        score=0.9,
        evidence={"k": "v"},
    )
    assert signal.to_dict()["signal_type"] == "after_hours"


def test_compute_signals_empty_db():
    from unittest.mock import MagicMock

    db = MagicMock()
    db.execute.return_value.scalars.return_value.all.return_value = []
    signals = compute_risk_signals(db, engagement_id=uuid.uuid4())
    assert signals == []
