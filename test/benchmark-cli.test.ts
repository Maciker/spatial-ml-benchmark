import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { replayBenchmarkCommand, runBenchmarkCommand } from "../apps/cli/src/benchmarkCommands.js";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");

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
});
