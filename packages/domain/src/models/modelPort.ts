import type { ModelKind } from "../benchmark/contracts.js";

export type ClassifierModel = {
  readonly kind: ModelKind;
  fit(features: readonly number[][], labels: readonly number[]): void;
  predict(features: readonly number[][]): readonly number[];
  serialize?(): unknown;
};

export type RandomForestAdapter = {
  readonly library: string;
  readonly libraryVersion: string;
  create(options: { readonly seed: number; readonly nEstimators: number }): ClassifierModel;
};
