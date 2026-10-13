import type {
  ExperimentConfig,
  ExperimentManifest,
  FeatureSpec,
  FoldAssignment,
  FoldMetrics,
  ModelKind,
  RandomFoldStrategy,
  SamplePrediction,
  SplitScheme,
} from "../benchmark/contracts.js";
import { BenchmarkReplayError } from "../benchmark/errors.js";
import { parseTaskDefinition } from "../benchmark/parseTask.js";

const LEGACY_V1_FEATURES: readonly FeatureSpec[] = [
  {
    name: "elevation_m",
    source: "synthetic_dem",
    units: "meters",
    transformation: "none",
    missingValuePolicy: "reject",
  },
  {
    name: "slope_deg",
    source: "synthetic_dem",
    units: "degrees",
    transformation: "none",
    missingValuePolicy: "reject",
  },
];

function taskWithFeatureContract(task: Record<string, unknown>): Record<string, unknown> {
  if ("features" in task) return task;
  return { ...task, features: LEGACY_V1_FEATURES };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const SPLIT_SCHEMES: readonly SplitScheme[] = ["random", "spatial"];
const MODEL_KINDS: readonly ModelKind[] = ["majority", "random_forest"];
const RANDOM_FOLD_STRATEGIES: readonly RandomFoldStrategy[] = ["shuffled", "stratified"];

function invalidConfig(field: string): BenchmarkReplayError {
  return new BenchmarkReplayError(`Manifest config.${field} is invalid`);
}

function readConfigString(config: Record<string, unknown>, field: string): string {
  const value = config[field];
  if (typeof value !== "string" || value === "") throw invalidConfig(field);
  return value;
}

function readConfigInteger(config: Record<string, unknown>, field: string): number {
  const value = config[field];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw invalidConfig(field);
  return value;
}

function readConfigList<T extends string>(config: Record<string, unknown>, field: string, allowed: readonly T[]): T[] {
  const value = config[field];
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => !allowed.includes(entry as T))) {
    throw invalidConfig(field);
  }
  return value as T[];
}

function parseConfig(config: Record<string, unknown>): ExperimentConfig {
  const randomForest = config.randomForest;
  if (!isRecord(randomForest)) throw invalidConfig("randomForest");
  const taskSha256 = config.taskSha256;
  if (taskSha256 !== undefined && typeof taskSha256 !== "string") throw invalidConfig("taskSha256");
  const randomFoldStrategy = config.randomFoldStrategy;
  if (randomFoldStrategy !== undefined && !RANDOM_FOLD_STRATEGIES.includes(randomFoldStrategy as RandomFoldStrategy)) {
    throw invalidConfig("randomFoldStrategy");
  }

  return {
    taskId: readConfigString(config, "taskId"),
    fixtureSha256: readConfigString(config, "fixtureSha256"),
    ...(taskSha256 === undefined ? {} : { taskSha256 }),
    seed: readConfigInteger(config, "seed"),
    foldCount: readConfigInteger(config, "foldCount"),
    ...(randomFoldStrategy === undefined ? {} : { randomFoldStrategy: randomFoldStrategy as RandomFoldStrategy }),
    schemes: readConfigList(config, "schemes", SPLIT_SCHEMES),
    models: readConfigList(config, "models", MODEL_KINDS),
    randomForest: {
      library: readConfigString(randomForest, "library"),
      libraryVersion: readConfigString(randomForest, "libraryVersion"),
      nEstimators: readConfigInteger(randomForest, "nEstimators"),
    },
  };
}

function readArray<T>(raw: Record<string, unknown>, field: string): readonly T[] {
  const value = raw[field];
  if (!Array.isArray(value)) throw new BenchmarkReplayError(`Manifest ${field} must be an array`);
  return value as T[];
}

export function parseManifest(raw: unknown): ExperimentManifest {
  if (!isRecord(raw)) throw new BenchmarkReplayError("Manifest must be an object");
  if (raw.manifestVersion !== 1) throw new BenchmarkReplayError("Unsupported manifest version");

  const config = raw.config;
  const task = raw.task;
  if (!isRecord(config) || !isRecord(task)) throw new BenchmarkReplayError("Manifest config/task missing");
  if (typeof raw.createdAt !== "string") throw new BenchmarkReplayError("Manifest createdAt must be a string");
  if (typeof raw.incomplete !== "boolean") throw new BenchmarkReplayError("Manifest incomplete must be a boolean");
  const dependencyVersions = raw.dependencyVersions;
  if (!isRecord(dependencyVersions) || Object.values(dependencyVersions).some((value) => typeof value !== "string")) {
    throw new BenchmarkReplayError("Manifest dependencyVersions must map names to version strings");
  }

  return {
    manifestVersion: 1,
    createdAt: raw.createdAt,
    incomplete: raw.incomplete,
    config: parseConfig(config),
    task: parseTaskDefinition(taskWithFeatureContract(task)),
    // Fold, metric and prediction rows are compared against a fresh run during replay, not trusted as inputs.
    foldAssignments: readArray<FoldAssignment>(raw, "foldAssignments"),
    metrics: readArray<FoldMetrics>(raw, "metrics"),
    predictions: readArray<SamplePrediction>(raw, "predictions"),
    dependencyVersions: dependencyVersions as Record<string, string>,
  };
}

export function assertManifestMatchesFixture(
  manifest: ExperimentManifest,
  fixture: { readonly fixtureSha256: string; readonly taskSha256: string },
): void {
  if (manifest.config.fixtureSha256 !== fixture.fixtureSha256) {
    throw new BenchmarkReplayError("Manifest fixture hash does not match current fixture contents");
  }
  const recordedTaskSha256 = manifest.config.taskSha256;
  if (recordedTaskSha256 !== undefined && recordedTaskSha256 !== fixture.taskSha256) {
    throw new BenchmarkReplayError("Manifest task definition hash does not match current task.json");
  }
}

export function serializeManifest(manifest: ExperimentManifest): string {
  return JSON.stringify(manifest, null, 2);
}
