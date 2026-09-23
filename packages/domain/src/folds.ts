import type { Dataset, Sample } from "./dataset.js";
import { DomainError } from "./domain-error.js";

type SplitScheme = "random" | "spatial";

type Fold = {
  readonly foldId: string;
  readonly trainIds: readonly string[];
  readonly testIds: readonly string[];
};

type FoldAssignment = {
  readonly scheme: SplitScheme;
  readonly seed: number;
  readonly bufferMeters: number;
  readonly folds: readonly Fold[];
};

type FoldRequest = {
  readonly scheme: SplitScheme;
  readonly foldCount: number;
  readonly seed: number;
  readonly bufferMeters: number;
};

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function metersBetween(left: Sample, right: Sample): number {
  const toRadians = Math.PI / 180;
  const earth = 6_371_000;
  const latitudeDelta = (right.latitude - left.latitude) * toRadians;
  const longitudeDelta = (right.longitude - left.longitude) * toRadians;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(left.latitude * toRadians) * Math.cos(right.latitude * toRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(a)));
}

function assertBuffer(dataset: Dataset, fold: Fold, bufferMeters: number): void {
  if (bufferMeters <= 0) return;
  const byId = new Map(dataset.samples.map((sample) => [sample.id, sample]));
  for (const trainId of fold.trainIds) {
    const train = byId.get(trainId);
    if (!train) continue;
    for (const testId of fold.testIds) {
      const test = byId.get(testId);
      if (!test) continue;
      if (metersBetween(train, test) < bufferMeters) {
        throw DomainError.createValidation("Train and test geography violate the declared buffer");
      }
    }
  }
}

function assertUsableFold(dataset: Dataset, fold: Fold): void {
  if (fold.trainIds.length === 0 || fold.testIds.length === 0) {
    throw DomainError.createValidation("A fold must contain training and test samples");
  }
  const byId = new Map(dataset.samples.map((sample) => [sample.id, sample]));
  const trainLabels = new Set(fold.trainIds.map((id) => byId.get(id)?.label));
  if (trainLabels.size < 2) {
    throw DomainError.createValidation(`Fold ${fold.foldId} has a single training class`);
  }
}

function spatialFolds(dataset: Dataset, foldCount: number): Fold[] {
  const groups = [...new Set(dataset.samples.map((sample) => sample.spatialGroup))].sort();
  if (groups.length !== foldCount) {
    throw DomainError.createValidation("Spatial fold count must match the number of spatial groups");
  }
  return groups.map((heldOut) => {
    const trainIds = dataset.samples.filter((sample) => sample.spatialGroup !== heldOut).map((sample) => sample.id);
    const testIds = dataset.samples.filter((sample) => sample.spatialGroup === heldOut).map((sample) => sample.id);
    return { foldId: `spatial:${heldOut}`, trainIds, testIds };
  });
}

function randomFolds(dataset: Dataset, foldCount: number, seed: number): Fold[] {
  if (foldCount < 2) {
    throw DomainError.createValidation("Random fold count must be at least 2");
  }
  const rng = createRng(seed);
  const ids = dataset.samples.map((sample) => sample.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    const current = ids[index];
    const chosen = ids[swap];
    if (current === undefined || chosen === undefined) continue;
    ids[index] = chosen;
    ids[swap] = current;
  }
  const buckets: string[][] = Array.from({ length: foldCount }, () => []);
  ids.forEach((id, index) => {
    buckets[index % foldCount]?.push(id);
  });
  return buckets.map((testIds, index) => ({
    foldId: `random:${index}`,
    trainIds: ids.filter((id) => !testIds.includes(id)),
    testIds,
  }));
}

export function assignFolds(dataset: Dataset, request: FoldRequest): FoldAssignment {
  const folds = request.scheme === "spatial"
    ? spatialFolds(dataset, request.foldCount)
    : randomFolds(dataset, request.foldCount, request.seed);
  for (const fold of folds) {
    assertUsableFold(dataset, fold);
    assertBuffer(dataset, fold, request.bufferMeters);
  }
  return {
    scheme: request.scheme,
    seed: request.seed,
    bufferMeters: request.bufferMeters,
    folds,
  };
}
