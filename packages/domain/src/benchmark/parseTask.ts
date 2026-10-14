import type { FeatureSpec, TaskDefinition, UnknownLabelPolicy } from "./contracts.js";
import { BenchmarkValidationError } from "./errors.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new BenchmarkValidationError(`Task field "${key}" must be a non-empty string`);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BenchmarkValidationError(`Task field "${key}" must be a finite number`);
  }
  return value;
}

function readStringArray(record: Record<string, unknown>, key: string): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new BenchmarkValidationError(`Task field "${key}" must be a string array`);
  }
  return value;
}

function readNumberArray(record: Record<string, unknown>, key: string): readonly number[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "number")) {
    throw new BenchmarkValidationError(`Task field "${key}" must be a number array`);
  }
  return value;
}

function readFeatures(value: unknown): readonly FeatureSpec[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BenchmarkValidationError("Task features must be a non-empty array");
  }

  const names = new Set<string>();
  return value.map((entry) => {
    if (!isRecord(entry)) throw new BenchmarkValidationError("Each feature spec must be an object");
    const name = readString(entry, "name");
    if (names.has(name)) throw new BenchmarkValidationError(`Duplicate feature name "${name}"`);
    names.add(name);
    if (entry.missingValuePolicy !== "reject") {
      throw new BenchmarkValidationError(`Feature "${name}" missingValuePolicy must be "reject"`);
    }
    return {
      name,
      source: readString(entry, "source"),
      units: readString(entry, "units"),
      transformation: readString(entry, "transformation"),
      missingValuePolicy: "reject",
    };
  });
}

function readUnknownLabelPolicy(value: unknown): UnknownLabelPolicy {
  if (value === "reject" || value === "map_to_unknown") return value;
  throw new BenchmarkValidationError('Task target.unknownLabelPolicy must be "reject" or "map_to_unknown"');
}

function readClassNames(value: unknown, classes: readonly number[]): Readonly<Record<string, string>> {
  if (!isRecord(value)) throw new BenchmarkValidationError("Task target.classNames must be an object");
  const expectedKeys = classes.map(String).sort();
  const actualKeys = Object.keys(value).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new BenchmarkValidationError(`Task target.classNames keys must be exactly ${expectedKeys.join(", ")}`);
  }
  const names: Record<string, string> = {};
  for (const key of expectedKeys) names[key] = readString(value, key);
  return names;
}

function readTarget(targetRaw: Record<string, unknown>): TaskDefinition["target"] {
  const classes = readNumberArray(targetRaw, "classes");
  return {
    field: readString(targetRaw, "field"),
    classes,
    unknownLabelPolicy: readUnknownLabelPolicy(targetRaw.unknownLabelPolicy),
    ...(targetRaw.classNames === undefined ? {} : { classNames: readClassNames(targetRaw.classNames, classes) }),
  };
}

/** Samples are lon/lat points; the explorer draws them as such, so other CRS are rejected rather than reprojected. */
function readCrs(crsRaw: Record<string, unknown>): TaskDefinition["crs"] {
  const crs = {
    epsg: readNumber(crsRaw, "epsg"),
    name: readString(crsRaw, "name"),
    axisOrder: readString(crsRaw, "axisOrder"),
  };
  if (crs.epsg !== 4326 || crs.axisOrder !== "longitude-latitude") {
    throw new BenchmarkValidationError('Only EPSG:4326 with axisOrder "longitude-latitude" is supported');
  }
  return crs;
}

export function parseTaskDefinition(raw: unknown): TaskDefinition {
  if (!isRecord(raw)) throw new BenchmarkValidationError("Task definition must be a JSON object");

  const crsRaw = raw.crs;
  if (!isRecord(crsRaw)) throw new BenchmarkValidationError("Task crs must be an object");

  const targetRaw = raw.target;
  if (!isRecord(targetRaw)) throw new BenchmarkValidationError("Task target must be an object");

  const sourceRaw = raw.source;
  if (!isRecord(sourceRaw)) throw new BenchmarkValidationError("Task source must be an object");

  if (readString(raw, "sampleUnit") !== "point") {
    throw new BenchmarkValidationError('Only sampleUnit "point" is supported in the MVP fixture');
  }

  return {
    taskId: readString(raw, "taskId"),
    version: readNumber(raw, "version"),
    crs: readCrs(crsRaw),
    sampleUnit: "point",
    generalizationClaim: readString(raw, "generalizationClaim"),
    featureTimestamp: readString(raw, "featureTimestamp"),
    labelTimestamp: readString(raw, "labelTimestamp"),
    leakageChannels: readStringArray(raw, "leakageChannels"),
    target: readTarget(targetRaw),
    forbiddenFeatureFields: readStringArray(raw, "forbiddenFeatureFields"),
    features: readFeatures(raw.features),
    source: {
      name: readString(sourceRaw, "name"),
      license: readString(sourceRaw, "license"),
      reference: readString(sourceRaw, "reference"),
    },
  };
}
