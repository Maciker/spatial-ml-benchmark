export type MapPoint = {
  readonly id: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly foldId: string;
  readonly truth: 0 | 1;
  readonly prediction: 0 | 1;
  readonly isError: boolean;
};

export type ExperimentView = {
  readonly limitations: string;
  readonly caseStudy: string;
  readonly schemes: {
    readonly spatial: {
      readonly majority: { readonly meanBalancedAccuracy: number };
      readonly forest: { readonly meanBalancedAccuracy: number };
    };
    readonly random: {
      readonly forest: { readonly meanBalancedAccuracy: number };
    };
  };
  readonly points: readonly MapPoint[];
};

export function selectPoint(points: readonly MapPoint[], sampleId: string): MapPoint | undefined {
  return points.find((point) => point.id === sampleId);
}
