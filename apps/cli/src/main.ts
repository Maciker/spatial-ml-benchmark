import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCliArgs } from "./cliArgs.js";
import { renderKernelDemonstration } from "./demonstration.js";
import { replayBenchmarkCommand, runBenchmarkCommand } from "./benchmarkCommands.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

async function main(): Promise<void> {
  const parsed = parseCliArgs(process.argv.slice(2), {
    fixtureDir: path.join(repoRoot, "fixtures/mvp-demo"),
    outputDir: path.join(repoRoot, ".benchmark-runs/latest"),
    manifestPath: path.join(repoRoot, ".benchmark-runs/latest/manifest.json"),
  });

  if (parsed.command === "run") {
    const manifest = await runBenchmarkCommand({
      fixtureDir: path.resolve(parsed.fixtureDir),
      outputDir: path.resolve(parsed.outputDir),
      ...(parsed.seed === undefined ? {} : { seed: parsed.seed }),
    });
    process.stdout.write(
      `${JSON.stringify({ ok: true, outputDir: parsed.outputDir, metrics: manifest.metrics.length }, null, 2)}\n`,
    );
    return;
  }

  if (parsed.command === "replay") {
    const result = await replayBenchmarkCommand(path.resolve(parsed.fixtureDir), path.resolve(parsed.manifestPath));
    process.stdout.write(`${JSON.stringify({ ok: true, replay: "matched", warnings: result.warnings }, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderKernelDemonstration([0, 0, 1, 1], [0, 0, 1, 0])}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
