import type { Dataset } from "./dataset.js";
import { DomainError } from "./domain-error.js";
import { hashDataset, runBenchmark, type BenchmarkResult, type SamplePrediction } from "./experiment.js";

type ExperimentManifest = {
  readonly status: "complete";
  readonly packageVersion: string;
  readonly seed: number;
  readonly sourceHash: string;
  readonly principalScheme: "spatial";
  readonly limitations: string;
  readonly schemes: BenchmarkResult["schemes"];
  readonly predictions: readonly SamplePrediction[];
};

export function writeManifest(
  dataset: Dataset,
  result: BenchmarkResult,
  meta: { readonly seed: number; readonly packageVersion: string },
): ExperimentManifest {
  return {
    status: "complete",
    packageVersion: meta.packageVersion,
    seed: meta.seed,
    sourceHash: hashDataset(dataset),
    principalScheme: result.principalScheme,
    limitations: result.limitations,
    schemes: result.schemes,
    predictions: result.predictions,
  };
}

export function replayManifest(dataset: Dataset, manifest: ExperimentManifest): ExperimentManifest {
  if (hashDataset(dataset) !== manifest.sourceHash) {
    throw DomainError.createValidation("Manifest source hash does not match the dataset");
  }
  const replayed = runBenchmark(dataset, { seed: manifest.seed, foldCount: 4, bufferMeters: 10_000 });
  if (JSON.stringify(replayed.predictions) !== JSON.stringify(manifest.predictions)) {
    throw DomainError.createValidation("Replay predictions do not match the manifest");
  }
  return writeManifest(dataset, replayed, { seed: manifest.seed, packageVersion: manifest.packageVersion });
}
