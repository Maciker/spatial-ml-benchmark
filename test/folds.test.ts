import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDataset } from "../packages/domain/src/dataset.js";
import { DomainError } from "../packages/domain/src/domain-error.js";
import { assignFolds } from "../packages/domain/src/folds.js";

const dataset = parseDataset(
  JSON.parse(readFileSync(resolve("data/meadow-woodland/samples.json"), "utf8")),
);

describe("The fold assignment", () => {
  it("keeps spatial groups wholly in train or test", () => {
    const assignment = assignFolds(dataset, { scheme: "spatial", foldCount: 4, seed: 7, bufferMeters: 10_000 });

    expect(assignment.scheme).toBe("spatial");
    expect(assignment.folds).toHaveLength(4);
    for (const fold of assignment.folds) {
      const trainGroups = new Set(
        dataset.samples.filter((sample) => fold.trainIds.includes(sample.id)).map((sample) => sample.spatialGroup),
      );
      const testGroups = new Set(
        dataset.samples.filter((sample) => fold.testIds.includes(sample.id)).map((sample) => sample.spatialGroup),
      );
      for (const group of testGroups) {
        expect(trainGroups.has(group)).toBe(false);
      }
    }
  });

  it("repeats the same random assignment for a seed", () => {
    const first = assignFolds(dataset, { scheme: "random", foldCount: 4, seed: 42, bufferMeters: 0 });
    const second = assignFolds(dataset, { scheme: "random", foldCount: 4, seed: 42, bufferMeters: 0 });

    expect(first.folds.map((fold) => fold.testIds)).toEqual(second.folds.map((fold) => fold.testIds));
  });

  it("rejects a buffer that would mix neighbouring train and test points", () => {
    expect(() =>
      assignFolds(dataset, { scheme: "spatial", foldCount: 4, seed: 7, bufferMeters: 1_000_000 }),
    ).toThrow(DomainError);
  });

  it("rejects an empty spatial group as a fold", () => {
    const broken = {
      ...dataset,
      samples: dataset.samples.filter((sample) => sample.spatialGroup !== "east-south"),
    };

    expect(() => assignFolds(broken, { scheme: "spatial", foldCount: 4, seed: 1, bufferMeters: 0 })).toThrow(DomainError);
  });
});
