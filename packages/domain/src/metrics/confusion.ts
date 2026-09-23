import type { ConfusionCounts } from "../benchmark/contracts.js";

export function buildConfusionCounts(truth: readonly number[], predictions: readonly number[]): ConfusionCounts {
  const matrix: Record<string, Record<string, number>> = {};
  const supportByClass: Record<string, number> = {};

  truth.forEach((trueLabel, index) => {
    const predicted = predictions[index];
    if (predicted === undefined) return;
    const trueKey = String(trueLabel);
    const predictedKey = String(predicted);
    supportByClass[trueKey] = (supportByClass[trueKey] ?? 0) + 1;
    matrix[trueKey] ??= {};
    matrix[trueKey][predictedKey] = (matrix[trueKey][predictedKey] ?? 0) + 1;
  });

  return { matrix, supportByClass };
}

export function perClassRecall(confusion: ConfusionCounts): Readonly<Record<string, number>> {
  const recalls: Record<string, number> = {};
  for (const [trueClass, support] of Object.entries(confusion.supportByClass)) {
    const row = confusion.matrix[trueClass] ?? {};
    const correct = row[trueClass] ?? 0;
    recalls[trueClass] = support === 0 ? Number.NaN : correct / support;
  }
  return recalls;
}

export function classSupport(labels: readonly number[]): Readonly<Record<string, number>> {
  const support: Record<string, number> = {};
  labels.forEach((label) => {
    const key = String(label);
    support[key] = (support[key] ?? 0) + 1;
  });
  return support;
}
