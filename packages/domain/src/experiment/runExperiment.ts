import type {
  ExperimentConfig,
  ExperimentManifest,
  FoldAssignment,
  FoldMetrics,
  ModelKind,
  ParsedSample,
  SamplePrediction,
  SplitScheme,
  TaskDefinition,
} from "../benchmark/contracts.js";
import { buildFeatureTable, fitFoldNormalizer, rowsToMatrix } from "../features/featureTable.js";
import { assignFolds } from "../folds/assignFolds.js";
import { foldHasSpatialGroupLeakage } from "../folds/leakage.js";
import { buildConfusionCounts, classSupport, perClassRecall } from "../metrics/confusion.js";
import { scoreClassification } from "../metrics/scoreClassification.js";
import { createMajorityBaseline } from "../models/majorityBaseline.js";
import type { ClassifierModel, RandomForestAdapter } from "../models/modelPort.js";
import { BenchmarkValidationError } from "../benchmark/errors.js";

function createModel(kind: ModelKind, config: ExperimentConfig, rfAdapter: RandomForestAdapter | undefined): ClassifierModel {
  if (kind === "majority") return createMajorityBaseline();
  if (!rfAdapter) throw new BenchmarkValidationError("Random forest adapter is not configured");
  return rfAdapter.create({ seed: config.seed, nEstimators: config.randomForest.nEstimators });
}

function evaluateFold(
  samples: readonly ParsedSample[],
  task: TaskDefinition,
  config: ExperimentConfig,
  assignment: FoldAssignment,
  modelKind: ModelKind,
  rfAdapter: RandomForestAdapter | undefined,
): { metrics: FoldMetrics; predictions: SamplePrediction[] } {
  const { rows } = buildFeatureTable(samples, task);
  const featureNames = rows.length > 0 ? Object.keys(rows[0]?.values ?? {}) : [];
  const trainSet = new Set(assignment.trainSampleIds);
  const normalizer = fitFoldNormalizer(rows, trainSet, featureNames);

  const normalizedRows = rows.map((row) => ({
    ...row,
    values: normalizer.normalize(row.values),
  }));

  const trainMatrix = rowsToMatrix(normalizedRows, assignment.trainSampleIds, featureNames);
  const testMatrix = rowsToMatrix(normalizedRows, assignment.testSampleIds, featureNames);
  const labelById = new Map(samples.map((sample) => [sample.id, sample.label]));
  const trainLabels = assignment.trainSampleIds.map((id) => {
    const label = labelById.get(id);
    if (label === undefined) throw new BenchmarkValidationError(`Missing label for ${id}`);
    return label;
  });
  const testLabels = assignment.testSampleIds.map((id) => {
    const label = labelById.get(id);
    if (label === undefined) throw new BenchmarkValidationError(`Missing label for ${id}`);
    return label;
  });

  const model = createModel(modelKind, config, rfAdapter);
  model.fit(trainMatrix, trainLabels);
  const rawPredictions = model.predict(testMatrix);

  const warnings: string[] = [];
  if (assignment.scheme === "random" && foldHasSpatialGroupLeakage(samples, assignment)) {
    warnings.push("Random fold shares spatial groups between train and test partitions");
  }
  if (testLabels.length === 0) warnings.push("Empty evaluation fold");
  if (new Set(testLabels).size <= 1) warnings.push("Single-class evaluation fold");
  if (new Set(trainLabels).size <= 1) warnings.push("Single-class training fold");

  const unseen = rawPredictions.filter((prediction) => !task.target.classes.includes(prediction));
  if (unseen.length > 0) warnings.push("Model emitted labels outside declared classes");

  const predictions: SamplePrediction[] = assignment.testSampleIds.map((sampleId, index) => {
    const sample = samples.find((entry) => entry.id === sampleId);
    if (!sample) throw new BenchmarkValidationError(`Missing sample ${sampleId}`);
    return {
      sampleId,
      lon: sample.lon,
      lat: sample.lat,
      spatialGroup: sample.spatialGroup,
      foldIndex: assignment.foldIndex,
      scheme: assignment.scheme,
      model: modelKind,
      trueLabel: sample.label,
      predictedLabel: rawPredictions[index] ?? Number.NaN,
    };
  });

  const numericPredictions = rawPredictions.map((value) => (Number.isFinite(value) ? value : Number.NaN));
  const balanced = scoreClassification(testLabels, numericPredictions).balanced_accuracy;
  const confusion = buildConfusionCounts(testLabels, numericPredictions);

  return {
    metrics: {
      foldIndex: assignment.foldIndex,
      scheme: assignment.scheme,
      model: modelKind,
      balancedAccuracy: balanced,
      confusion,
      perClassRecall: perClassRecall(confusion),
      trainClassSupport: classSupport(trainLabels),
      testClassSupport: classSupport(testLabels),
      warnings,
    },
    predictions,
  };
}

export function runExperiment(input: {
  readonly task: TaskDefinition;
  readonly samples: readonly ParsedSample[];
  readonly config: ExperimentConfig;
  readonly dependencyVersions: Readonly<Record<string, string>>;
  readonly randomForestAdapter?: RandomForestAdapter;
  readonly createdAt?: string;
}): ExperimentManifest {
  const foldAssignments: FoldAssignment[] = [];
  const schemes: SplitScheme[] = [...input.config.schemes];
  schemes.forEach((scheme) => {
    foldAssignments.push(
      ...assignFolds(input.samples, scheme, input.config.foldCount, input.config.seed, input.config.randomFoldStrategy),
    );
  });

  const metrics: FoldMetrics[] = [];
  const predictions: SamplePrediction[] = [];

  foldAssignments.forEach((assignment) => {
    input.config.models.forEach((modelKind) => {
      const result = evaluateFold(
        input.samples,
        input.task,
        input.config,
        assignment,
        modelKind,
        input.randomForestAdapter,
      );
      metrics.push(result.metrics);
      predictions.push(...result.predictions);
    });
  });

  return {
    manifestVersion: 1,
    createdAt: input.createdAt ?? new Date().toISOString(),
    incomplete: false,
    config: input.config,
    task: input.task,
    foldAssignments,
    metrics,
    predictions,
    dependencyVersions: input.dependencyVersions,
  };
}
