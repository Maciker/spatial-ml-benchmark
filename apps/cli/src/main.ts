import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderKernelDemonstration } from "./demonstration.js";
import { replayBenchmarkCommand, runBenchmarkCommand } from "./benchmarkCommands.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const defaultFixture = path.join(repoRoot, "fixtures/mvp-demo");

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  if (command === "benchmark" && rest[0] === "run") {
    const fixtureFlagIndex = rest.indexOf("--fixture");
    const outputFlagIndex = rest.indexOf("--output");
    const seedFlagIndex = rest.indexOf("--seed");
    const fixtureDir =
      fixtureFlagIndex >= 0 ? (rest[fixtureFlagIndex + 1] ?? defaultFixture) : defaultFixture;
    const outputDir =
      outputFlagIndex >= 0 ? (rest[outputFlagIndex + 1] ?? path.join(repoRoot, ".benchmark-runs/latest")) : path.join(repoRoot, ".benchmark-runs/latest");
    const seedValue = seedFlagIndex >= 0 ? Number(rest[seedFlagIndex + 1]) : undefined;
    const manifest = await runBenchmarkCommand({
      fixtureDir: path.resolve(fixtureDir),
      outputDir: path.resolve(outputDir),
      ...(seedValue !== undefined && Number.isFinite(seedValue) ? { seed: seedValue } : {}),
    });
    process.stdout.write(`${JSON.stringify({ ok: true, outputDir, metrics: manifest.metrics.length }, null, 2)}\n`);
    return;
  }

  if (command === "benchmark" && rest[0] === "replay") {
    const fixtureFlagIndex = rest.indexOf("--fixture");
    const manifestFlagIndex = rest.indexOf("--manifest");
    const fixtureDir =
      fixtureFlagIndex >= 0 ? (rest[fixtureFlagIndex + 1] ?? defaultFixture) : defaultFixture;
    const manifestPath =
      manifestFlagIndex >= 0
        ? (rest[manifestFlagIndex + 1] ?? path.join(repoRoot, ".benchmark-runs/latest/manifest.json"))
        : path.join(repoRoot, ".benchmark-runs/latest/manifest.json");
    await replayBenchmarkCommand(path.resolve(fixtureDir), path.resolve(manifestPath));
    process.stdout.write(JSON.stringify({ ok: true, replay: "matched" }, null, 2) + "\n");
    return;
  }

  process.stdout.write(`${renderKernelDemonstration([0, 0, 1, 1], [0, 0, 1, 0])}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
