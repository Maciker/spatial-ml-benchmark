import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assignFolds,
  foldHasSpatialGroupLeakage,
  parseSamples,
  parseTaskDefinition,
  sharedSpatialGroupsBetweenPartitions,
} from "../packages/domain/src/index.js";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");

describe("Fold assignment", () => {
  it("keeps spatial groups disjoint for spatial splits", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);
    const folds = assignFolds(samples, "spatial", 3, 42);

    folds.forEach((fold) => {
      expect(foldHasSpatialGroupLeakage(samples, fold)).toBe(false);
    });
  });

  it("flags spatial-group leakage for random splits on the demo fixture", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);
    const folds = assignFolds(samples, "random", 3, 42);

    const leaky = folds.some((fold) =>
      sharedSpatialGroupsBetweenPartitions(samples, fold.trainSampleIds, fold.testSampleIds).length > 0,
    );

    expect(leaky).toBe(true);
  });

  it("repeats the same random assignments for a fixed seed", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);
    const first = assignFolds(samples, "random", 3, 99);
    const second = assignFolds(samples, "random", 3, 99);

    expect(first).toEqual(second);
  });
});
