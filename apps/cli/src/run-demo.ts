import { mkdirSync, writeFileSync } from "node:fs";
import { renderCaseStudy } from "../../../packages/domain/src/case-study.js";
import { runBenchmark } from "../../../packages/domain/src/experiment.js";
import { buildMapPoints } from "../../../packages/domain/src/map-view.js";
import { replayManifest, writeManifest } from "../../../packages/domain/src/manifest.js";
import { loadDataset } from "./load-dataset.js";

const fixturePath = "data/meadow-woodland/samples.json";

export function runFixtureDemo(outputDirectory = "outputs"): string {
  const dataset = loadDataset(fixturePath);
  const result = runBenchmark(dataset, { seed: 21, foldCount: 4, bufferMeters: 10_000 });
  const manifest = writeManifest(dataset, result, { seed: 21, packageVersion: "0.1.0" });
  replayManifest(dataset, manifest);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(`${outputDirectory}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(`${outputDirectory}/case-study.md`, renderCaseStudy(dataset, result));
  writeFileSync(
    `${outputDirectory}/web-fixture.json`,
    `${JSON.stringify({
      limitations: result.limitations,
      schemes: result.schemes,
      points: buildMapPoints(dataset, result),
      caseStudy: renderCaseStudy(dataset, result),
    }, null, 2)}\n`,
  );
  return [
    `principal_scheme=${result.principalScheme}`,
    `spatial_majority=${result.schemes.spatial.majority.meanBalancedAccuracy.toFixed(3)}`,
    `spatial_forest=${result.schemes.spatial.forest.meanBalancedAccuracy.toFixed(3)}`,
    `random_forest=${result.schemes.random.forest.meanBalancedAccuracy.toFixed(3)}`,
    result.limitations,
  ].join("\n");
}
