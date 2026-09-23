import type { ExperimentManifest, FeatureSpec } from "../benchmark/contracts.js";
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

export function parseManifest(raw: unknown): ExperimentManifest {
  if (!isRecord(raw)) throw new BenchmarkReplayError("Manifest must be an object");
  if (raw.manifestVersion !== 1) throw new BenchmarkReplayError("Unsupported manifest version");

  const config = raw.config;
  const task = raw.task;
  if (!isRecord(config) || !isRecord(task)) throw new BenchmarkReplayError("Manifest config/task missing");

  parseTaskDefinition(taskWithFeatureContract(task));

  return raw as unknown as ExperimentManifest;
}

export function assertManifestMatchesFixture(manifest: ExperimentManifest, fixtureSha256: string): void {
  if (manifest.config.fixtureSha256 !== fixtureSha256) {
    throw new BenchmarkReplayError("Manifest fixture hash does not match current fixture contents");
  }
}

export function serializeManifest(manifest: ExperimentManifest): string {
  return JSON.stringify(manifest, null, 2);
}
