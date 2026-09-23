import type { FoldAssignment, ParsedSample, SplitScheme } from "../benchmark/contracts.js";
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

function assertFoldLabels(
  samples: readonly ParsedSample[],
  trainIds: readonly string[],
  testIds: readonly string[],
): readonly string[] {
  const warnings: string[] = [];
  const labelById = new Map(samples.map((sample) => [sample.id, sample.label]));

  const trainLabels = trainIds.map((id) => labelById.get(id)).filter((value): value is number => value !== undefined);
  const testLabels = testIds.map((id) => labelById.get(id)).filter((value): value is number => value !== undefined);

  const unique = (values: readonly number[]) => new Set(values);
  if (unique(trainLabels).size === 0) warnings.push("Training fold has no labels");
  if (unique(testLabels).size === 0) warnings.push("Test fold has no labels");
  if (unique(trainLabels).size === 1) warnings.push("Training fold is single-class");
  if (unique(testLabels).size === 1) warnings.push("Test fold is single-class");

  return warnings;
}

function assignRandomFolds(
  samples: readonly ParsedSample[],
  foldCount: number,
  seed: number,
): readonly FoldAssignment[] {
  if (foldCount < 2) throw new BenchmarkValidationError("foldCount must be at least 2");
  if (samples.length < foldCount) {
    throw new BenchmarkValidationError("Cannot create more folds than samples");
  }

  const shuffled = shuffleIds(
    samples.map((sample) => sample.id),
    seed,
  );
  const foldSize = Math.floor(shuffled.length / foldCount);
  if (foldSize === 0) throw new BenchmarkValidationError("Each fold must contain at least one sample");

  const assignments: FoldAssignment[] = [];
  for (let foldIndex = 0; foldIndex < foldCount; foldIndex += 1) {
    const start = foldIndex * foldSize;
    const end = foldIndex === foldCount - 1 ? shuffled.length : start + foldSize;
    const testSampleIds = shuffled.slice(start, end);
    const testSet = new Set(testSampleIds);
    const trainSampleIds = shuffled.filter((id) => !testSet.has(id));
    assertFoldLabels(samples, trainSampleIds, testSampleIds);
    assignments.push({
      scheme: "random",
      foldIndex,
      seed,
      trainSampleIds,
      testSampleIds,
      spatialGroupsInTest: [...new Set(testSampleIds.map((id) => samples.find((s) => s.id === id)?.spatialGroup).filter(Boolean) as string[])],
    });
  }
  return assignments;
}

function assignSpatialFolds(samples: readonly ParsedSample[], foldCount: number, seed: number): readonly FoldAssignment[] {
  const groups = [...new Set(samples.map((sample) => sample.spatialGroup))].sort();
  if (groups.length < foldCount) {
    throw new BenchmarkValidationError("Spatial fold count exceeds distinct spatial groups");
  }

  const shuffledGroups = shuffleIds(groups, seed);
  const groupsPerFold = Math.ceil(shuffledGroups.length / foldCount);
  const assignments: FoldAssignment[] = [];

  for (let foldIndex = 0; foldIndex < foldCount; foldIndex += 1) {
    const testGroups = new Set(
      shuffledGroups.slice(foldIndex * groupsPerFold, foldIndex * groupsPerFold + groupsPerFold),
    );
    const testSampleIds = samples.filter((sample) => testGroups.has(sample.spatialGroup)).map((sample) => sample.id);
    const trainSampleIds = samples.filter((sample) => !testGroups.has(sample.spatialGroup)).map((sample) => sample.id);
    if (testSampleIds.length === 0 || trainSampleIds.length === 0) {
      throw new BenchmarkValidationError(`Spatial fold ${foldIndex} produced empty train or test partition`);
    }
    assertFoldLabels(samples, trainSampleIds, testSampleIds);
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
): readonly FoldAssignment[] {
  return scheme === "random"
    ? assignRandomFolds(samples, foldCount, seed)
    : assignSpatialFolds(samples, foldCount, seed);
}
