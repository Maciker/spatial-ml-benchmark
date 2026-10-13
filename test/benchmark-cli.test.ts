import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("rejects a replay after the task definition changed", async () => {
    const workDir = await mkdtemp(path.join(os.tmpdir(), "benchmark-task-drift-"));
    const copiedFixture = path.join(workDir, "fixture");
    const outputDir = path.join(workDir, "run");

    try {
      await cp(fixtureDir, copiedFixture, { recursive: true });
      await runBenchmarkCommand({ fixtureDir: copiedFixture, outputDir, seed: 42 });
      const taskPath = path.join(copiedFixture, "task.json");
      const task = JSON.parse(await readFile(taskPath, "utf8")) as { source: { license: string } };
      task.source.license = "changed after the run";
      await writeFile(taskPath, JSON.stringify(task), "utf8");

      await expect(replayBenchmarkCommand(copiedFixture, path.join(outputDir, "manifest.json"))).rejects.toThrow(
        /task definition/,
      );
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  it("warns when a replay runs on a different Node.js major version", async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), "benchmark-node-drift-"));

    try {
      await runBenchmarkCommand({ fixtureDir, outputDir, seed: 42 });
      const manifestPath = path.join(outputDir, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { dependencyVersions: { node: string } };
      manifest.dependencyVersions.node = "v1.0.0";
      await writeFile(manifestPath, JSON.stringify(manifest), "utf8");

      const replay = await replayBenchmarkCommand(fixtureDir, manifestPath);

      expect(replay.warnings).toEqual([`Manifest recorded Node.js v1.0.0; replay ran on ${process.version}`]);
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
