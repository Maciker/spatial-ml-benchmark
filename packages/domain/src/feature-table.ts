import type { Dataset } from "./dataset.js";
import { DomainError } from "./domain-error.js";

type FeatureDefinition = {
  readonly name: string;
  readonly source: string;
  readonly units: string;
  readonly transformation: string;
  readonly missingValuePolicy: "reject";
};

type FeatureRow = {
  readonly id: string;
  readonly spatialGroup: string;
  readonly values: readonly number[];
  readonly label: 0 | 1;
};

type FeatureTable = {
  readonly features: readonly FeatureDefinition[];
  readonly rows: readonly FeatureRow[];
};

const defaultNames = ["ndvi", "elevationMeters", "moisture"] as const;

const definitions: Record<(typeof defaultNames)[number], FeatureDefinition> = {
  ndvi: {
    name: "ndvi",
    source: "synthetic July 2020 spectral index authored with the fixture",
    units: "1",
    transformation: "none",
    missingValuePolicy: "reject",
  },
  elevationMeters: {
    name: "elevationMeters",
    source: "synthetic elevation authored with the fixture",
    units: "m",
    transformation: "none",
    missingValuePolicy: "reject",
  },
  moisture: {
    name: "moisture",
    source: "synthetic surface moisture authored with the fixture",
    units: "1",
    transformation: "none",
    missingValuePolicy: "reject",
  },
};

function readFeature(sample: Dataset["samples"][number], name: string): number {
  if (name === "ndvi") return sample.ndvi;
  if (name === "elevationMeters") return sample.elevationMeters;
  if (name === "moisture") return sample.moisture;
  throw DomainError.createValidation(`Unsupported feature ${name}`);
}

export function buildFeatureTable(
  dataset: Dataset,
  featureNames: readonly string[] = defaultNames,
): FeatureTable {
  if (dataset.featureTimestamp > dataset.labelTimestamp) {
    throw DomainError.createValidation("Features must not use information after the label date");
  }
  const unique = new Set<string>();
  for (const name of featureNames) {
    if (name === "label" || name === "target") {
      throw DomainError.createValidation("Target columns cannot be used as features");
    }
    if (unique.has(name)) {
      throw DomainError.createValidation(`Duplicate feature ${name}`);
    }
    unique.add(name);
    if (!(name in definitions)) {
      throw DomainError.createValidation(`Unsupported feature ${name}`);
    }
  }
  return {
    features: featureNames.map((name) => definitions[name as (typeof defaultNames)[number]]),
    rows: dataset.samples.map((sample) => ({
      id: sample.id,
      spatialGroup: sample.spatialGroup,
      values: featureNames.map((name) => readFeature(sample, name)),
      label: sample.label,
    })),
  };
}

export function scaleTrainingFold(table: FeatureTable, trainIds: readonly string[]): FeatureTable {
  const train = table.rows.filter((row) => trainIds.includes(row.id));
  if (train.length === 0) {
    throw DomainError.createValidation("Training fold has no samples for scaling");
  }
  const means = table.features.map((_, index) => {
    const sum = train.reduce((total, row) => total + (row.values[index] ?? 0), 0);
    return sum / train.length;
  });
  const deviations = table.features.map((_, index) => {
    const variance = train.reduce((total, row) => {
      const delta = (row.values[index] ?? 0) - (means[index] ?? 0);
      return total + delta * delta;
    }, 0) / train.length;
    return Math.sqrt(variance);
  });
  return {
    features: table.features.map((feature) => ({
      ...feature,
      transformation: "z-score using training-fold mean and standard deviation",
    })),
    rows: table.rows.map((row) => ({
      ...row,
      values: row.values.map((value, index) => {
        const spread = deviations[index] ?? 0;
        const center = means[index] ?? 0;
        return spread === 0 ? 0 : (value - center) / spread;
      }),
    })),
  };
}
