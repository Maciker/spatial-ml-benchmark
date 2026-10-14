/**
 * Largest change one evaluation point can make to balanced accuracy: flipping a sample of
 * the smallest class moves that class's recall by 1/n, and balanced accuracy averages K recalls.
 */
export function balancedAccuracyStep(testClassSupport: Readonly<Record<string, number>> | undefined): number {
  const supports = Object.values(testClassSupport ?? {}).filter((count) => count > 0);
  if (supports.length === 0) return Number.NaN;
  return 1 / (supports.length * Math.min(...supports));
}

export function formatBalancedAccuracyStep(testClassSupport: Readonly<Record<string, number>> | undefined): string {
  const step = balancedAccuracyStep(testClassSupport);
  return Number.isFinite(step) ? `±${step.toFixed(3)}` : "—";
}
