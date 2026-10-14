import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { replayBenchmarkCommand } from "../apps/cli/src/benchmarkCommands.js";

const publicManifestPath = path.join(process.cwd(), "apps/web/public/demo-manifest.json");
const lucasFixtureDir = path.join(process.cwd(), "fixtures/lucas-spain-2022");

describe("The web demo manifest", () => {
  it("is served from apps/web/public/demo-manifest.json with LUCAS sample IDs", () => {
    const manifest = JSON.parse(readFileSync(publicManifestPath, "utf8")) as {
      predictions: { sampleId: string }[];
    };
    const samples = JSON.parse(
      readFileSync(path.join(lucasFixtureDir, "samples.json"), "utf8"),
    ) as { samples: { id: string }[] };

    const fixtureIds = new Set(samples.samples.map((sample) => sample.id));
    const predictionIds = new Set(manifest.predictions.map((row) => row.sampleId));

    expect(publicManifestPath.endsWith("apps/web/public/demo-manifest.json")).toBe(true);
    expect(manifest.predictions.length).toBeGreaterThan(0);
    expect(fixtureIds.size).toBe(32);
    expect(predictionIds).toEqual(fixtureIds);
  });

  it("exposes LUCAS provenance signals matching the fixture task", () => {
    const manifest = JSON.parse(readFileSync(publicManifestPath, "utf8")) as {
      task: {
        taskId: string;
        source: { name: string; license: string; reference: string };
      };
    };
    const task = JSON.parse(readFileSync(path.join(lucasFixtureDir, "task.json"), "utf8")) as {
      taskId: string;
      source: { name: string; license: string; reference: string };
    };

    expect(manifest.task.taskId).toBe("lucas-spain-2022-cropland-woodland");
    expect(manifest.task.taskId).toBe(task.taskId);
    expect(manifest.task.source.name).toBe(task.source.name);
    expect(manifest.task.source.license).toBe(task.source.license);
    expect(manifest.task.source.reference).toBe(task.source.reference);
  });

  it("is recorded with the current run contract rather than a legacy one", () => {
    const manifest = JSON.parse(readFileSync(publicManifestPath, "utf8")) as {
      config: { taskSha256?: string; randomFoldStrategy?: string };
    };

    expect(manifest.config.taskSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.config.randomFoldStrategy).toBe("stratified");
  });

  it("replays the committed explorer manifest against the LUCAS fixture", async () => {
    await expect(replayBenchmarkCommand(lucasFixtureDir, publicManifestPath)).resolves.toBeDefined();
  });
});
