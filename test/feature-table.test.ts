import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BenchmarkValidationError,
  buildFeatureTable,
  fitFoldNormalizer,
  parseSamples,
  parseTaskDefinition,
} from "../packages/domain/src/index.js";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");

describe("The feature table builder", () => {
  it("records provenance specs and rejects forbidden target columns", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);

    const table = buildFeatureTable(samples, task);

    expect(table.specs.map((spec) => spec.name)).toEqual(["elevation_m", "slope_deg"]);
    expect(table.rows).toHaveLength(12);

    const leakySample = {
      ...samples[0]!,
      rawFeatures: { ...samples[0]!.rawFeatures, future_label: 1 },
    };

    expect(() => buildFeatureTable([leakySample], task)).toThrow(BenchmarkValidationError);
  });

  it("fits normalization using training-fold rows only", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);
    const { rows } = buildFeatureTable(samples, task);
    const trainIds = new Set(["s01", "s02", "s03", "s04"]);
    const normalizer = fitFoldNormalizer(rows, trainIds, ["elevation_m"]);

    const normalizedTrainSample = normalizer.normalize(rows[0]!.values);
    expect(normalizedTrainSample.elevation_m).toBeCloseTo(12 - (12 + 14 + 18 + 20) / 4, 5);
  });
});
