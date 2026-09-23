import { scoreClassification } from "../../../packages/domain/src/index.js";

export function renderKernelDemonstration(
  truth: readonly number[],
  predictions: readonly number[],
): string {
  const score = scoreClassification(truth, predictions);
  return `balanced_accuracy=${score.balanced_accuracy}`;
}
