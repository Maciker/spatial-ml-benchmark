import type { ExperimentManifest } from "../benchmark/contracts.js";
import { BenchmarkReplayError } from "../benchmark/errors.js";
import { parseTaskDefinition } from "../benchmark/parseTask.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseManifest(raw: unknown): ExperimentManifest {
  if (!isRecord(raw)) throw new BenchmarkReplayError("Manifest must be an object");
  if (raw.manifestVersion !== 1) throw new BenchmarkReplayError("Unsupported manifest version");

  const config = raw.config;
  const task = raw.task;
  if (!isRecord(config) || !isRecord(task)) throw new BenchmarkReplayError("Manifest config/task missing");

  parseTaskDefinition(task);

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
