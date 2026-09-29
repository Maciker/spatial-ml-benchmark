export type DemoManifest = {
  readonly task: {
    readonly taskId: string;
    readonly generalizationClaim: string;
    readonly source?: {
      readonly name: string;
      readonly license: string;
      readonly reference: string;
    };
  };
  readonly metrics: readonly {
    readonly scheme: string;
    readonly model: string;
    readonly foldIndex: number;
    readonly balancedAccuracy: number;
    readonly warnings: readonly string[];
    readonly testClassSupport?: Readonly<Record<string, number>>;
    readonly trainClassSupport?: Readonly<Record<string, number>>;
  }[];
  readonly predictions: readonly {
    readonly sampleId: string;
    readonly lon: number;
    readonly lat: number;
    readonly spatialGroup: string;
    readonly scheme: string;
    readonly model: string;
    readonly foldIndex: number;
    readonly trueLabel: number;
    readonly predictedLabel: number;
  }[];
  readonly foldAssignments?: readonly {
    readonly scheme: string;
    readonly foldIndex: number;
    readonly spatialGroupsInTest: readonly string[];
  }[];
};
