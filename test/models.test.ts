import { describe, expect, it } from "vitest";
import { DomainError } from "../packages/domain/src/domain-error.js";
import { fitMajority, predictMajority } from "../packages/domain/src/majority.js";
import { fitForest, predictForest, serializeForest } from "../packages/domain/src/forest.js";
import { scoreClassification, summarizePredictions } from "../packages/domain/src/metrics.js";

describe("The majority baseline", () => {
  it("fits the majority training label and uses the lower class on a tie", () => {
    const model = fitMajority([0, 0, 1, 1]);

    expect(predictMajority(model, 3)).toEqual([0, 0, 0]);
  });

  it("rejects empty training labels", () => {
    expect(() => fitMajority([])).toThrow(DomainError);
  });
});

describe("The seeded forest", () => {
  it("repeats predictions for the same seed and reloads from a snapshot", () => {
    const features = [
      [0.1, 10],
      [0.2, 12],
      [0.8, 40],
      [0.9, 42],
    ];
    const labels: Array<0 | 1> = [0, 0, 1, 1];
    const first = fitForest(features, labels, { seed: 11, treeCount: 5, maxDepth: 3 });
    const second = fitForest(features, labels, { seed: 11, treeCount: 5, maxDepth: 3 });
    const reloaded = serializeForest(first);

    expect(predictForest(first, features)).toEqual(predictForest(second, features));
    expect(predictForest(reloaded, features)).toEqual(predictForest(first, features));
  });
});

describe("The classification score", () => {
  it("reports balanced accuracy, recalls and confusion counts", () => {
    const summary = summarizePredictions([0, 0, 1, 1], [0, 0, 1, 0]);

    expect(summary.balancedAccuracy).toBe(0.75);
    expect(summary.recalls).toEqual({ 0: 1, 1: 0.5 });
    expect(summary.support).toEqual({ 0: 2, 1: 2 });
    expect(scoreClassification([0, 0, 1, 1], [0, 0, 1, 0]).balanced_accuracy).toBe(0.75);
  });

  it("rejects empty evaluation sets", () => {
    expect(() => summarizePredictions([], [])).toThrow(DomainError);
  });
});
