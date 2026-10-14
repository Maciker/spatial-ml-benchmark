import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assignFolds,
  foldHasSpatialGroupLeakage,
  parseSamples,
  parseTaskDefinition,
  BenchmarkValidationError,
  sharedSpatialGroupsBetweenPartitions,
  type ParsedSample,
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

  it.each([
    { groupCount: 5, foldCount: 4 },
    { groupCount: 7, foldCount: 5 },
    { groupCount: 10, foldCount: 4 },
  ])("spreads $groupCount spatial groups over $foldCount non-empty folds", ({ groupCount, foldCount }) => {
    const samples = samplesInGroups(groupCount);

    const folds = assignFolds(samples, "spatial", foldCount, 7);

    const groupsPerFold = folds.map((fold) => fold.spatialGroupsInTest.length);
    expect(folds).toHaveLength(foldCount);
    expect(Math.min(...groupsPerFold)).toBeGreaterThan(0);
    expect(Math.max(...groupsPerFold) - Math.min(...groupsPerFold)).toBeLessThanOrEqual(1);
    expect(new Set(folds.flatMap((fold) => fold.spatialGroupsInTest)).size).toBe(groupCount);
  });

  it("rejects a non-integer fold count", () => {
    const samples = samplesInGroups(4);

    expect(() => assignFolds(samples, "spatial", 2.5, 7)).toThrow(BenchmarkValidationError);
    expect(() => assignFolds(samples, "random", 2.5, 7)).toThrow(BenchmarkValidationError);
  });

  it("keeps per-class counts within one sample across stratified random folds", () => {
    const samples = Array.from({ length: 23 }, (_, index) => ({
      id: `s${index}`,
      lon: 0,
      lat: 0,
      spatialGroup: "g",
      label: index < 15 ? 0 : 1,
      rawFeatures: { x: index },
    }));

    const folds = assignFolds(samples, "random", 4, 3, "stratified");

    for (const label of [0, 1]) {
      const perFold = folds.map(
        (fold) => fold.testSampleIds.filter((id) => samples.find((sample) => sample.id === id)?.label === label).length,
      );
      expect(Math.max(...perFold) - Math.min(...perFold)).toBeLessThanOrEqual(1);
    }
    expect(folds.flatMap((fold) => fold.testSampleIds).sort()).toEqual(samples.map((sample) => sample.id).sort());
    expect(assignFolds(samples, "random", 4, 3, "stratified")).toEqual(folds);
  });

  it("keeps the legacy shuffled random folds as the default strategy", () => {
    const samples = samplesInGroups(6);

    expect(assignFolds(samples, "random", 3, 5)).toEqual(assignFolds(samples, "random", 3, 5, "shuffled"));
  });

  it("rejects fewer than two spatial folds", () => {
    expect(() => assignFolds(samplesInGroups(3), "spatial", 1, 7)).toThrow(BenchmarkValidationError);
  });
});

function samplesInGroups(groupCount: number): ParsedSample[] {
  return Array.from({ length: groupCount * 2 }, (_, index) => ({
    id: `s${index}`,
    lon: index,
    lat: index,
    spatialGroup: `g${Math.floor(index / 2)}`,
    label: index % 2,
    rawFeatures: { x: index },
  }));
}
