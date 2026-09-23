import type { FoldAssignment, ParsedSample } from "../benchmark/contracts.js";

function spatialGroupsForSamples(samples: readonly ParsedSample[], sampleIds: readonly string[]): Set<string> {
  const ids = new Set(sampleIds);
  const groups = new Set<string>();
  samples.forEach((sample) => {
    if (ids.has(sample.id)) groups.add(sample.spatialGroup);
  });
  return groups;
}

export function sharedSpatialGroupsBetweenPartitions(
  samples: readonly ParsedSample[],
  trainSampleIds: readonly string[],
  testSampleIds: readonly string[],
): readonly string[] {
  const trainGroups = spatialGroupsForSamples(samples, trainSampleIds);
  const testGroups = spatialGroupsForSamples(samples, testSampleIds);
  return [...trainGroups].filter((group) => testGroups.has(group)).sort();
}

export function foldHasSpatialGroupLeakage(samples: readonly ParsedSample[], assignment: FoldAssignment): boolean {
  return sharedSpatialGroupsBetweenPartitions(samples, assignment.trainSampleIds, assignment.testSampleIds).length > 0;
}
