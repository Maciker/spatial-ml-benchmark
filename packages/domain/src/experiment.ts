import type { Dataset } from "./dataset.js";
import { buildFeatureTable, scaleTrainingFold } from "./feature-table.js";
import { assignFolds } from "./folds.js";
import { fitForest, predictForest } from "./forest.js";
import { fitMajority, predictMajority } from "./majority.js";
import { summarizePredictions, type ClassificationSummary } from "./metrics.js";

export type BenchmarkOptions = {
  readonly seed: number;
  readonly foldCount: number;
  readonly bufferMeters: number;
  readonly extraFeatures?: readonly string[];
};

export type FoldScore = {
  readonly foldId: string;
  readonly summary: ClassificationSummary;
};

export type ModelReport = {
  readonly model: "majority" | "forest";
  readonly folds: readonly FoldScore[];
  readonly meanBalancedAccuracy: number;
};

export type SchemeReport = {
  readonly scheme: "random" | "spatial";
  readonly majority: ModelReport;
  readonly forest: ModelReport;
};

export type SamplePrediction = {
  readonly sampleId: string;
  readonly scheme: "random" | "spatial";
  readonly model: "majority" | "forest";
  readonly foldId: string;
  readonly truth: 0 | 1;
  readonly prediction: 0 | 1;
};

export type BenchmarkResult = {
  readonly principalScheme: "spatial";
  readonly limitations: string;
  readonly sourceHash: string;
  readonly schemes: {
    readonly random: SchemeReport;
    readonly spatial: SchemeReport;
  };
  readonly predictions: readonly SamplePrediction[];
};

export function hashDataset(dataset: Dataset): string {
  const text = JSON.stringify(dataset);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function meanAccuracy(folds: readonly FoldScore[]): number {
  return folds.reduce((total, fold) => total + fold.summary.balancedAccuracy, 0) / folds.length;
}

function evaluateScheme(
  dataset: Dataset,
  options: BenchmarkOptions,
  scheme: "random" | "spatial",
): { report: SchemeReport; predictions: SamplePrediction[] } {
  const table = buildFeatureTable(dataset, options.extraFeatures);
  const assignment = assignFolds(dataset, {
    scheme,
    foldCount: options.foldCount,
    seed: options.seed,
    bufferMeters: scheme === "spatial" ? options.bufferMeters : 0,
  });
  const majorityFolds: FoldScore[] = [];
  const forestFolds: FoldScore[] = [];
  const predictions: SamplePrediction[] = [];
  for (const fold of assignment.folds) {
    const scaled = scaleTrainingFold(table, fold.trainIds);
    const train = scaled.rows.filter((row) => fold.trainIds.includes(row.id));
    const test = scaled.rows.filter((row) => fold.testIds.includes(row.id));
    const majority = fitMajority(train.map((row) => row.label));
    const forest = fitForest(
      train.map((row) => row.values),
      train.map((row) => row.label),
      { seed: options.seed, treeCount: 9, maxDepth: 4 },
    );
    const majorityPred = predictMajority(majority, test.length);
    const forestPred = predictForest(forest, test.map((row) => row.values));
    const truth = test.map((row) => row.label);
    majorityFolds.push({ foldId: fold.foldId, summary: summarizePredictions(truth, majorityPred) });
    forestFolds.push({ foldId: fold.foldId, summary: summarizePredictions(truth, forestPred) });
    test.forEach((row, index) => {
      predictions.push({
        sampleId: row.id,
        scheme,
        model: "majority",
        foldId: fold.foldId,
        truth: row.label,
        prediction: majorityPred[index] ?? 0,
      });
      predictions.push({
        sampleId: row.id,
        scheme,
        model: "forest",
        foldId: fold.foldId,
        truth: row.label,
        prediction: forestPred[index] ?? 0,
      });
    });
  }
  return {
    report: {
      scheme,
      majority: { model: "majority", folds: majorityFolds, meanBalancedAccuracy: meanAccuracy(majorityFolds) },
      forest: { model: "forest", folds: forestFolds, meanBalancedAccuracy: meanAccuracy(forestFolds) },
    },
    predictions,
  };
}

export function runBenchmark(dataset: Dataset, options: BenchmarkOptions): BenchmarkResult {
  const random = evaluateScheme(dataset, options, "random");
  const spatial = evaluateScheme(dataset, options, "spatial");
  return {
    principalScheme: "spatial",
    limitations: "Do not invent statistical significance from this tiny fixture.",
    sourceHash: hashDataset(dataset),
    schemes: { random: random.report, spatial: spatial.report },
    predictions: [...random.predictions, ...spatial.predictions],
  };
}
