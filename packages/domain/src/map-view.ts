import type { Dataset } from "./dataset.js";
import { DomainError } from "./domain-error.js";
import type { BenchmarkResult } from "./experiment.js";

type MapPoint = {
  readonly id: string;
  readonly longitude: number;
  readonly latitude: number;
  readonly foldId: string;
  readonly truth: 0 | 1;
  readonly prediction: 0 | 1;
  readonly isError: boolean;
};

export function buildMapPoints(dataset: Dataset, result: BenchmarkResult): readonly MapPoint[] {
  return dataset.samples.map((sample) => {
    const prediction = result.predictions.find(
      (item) => item.sampleId === sample.id && item.scheme === "spatial" && item.model === "forest",
    );
    const value = prediction?.prediction ?? sample.label;
    return {
      id: sample.id,
      longitude: sample.longitude,
      latitude: sample.latitude,
      foldId: prediction?.foldId ?? "unknown",
      truth: sample.label,
      prediction: value,
      isError: value !== sample.label,
    };
  });
}

export function selectMapPoint(points: readonly MapPoint[], sampleId: string): MapPoint {
  const point = points.find((item) => item.id === sampleId);
  if (!point) {
    throw DomainError.createNotFound(`Unknown sample ${sampleId}`);
  }
  return point;
}
