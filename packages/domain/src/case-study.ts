import type { Dataset } from "./dataset.js";
import type { BenchmarkResult } from "./experiment.js";

export function renderCaseStudy(dataset: Dataset, result: BenchmarkResult): string {
  const spatialMajority = result.schemes.spatial.majority.meanBalancedAccuracy.toFixed(3);
  const spatialForest = result.schemes.spatial.forest.meanBalancedAccuracy.toFixed(3);
  const randomForest = result.schemes.random.forest.meanBalancedAccuracy.toFixed(3);
  return [
    "# Meadow / woodland benchmark case study",
    "",
    "This demonstration uses 16 synthetic CC0 points. It is not a land-cover product.",
    "",
    `Dataset: ${dataset.source}`,
    `License: ${dataset.license}`,
    `CRS: ${dataset.crs}`,
    `Target: ${dataset.classes[0]} (0) vs ${dataset.classes[1]} (1)`,
    `Deployment assumption: ${dataset.deploymentAssumption}`,
    "",
    "## Principal result (spatial folds)",
    "",
    `Majority baseline balanced accuracy: ${spatialMajority}`,
    `Seeded forest balanced accuracy: ${spatialForest}`,
    "",
    "## Comparison-only random folds",
    "",
    `Seeded forest balanced accuracy: ${randomForest}`,
    "",
    "## Limitations",
    "",
    result.limitations,
    "Failure cases include minority points at group edges and any claim that these numbers transfer to real imagery.",
    "",
    "## Reproduction",
    "",
    "```",
    "pnpm install --frozen-lockfile",
    "pnpm demo",
    "```",
    "",
  ].join("\n");
}
