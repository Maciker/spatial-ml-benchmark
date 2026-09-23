import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { replayBenchmarkCommand, runBenchmarkCommand } from "../apps/cli/src/benchmarkCommands.js";
import { parseManifest } from "../packages/domain/src/index.js";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");
const lucasFixtureDir = path.join(process.cwd(), "fixtures/lucas-spain-2022");

describe("The benchmark CLI workflow", () => {
  it("writes a manifest and replays identical predictions", async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), "benchmark-run-"));

    try {
      await runBenchmarkCommand({ fixtureDir, outputDir, seed: 42 });
      const manifestPath = path.join(outputDir, "manifest.json");
      const manifestText = await readFile(manifestPath, "utf8");
      expect(manifestText).toContain("manifestVersion");

      await replayBenchmarkCommand(fixtureDir, manifestPath);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("runs the LUCAS Spain extract with one spatial fold per block", async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), "lucas-benchmark-"));

    try {
      const manifest = await runBenchmarkCommand({ fixtureDir: lucasFixtureDir, outputDir, seed: 42 });

      expect(manifest.config.foldCount).toBe(2);
      expect(manifest.metrics.filter((metric) => metric.scheme === "spatial")).toHaveLength(4);
      await replayBenchmarkCommand(lucasFixtureDir, path.join(outputDir, "manifest.json"));
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("replays the committed MVP reference manifest", async () => {
    const manifest = parseManifest(
      JSON.parse(await readFile(path.join(fixtureDir, "reference-manifest.json"), "utf8")) as unknown,
    );

    expect(manifest.task.features.map((feature) => feature.name)).toEqual(["elevation_m", "slope_deg"]);
    await replayBenchmarkCommand(fixtureDir, path.join(fixtureDir, "reference-manifest.json"));
  });
});
