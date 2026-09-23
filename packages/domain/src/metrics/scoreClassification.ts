export function scoreClassification(truth: readonly number[], predictions: readonly number[]): { balanced_accuracy: number } {
  if (truth.length !== predictions.length) throw new Error("Truth and predictions must have equal length");
  const recalls = new Map<number, { total: number; correct: number }>();
  truth.forEach((label, index) => {
    const value = recalls.get(label) ?? { total: 0, correct: 0 };
    value.total += 1;
    if (predictions[index] === label) value.correct += 1;
    recalls.set(label, value);
  });
  if (recalls.size === 0) return { balanced_accuracy: Number.NaN };
  const sum = [...recalls.values()].reduce((total, value) => total + value.correct / value.total, 0);
  return { balanced_accuracy: sum / recalls.size };
}
