import type { ClassifierModel } from "./modelPort.js";

export function createMajorityBaseline(tieBreakLowerClass = true): ClassifierModel {
  let majorityClass: number | undefined;

  return {
    kind: "majority",
    fit(_features, labels) {
      if (labels.length === 0) {
        majorityClass = undefined;
        return;
      }
      const counts = new Map<number, number>();
      labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
      let bestLabel = labels[0];
      let bestCount = -1;
      counts.forEach((count, label) => {
        if (count > bestCount) {
          bestCount = count;
          bestLabel = label;
          return;
        }
        if (count === bestCount && tieBreakLowerClass && label < (bestLabel ?? Number.MAX_SAFE_INTEGER)) {
          bestLabel = label;
        }
      });
      majorityClass = bestLabel;
    },
    predict(features) {
      const predicted = majorityClass;
      if (predicted === undefined) return features.map(() => Number.NaN);
      return features.map(() => predicted);
    },
  };
}
