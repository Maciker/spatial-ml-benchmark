export type UnknownLabelPolicy = "reject" | "map_to_unknown";

export type TaskDefinition = {
  readonly taskId: string;
  readonly version: number;
  readonly crs: { readonly epsg: number; readonly name: string; readonly axisOrder: string };
  readonly sampleUnit: "point";
  readonly generalizationClaim: string;
  readonly featureTimestamp: string;
  readonly labelTimestamp: string;
  readonly leakageChannels: readonly string[];
  readonly target: {
    readonly field: string;
    readonly classes: readonly number[];
    readonly unknownLabelPolicy: UnknownLabelPolicy;
  };
  readonly forbiddenFeatureFields: readonly string[];
  readonly features: readonly FeatureSpec[];
  readonly source: {
    readonly name: string;
    readonly license: string;
    readonly reference: string;
  };
};

export type ParsedSample = {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
  readonly spatialGroup: string;
  readonly label: number;
  readonly rawFeatures: Readonly<Record<string, number>>;
};

export type FeatureSpec = {
  readonly name: string;
  readonly source: string;
  readonly units: string;
  readonly transformation: string;
  readonly missingValuePolicy: "reject";
};

export type FeatureRow = {
  readonly sampleId: string;
  readonly spatialGroup: string;
  readonly values: Readonly<Record<string, number>>;
};

export type SplitScheme = "random" | "spatial";

export type FoldAssignment = {
  readonly scheme: SplitScheme;
  readonly foldIndex: number;
  readonly seed: number;
  readonly trainSampleIds: readonly string[];
  readonly testSampleIds: readonly string[];
  readonly spatialGroupsInTest: readonly string[];
};

export type ModelKind = "majority" | "random_forest";

export type ExperimentConfig = {
  readonly taskId: string;
  readonly fixtureSha256: string;
  readonly seed: number;
  readonly foldCount: number;
  readonly schemes: readonly SplitScheme[];
  readonly models: readonly ModelKind[];
  readonly randomForest: {
    readonly library: string;
    readonly libraryVersion: string;
    readonly nEstimators: number;
  };
};

export type ConfusionCounts = {
  readonly matrix: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly supportByClass: Readonly<Record<string, number>>;
};

export type FoldMetrics = {
  readonly foldIndex: number;
  readonly scheme: SplitScheme;
  readonly model: ModelKind;
  readonly balancedAccuracy: number;
  readonly confusion: ConfusionCounts;
  readonly perClassRecall: Readonly<Record<string, number>>;
  readonly trainClassSupport: Readonly<Record<string, number>>;
  readonly testClassSupport: Readonly<Record<string, number>>;
  readonly warnings: readonly string[];
};

export type SamplePrediction = {
  readonly sampleId: string;
  readonly lon: number;
  readonly lat: number;
  readonly spatialGroup: string;
  readonly foldIndex: number;
  readonly scheme: SplitScheme;
  readonly model: ModelKind;
  readonly trueLabel: number;
  readonly predictedLabel: number;
};

export type ExperimentManifest = {
  readonly manifestVersion: 1;
  readonly createdAt: string;
  readonly incomplete: boolean;
  readonly config: ExperimentConfig;
  readonly task: TaskDefinition;
  readonly foldAssignments: readonly FoldAssignment[];
  readonly metrics: readonly FoldMetrics[];
  readonly predictions: readonly SamplePrediction[];
  readonly dependencyVersions: Readonly<Record<string, string>>;
};
