export function formatPredictedLabel(predictedLabel: number): string {
  if (!Number.isFinite(predictedLabel)) return "undefined (non-finite prediction)";
  return String(predictedLabel);
}
