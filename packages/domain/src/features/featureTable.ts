import type { FeatureRow, FeatureSpec, ParsedSample, TaskDefinition } from "../benchmark/contracts.js";
import { assertNoForbiddenFeatures } from "../benchmark/parseSamples.js";
import { BenchmarkValidationError } from "../benchmark/errors.js";

export function featureSpecsForTask(task: TaskDefinition): readonly FeatureSpec[] {
  return task.features;
}

export function buildFeatureTable(samples: readonly ParsedSample[], task: TaskDefinition): {
  readonly specs: readonly FeatureSpec[];
  readonly rows: readonly FeatureRow[];
} {
  const specs = featureSpecsForTask(task);
  const specNames = new Set(specs.map((spec) => spec.name));

  const rows: FeatureRow[] = [];
  for (const sample of samples) {
    assertNoForbiddenFeatures(sample, task.forbiddenFeatureFields);

    const values: Record<string, number> = {};
    for (const spec of specs) {
      const value = sample.rawFeatures[spec.name];
      if (value === undefined) {
        throw new BenchmarkValidationError(`Sample ${sample.id} is missing required feature ${spec.name}`);
      }
      values[spec.name] = value;
    }

    for (const key of Object.keys(sample.rawFeatures)) {
      if (!specNames.has(key)) {
        throw new BenchmarkValidationError(`Unexpected feature column "${key}" on sample ${sample.id}`);
      }
    }

    rows.push({ sampleId: sample.id, spatialGroup: sample.spatialGroup, values });
  }

  return { specs, rows };
}

type FoldNormalizer = {
  readonly featureNames: readonly string[];
  normalize(values: Readonly<Record<string, number>>): Readonly<Record<string, number>>;
};

export function fitFoldNormalizer(
  rows: readonly FeatureRow[],
  trainIds: ReadonlySet<string>,
  featureNames: readonly string[],
): FoldNormalizer {
  const stats: Record<string, { sum: number; count: number }> = {};
  featureNames.forEach((name) => {
    stats[name] = { sum: 0, count: 0 };
  });

  rows.forEach((row) => {
    if (!trainIds.has(row.sampleId)) return;
    featureNames.forEach((name) => {
      const value = row.values[name];
      if (value === undefined) return;
      const bucket = stats[name];
      if (!bucket) return;
      bucket.sum += value;
      bucket.count += 1;
    });
  });

  const means: Record<string, number> = {};
  featureNames.forEach((name) => {
    const bucket = stats[name];
    if (!bucket || bucket.count === 0) {
      throw new BenchmarkValidationError(`Cannot fit normalization for feature ${name}: empty training fold`);
    }
    means[name] = bucket.sum / bucket.count;
  });

  return {
    featureNames,
    normalize(values) {
      const normalized: Record<string, number> = {};
      featureNames.forEach((name) => {
        const value = values[name];
        const mean = means[name];
        if (value === undefined || mean === undefined) {
          throw new BenchmarkValidationError(`Missing feature ${name} during normalization`);
        }
        normalized[name] = value - mean;
      });
      return normalized;
    },
  };
}

export function rowsToMatrix(rows: readonly FeatureRow[], sampleIds: readonly string[], featureNames: readonly string[]): number[][] {
  const byId = new Map(rows.map((row) => [row.sampleId, row]));
  return sampleIds.map((id) => {
    const row = byId.get(id);
    if (!row) throw new BenchmarkValidationError(`Missing feature row for sample ${id}`);
    return featureNames.map((name) => {
      const value = row.values[name];
      if (value === undefined) throw new BenchmarkValidationError(`Missing ${name} for sample ${id}`);
      return value;
    });
  });
}
