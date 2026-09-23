export { scoreClassification } from "./metrics/scoreClassification.js";
export type {
  ExperimentConfig,
  ExperimentManifest,
  FoldAssignment,
  FoldMetrics,
  ParsedSample,
  SamplePrediction,
  SplitScheme,
  TaskDefinition,
} from "./benchmark/contracts.js";
export { BenchmarkReplayError, BenchmarkValidationError } from "./benchmark/errors.js";
export { parseTaskDefinition } from "./benchmark/parseTask.js";
export { parseSamples } from "./benchmark/parseSamples.js";
export { buildFeatureTable, featureSpecsForTask, fitFoldNormalizer } from "./features/featureTable.js";
export { assignFolds } from "./folds/assignFolds.js";
export { foldHasSpatialGroupLeakage, sharedSpatialGroupsBetweenPartitions } from "./folds/leakage.js";
export { runExperiment } from "./experiment/runExperiment.js";
export { assertManifestMatchesFixture, parseManifest, serializeManifest } from "./experiment/manifest.js";
export type { ClassifierModel, RandomForestAdapter } from "./models/modelPort.js";
export { createMajorityBaseline } from "./models/majorityBaseline.js";
