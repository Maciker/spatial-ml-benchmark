import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseSamples,
  parseTaskDefinition,
  runExperiment,
  type ExperimentConfig,
} from "../packages/domain/src/index.js";
import { mlRandomForestAdapter } from "../apps/cli/src/infrastructure/mlRandomForestAdapter.js";
import { createHash } from "node:crypto";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");

describe("The benchmark experiment runner", () => {
  it("reports both split schemes for majority and random forest models", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);
    const fixtureSha256 = createHash("sha256").update(readFileSync(path.join(fixtureDir, "samples.json"))).digest("hex");

    const config: ExperimentConfig = {
      taskId: task.taskId,
      fixtureSha256,
      seed: 42,
      foldCount: 3,
      schemes: ["random", "spatial"],
      models: ["majority", "random_forest"],
      randomForest: {
        library: "ml-random-forest",
        libraryVersion: "2.1.0",
        nEstimators: 25,
      },
    };

    const manifest = runExperiment({
      task,
      samples,
      config,
      dependencyVersions: { node: process.version },
      randomForestAdapter: mlRandomForestAdapter,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(manifest.metrics.length).toBe(12);
    expect(manifest.predictions.length).toBeGreaterThan(0);
    expect(manifest.metrics.some((metric) => metric.scheme === "random" && metric.warnings.length > 0)).toBe(true);
    expect(manifest.metrics.some((metric) => metric.scheme === "spatial" && metric.warnings.length === 0)).toBe(true);
  });
});
