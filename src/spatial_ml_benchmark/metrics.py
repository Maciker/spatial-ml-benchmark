"""Metrics reported consistently across benchmark runs."""

from dataclasses import dataclass

from sklearn.metrics import balanced_accuracy_score


@dataclass(frozen=True)
class ClassificationScore:
    balanced_accuracy: float


def score_classification(y_true: list[int], y_pred: list[int]) -> ClassificationScore:
    """Return a metric that remains meaningful under class imbalance."""
    return ClassificationScore(balanced_accuracy=balanced_accuracy_score(y_true, y_pred))
