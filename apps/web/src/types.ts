export type DemoManifest = {
  readonly task: { readonly taskId: string; readonly generalizationClaim: string };
  readonly metrics: readonly {
    readonly scheme: string;
    readonly model: string;
    readonly foldIndex: number;
    readonly balancedAccuracy: number;
    readonly warnings: readonly string[];
  }[];
  readonly predictions: readonly {
    readonly sampleId: string;
    readonly lon: number;
    readonly lat: number;
    readonly spatialGroup: string;
    readonly scheme: string;
    readonly model: string;
    readonly trueLabel: number;
    readonly predictedLabel: number;
  }[];
};
