import { DomainError } from "./domain-error.js";

export type ClassificationSummary = {
  readonly balancedAccuracy: number;
  readonly recalls: { readonly 0: number; readonly 1: number };
  readonly support: { readonly 0: number; readonly 1: number };
  readonly confusion: {
    readonly trueMeadowPredictedMeadow: number;
    readonly trueMeadowPredictedWoodland: number;
    readonly trueWoodlandPredictedMeadow: number;
    readonly trueWoodlandPredictedWoodland: number;
  };
};

function recall(correct: number, total: number): number {
  if (total === 0) {
    throw DomainError.createValidation("A class present in neither truth nor evaluation cannot be scored");
  }
  return correct / total;
}

export function summarizePredictions(
  truth: readonly number[],
  predictions: readonly number[],
): ClassificationSummary {
  if (truth.length !== predictions.length) {
    throw DomainError.createValidation("Truth and predictions must have equal length");
  }
  if (truth.length === 0) {
    throw DomainError.createValidation("Evaluation fold must contain labelled samples");
  }
  let trueMeadowPredictedMeadow = 0;
  let trueMeadowPredictedWoodland = 0;
  let trueWoodlandPredictedMeadow = 0;
  let trueWoodlandPredictedWoodland = 0;
  let meadow = 0;
  let woodland = 0;
  truth.forEach((label, index) => {
    const predicted = predictions[index];
    if (label === 0) {
      meadow += 1;
      if (predicted === 0) trueMeadowPredictedMeadow += 1;
      else trueMeadowPredictedWoodland += 1;
    } else if (label === 1) {
      woodland += 1;
      if (predicted === 1) trueWoodlandPredictedWoodland += 1;
      else trueWoodlandPredictedMeadow += 1;
    } else {
      throw DomainError.createValidation("Unknown truth class");
    }
  });
  const meadowRecall = meadow === 0 ? 0 : recall(trueMeadowPredictedMeadow, meadow);
  const woodlandRecall = woodland === 0 ? 0 : recall(trueWoodlandPredictedWoodland, woodland);
  const present = (meadow > 0 ? 1 : 0) + (woodland > 0 ? 1 : 0);
  if (present === 0) {
    throw DomainError.createValidation("Evaluation fold must contain labelled samples");
  }
  return {
    balancedAccuracy: (meadowRecall + woodlandRecall) / present,
    recalls: { 0: meadowRecall, 1: woodlandRecall },
    support: { 0: meadow, 1: woodland },
    confusion: {
      trueMeadowPredictedMeadow,
      trueMeadowPredictedWoodland,
      trueWoodlandPredictedMeadow,
      trueWoodlandPredictedWoodland,
    },
  };
}

export function scoreClassification(
  truth: readonly number[],
  predictions: readonly number[],
): { balanced_accuracy: number } {
  return { balanced_accuracy: summarizePredictions(truth, predictions).balancedAccuracy };
}
