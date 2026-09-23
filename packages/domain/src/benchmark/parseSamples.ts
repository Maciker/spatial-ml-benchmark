import type { ParsedSample, TaskDefinition } from "./contracts.js";
import { BenchmarkValidationError } from "./errors.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSamples(raw: unknown, task: TaskDefinition): readonly ParsedSample[] {
  if (!isRecord(raw)) throw new BenchmarkValidationError("Samples payload must be a JSON object");
  const list = raw.samples;
  if (!Array.isArray(list)) throw new BenchmarkValidationError('Samples payload must contain a "samples" array');

  const seenIds = new Set<string>();
  const allowedClasses = new Set(task.target.classes);
  const parsed: ParsedSample[] = [];

  for (const entry of list) {
    if (!isRecord(entry)) throw new BenchmarkValidationError("Each sample must be an object");
    const id = entry.id;
    if (typeof id !== "string" || id.trim() === "") {
      throw new BenchmarkValidationError("Each sample requires a non-empty string id");
    }
    if (seenIds.has(id)) throw new BenchmarkValidationError(`Duplicate sample id "${id}"`);
    seenIds.add(id);

    const lon = entry.lon;
    const lat = entry.lat;
    if (typeof lon !== "number" || typeof lat !== "number") {
      throw new BenchmarkValidationError(`Sample "${id}" requires numeric lon and lat`);
    }

    const spatialGroup = entry.spatialGroup;
    if (typeof spatialGroup !== "string" || spatialGroup.trim() === "") {
      throw new BenchmarkValidationError(`Sample "${id}" requires spatialGroup`);
    }

    const label = entry[task.target.field];
    if (typeof label !== "number") {
      throw new BenchmarkValidationError(`Sample "${id}" requires numeric ${task.target.field}`);
    }
    if (task.target.unknownLabelPolicy === "reject" && !allowedClasses.has(label)) {
      throw new BenchmarkValidationError(`Sample "${id}" label ${label} is outside declared classes`);
    }

    const rawFeatures: Record<string, number> = {};
    for (const [key, value] of Object.entries(entry)) {
      if (key === "id" || key === "lon" || key === "lat" || key === "spatialGroup" || key === task.target.field) {
        continue;
      }
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new BenchmarkValidationError(`Sample "${id}" feature "${key}" must be a finite number`);
      }
      rawFeatures[key] = value;
    }

    parsed.push({
      id,
      lon,
      lat,
      spatialGroup,
      label,
      rawFeatures,
    });
  }

  if (parsed.length === 0) throw new BenchmarkValidationError("At least one sample is required");
  return parsed;
}

export function assertNoForbiddenFeatures(sample: ParsedSample, forbidden: readonly string[]): void {
  for (const field of forbidden) {
    if (field in sample.rawFeatures) {
      throw new BenchmarkValidationError(`Forbidden feature field "${field}" present on sample ${sample.id}`);
    }
  }
}
