import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertManifestMatchesFixture,
  buildFeatureTable,
  parseManifest,
  runExperiment,
  serializeManifest,
  type ExperimentConfig,
  type ExperimentManifest,
} from "../../../packages/domain/src/index.js";
import { loadFixture } from "./loadFixture.js";
import { mlRandomForestAdapter } from "./infrastructure/mlRandomForestAdapter.js";

type RunBenchmarkOptions = {
  readonly fixtureDir: string;
  readonly outputDir: string;
  readonly seed?: number;
};

export async function runBenchmarkCommand(options: RunBenchmarkOptions): Promise<ExperimentManifest> {
  const fixture = await loadFixture(options.fixtureDir);
  const config: ExperimentConfig = {
    taskId: fixture.task.taskId,
    fixtureSha256: fixture.fixtureSha256,
    seed: options.seed ?? 42,
    foldCount: 3,
    schemes: ["random", "spatial"],
    models: ["majority", "random_forest"],
    randomForest: {
      library: mlRandomForestAdapter.library,
      libraryVersion: mlRandomForestAdapter.libraryVersion,
      nEstimators: 25,
    },
  };

  const manifest = runExperiment({
    task: fixture.task,
    samples: fixture.samples,
    config,
    dependencyVersions: {
      node: process.version,
      "ml-random-forest": mlRandomForestAdapter.libraryVersion,
    },
    randomForestAdapter: mlRandomForestAdapter,
  });

  await mkdir(options.outputDir, { recursive: true });
  await writeFile(path.join(options.outputDir, "manifest.json"), serializeManifest(manifest), "utf8");

  const featurePreview = buildFeatureTable(fixture.samples, fixture.task);
  await writeFile(
    path.join(options.outputDir, "feature-table.json"),
    JSON.stringify({ specs: featurePreview.specs, rows: featurePreview.rows }, null, 2),
    "utf8",
  );

  return manifest;
}

export async function replayBenchmarkCommand(fixtureDir: string, manifestPath: string): Promise<ExperimentManifest> {
  const fixture = await loadFixture(fixtureDir);
  const stored = parseManifest(JSON.parse(await readFile(manifestPath, "utf8")) as unknown);
  assertManifestMatchesFixture(stored, fixture.fixtureSha256);

  const replayed = runExperiment({
    task: fixture.task,
    samples: fixture.samples,
    config: stored.config,
    dependencyVersions: stored.dependencyVersions,
    randomForestAdapter: mlRandomForestAdapter,
    createdAt: stored.createdAt,
  });

  if (JSON.stringify(replayed.predictions) !== JSON.stringify(stored.predictions)) {
    throw new Error("Replay predictions differ from stored manifest");
  }
  if (JSON.stringify(replayed.metrics) !== JSON.stringify(stored.metrics)) {
    throw new Error("Replay metrics differ from stored manifest");
  }

  return replayed;
}
