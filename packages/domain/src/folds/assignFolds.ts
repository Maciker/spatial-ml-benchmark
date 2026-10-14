import type { FoldAssignment, ParsedSample, RandomFoldStrategy, SplitScheme } from "../benchmark/contracts.js";
import { BenchmarkValidationError } from "../benchmark/errors.js";

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIds(ids: readonly string[], seed: number): string[] {
  const rng = mulberry32(seed);
  const copy = [...ids];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current === undefined || swap === undefined) continue;
    copy[index] = swap;
    copy[swapIndex] = current;
  }
  return copy;
}

/** Legacy layout kept bit-for-bit so manifests recorded without a strategy still replay. */
function shuffledTestFolds(ids: readonly string[], foldCount: number, seed: number): string[][] {
  const shuffled = shuffleIds(ids, seed);
  const foldSize = Math.floor(shuffled.length / foldCount);
  return Array.from({ length: foldCount }, (_, foldIndex) => {
    const start = foldIndex * foldSize;
    const end = foldIndex === foldCount - 1 ? shuffled.length : start + foldSize;
    return shuffled.slice(start, end);
  });
}

/** Shuffle each class, then deal samples round-robin so every fold's per-class count differs by at most one. */
function stratifiedTestFolds(samples: readonly ParsedSample[], foldCount: number, seed: number): string[][] {
  const labels = [...new Set(samples.map((sample) => sample.label))].sort((left, right) => left - right);
  const folds: string[][] = Array.from({ length: foldCount }, () => []);
  let dealt = 0;
  labels.forEach((label, labelIndex) => {
    const classIds = samples.filter((sample) => sample.label === label).map((sample) => sample.id);
    for (const id of shuffleIds(classIds, seed + labelIndex)) {
      folds[dealt % foldCount]?.push(id);
      dealt += 1;
    }
  });
  return folds;
}

function assignRandomFolds(
  samples: readonly ParsedSample[],
  foldCount: number,
  seed: number,
  strategy: RandomFoldStrategy,
): readonly FoldAssignment[] {
  assertFoldCount(foldCount);
  if (samples.length < foldCount) {
    throw new BenchmarkValidationError("Cannot create more folds than samples");
  }

  const sampleIds = samples.map((sample) => sample.id);
  // The shuffled strategy has always listed training ids in shuffled order; replay depends on it.
  const trainOrder = strategy === "shuffled" ? shuffleIds(sampleIds, seed) : sampleIds;
  const testFolds =
    strategy === "shuffled" ? shuffledTestFolds(sampleIds, foldCount, seed) : stratifiedTestFolds(samples, foldCount, seed);
  const groupById = new Map(samples.map((sample) => [sample.id, sample.spatialGroup]));

  return testFolds.map((testSampleIds, foldIndex) => {
    const testSet = new Set(testSampleIds);
    return {
      scheme: "random",
      foldIndex,
      seed,
      trainSampleIds: trainOrder.filter((id) => !testSet.has(id)),
      testSampleIds,
      spatialGroupsInTest: [...new Set(testSampleIds.map((id) => groupById.get(id)).filter(Boolean) as string[])],
    };
  });
}

function assertFoldCount(foldCount: number): void {
  if (!Number.isInteger(foldCount) || foldCount < 2) {
    throw new BenchmarkValidationError("foldCount must be an integer of at least 2");
  }
}

/** Contiguous chunks whose sizes differ by at most one; the first `length % chunkCount` chunks get the extra item. */
function balancedChunks<T>(items: readonly T[], chunkCount: number): T[][] {
  const baseSize = Math.floor(items.length / chunkCount);
  const largerChunks = items.length % chunkCount;
  const chunks: T[][] = [];
  let start = 0;
  for (let index = 0; index < chunkCount; index += 1) {
    const size = baseSize + (index < largerChunks ? 1 : 0);
    chunks.push(items.slice(start, start + size));
    start += size;
  }
  return chunks;
}

function assignSpatialFolds(samples: readonly ParsedSample[], foldCount: number, seed: number): readonly FoldAssignment[] {
  assertFoldCount(foldCount);
  const groups = [...new Set(samples.map((sample) => sample.spatialGroup))].sort();
  if (groups.length < foldCount) {
    throw new BenchmarkValidationError("Spatial fold count exceeds distinct spatial groups");
  }

  const groupChunks = balancedChunks(shuffleIds(groups, seed), foldCount);
  const assignments: FoldAssignment[] = [];

  for (let foldIndex = 0; foldIndex < foldCount; foldIndex += 1) {
    const testGroups = new Set(groupChunks[foldIndex]);
    const testSampleIds = samples.filter((sample) => testGroups.has(sample.spatialGroup)).map((sample) => sample.id);
    const trainSampleIds = samples.filter((sample) => !testGroups.has(sample.spatialGroup)).map((sample) => sample.id);
    if (testSampleIds.length === 0 || trainSampleIds.length === 0) {
      throw new BenchmarkValidationError(`Spatial fold ${foldIndex} produced empty train or test partition`);
    }
    assignments.push({
      scheme: "spatial",
      foldIndex,
      seed,
      trainSampleIds,
      testSampleIds,
      spatialGroupsInTest: [...testGroups],
    });
  }

  return assignments;
}

export function assignFolds(
  samples: readonly ParsedSample[],
  scheme: SplitScheme,
  foldCount: number,
  seed: number,
  randomStrategy: RandomFoldStrategy = "shuffled",
): readonly FoldAssignment[] {
  return scheme === "random"
    ? assignRandomFolds(samples, foldCount, seed, randomStrategy)
    : assignSpatialFolds(samples, foldCount, seed);
}
