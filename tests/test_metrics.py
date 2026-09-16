from spatial_ml_benchmark.metrics import score_classification


def test_score_classification_uses_balanced_accuracy() -> None:
    score = score_classification([0, 0, 1, 1], [0, 0, 1, 0])

    assert score.balanced_accuracy == 0.75
