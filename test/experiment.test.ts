import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDataset } from "../packages/domain/src/dataset.js";
import { DomainError } from "../packages/domain/src/domain-error.js";
import { runBenchmark } from "../packages/domain/src/experiment.js";
import { replayManifest, writeManifest } from "../packages/domain/src/manifest.js";

const dataset = parseDataset(
  JSON.parse(readFileSync(resolve("data/meadow-woodland/samples.json"), "utf8")),
);

describe("The benchmark comparison", () => {
  it("reports random and spatial results without treating the fixture as significant", () => {
    const result = runBenchmark(dataset, { seed: 21, foldCount: 4, bufferMeters: 10_000 });

    expect(result.principalScheme).toBe("spatial");
    expect(result.limitations).toContain("tiny fixture");
    expect(result.schemes.spatial.majority.folds).toHaveLength(4);
    expect(result.schemes.random.forest.folds).toHaveLength(4);
    expect(result.schemes.spatial.majority.meanBalancedAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.predictions[0]?.sampleId).toBeDefined();
  });

  it("detects a leaked group identifier used as a predictor", () => {
    expect(() =>
      runBenchmark(dataset, { seed: 21, foldCount: 4, bufferMeters: 10_000, extraFeatures: ["spatialGroup"] }),
    ).toThrow(DomainError);
  });
});

describe("The experiment manifest", () => {
  it("replays identical predictions and rejects a tampered source hash", () => {
    const result = runBenchmark(dataset, { seed: 21, foldCount: 4, bufferMeters: 10_000 });
    const manifest = writeManifest(dataset, result, { seed: 21, packageVersion: "0.1.0" });

    expect(replayManifest(dataset, manifest).predictions).toEqual(manifest.predictions);

    const tampered = { ...manifest, sourceHash: "0".repeat(64) };
    expect(() => replayManifest(dataset, tampered)).toThrow(DomainError);
  });
});
