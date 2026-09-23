import type { TaskDefinition, UnknownLabelPolicy } from "./contracts.js";
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

function readUnknownLabelPolicy(value: unknown): UnknownLabelPolicy {
  if (value === "reject" || value === "map_to_unknown") return value;
  throw new BenchmarkValidationError('Task target.unknownLabelPolicy must be "reject" or "map_to_unknown"');
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
    crs: {
      epsg: readNumber(crsRaw, "epsg"),
      name: readString(crsRaw, "name"),
      axisOrder: readString(crsRaw, "axisOrder"),
    },
    sampleUnit: "point",
    generalizationClaim: readString(raw, "generalizationClaim"),
    featureTimestamp: readString(raw, "featureTimestamp"),
    labelTimestamp: readString(raw, "labelTimestamp"),
    leakageChannels: readStringArray(raw, "leakageChannels"),
    target: {
      field: readString(targetRaw, "field"),
      classes: readNumberArray(targetRaw, "classes"),
      unknownLabelPolicy: readUnknownLabelPolicy(targetRaw.unknownLabelPolicy),
    },
    forbiddenFeatureFields: readStringArray(raw, "forbiddenFeatureFields"),
    source: {
      name: readString(sourceRaw, "name"),
      license: readString(sourceRaw, "license"),
      reference: readString(sourceRaw, "reference"),
    },
  };
}
