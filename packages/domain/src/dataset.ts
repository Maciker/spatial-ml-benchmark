import { DomainError } from "./domain-error.js";

export type Sample = {
  readonly id: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly spatialGroup: string;
  readonly ndvi: number;
  readonly elevationMeters: number;
  readonly moisture: number;
  readonly label: 0 | 1;
};

export type Dataset = {
  readonly crs: "EPSG:4326";
  readonly license: string;
  readonly source: string;
  readonly featureTimestamp: string;
  readonly labelTimestamp: string;
  readonly deploymentAssumption: string;
  readonly unknownLabelPolicy: "reject";
  readonly classes: { readonly 0: "meadow"; readonly 1: "woodland" };
  readonly leakageChannels: readonly string[];
  readonly samples: readonly Sample[];
};

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw DomainError.createValidation(`Dataset field ${key} must be a non-empty string`);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw DomainError.createValidation(`Field ${key} must be a finite number`);
  }
  return value;
}

function parseSample(value: unknown, index: number): Sample {
  if (value === null || typeof value !== "object") {
    throw DomainError.createValidation(`Sample ${index} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const label = record.label;
  if (label !== 0 && label !== 1) {
    throw DomainError.createValidation(`Sample ${index} has an unknown class label`);
  }
  return {
    id: readText(record, "id"),
    longitude: readNumber(record, "longitude"),
    latitude: readNumber(record, "latitude"),
    spatialGroup: readText(record, "spatialGroup"),
    ndvi: readNumber(record, "ndvi"),
    elevationMeters: readNumber(record, "elevationMeters"),
    moisture: readNumber(record, "moisture"),
    label,
  };
}

export function parseDataset(value: unknown): Dataset {
  if (value === null || typeof value !== "object") {
    throw DomainError.createValidation("Dataset must be an object");
  }
  const record = value as Record<string, unknown>;
  const crs = readText(record, "crs");
  if (crs !== "EPSG:4326") {
    throw DomainError.createValidation("Unsupported CRS; only EPSG:4326 is accepted");
  }
  if (record.unknownLabelPolicy !== "reject") {
    throw DomainError.createValidation("Unknown-label policy must be reject");
  }
  const classes = record.classes;
  if (
    classes === null ||
    typeof classes !== "object" ||
    (classes as Record<string, unknown>)["0"] !== "meadow" ||
    (classes as Record<string, unknown>)["1"] !== "woodland"
  ) {
    throw DomainError.createValidation("Classes must map 0 to meadow and 1 to woodland");
  }
  if (!Array.isArray(record.samples) || record.samples.length === 0) {
    throw DomainError.createValidation("Dataset must contain samples");
  }
  if (!Array.isArray(record.leakageChannels) || record.leakageChannels.some((item) => typeof item !== "string")) {
    throw DomainError.createValidation("Leakage channels must be recorded as strings");
  }
  const samples = record.samples.map(parseSample);
  const identifiers = new Set<string>();
  for (const sample of samples) {
    if (identifiers.has(sample.id)) {
      throw DomainError.createValidation(`Duplicate sample identifier ${sample.id}`);
    }
    identifiers.add(sample.id);
  }
  return {
    crs,
    license: readText(record, "license"),
    source: readText(record, "source"),
    featureTimestamp: readText(record, "featureTimestamp"),
    labelTimestamp: readText(record, "labelTimestamp"),
    deploymentAssumption: readText(record, "deploymentAssumption"),
    unknownLabelPolicy: "reject",
    classes: { 0: "meadow", 1: "woodland" },
    leakageChannels: record.leakageChannels as readonly string[],
    samples,
  };
}
