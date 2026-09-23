import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDataset } from "../packages/domain/src/dataset.js";
import { runBenchmark } from "../packages/domain/src/experiment.js";
import { buildMapPoints, selectMapPoint } from "../packages/domain/src/map-view.js";

const dataset = parseDataset(
  JSON.parse(readFileSync(resolve("data/meadow-woodland/samples.json"), "utf8")),
);

describe("The spatial error map", () => {
  it("selects the same sample the report lists", () => {
    const result = runBenchmark(dataset, { seed: 21, foldCount: 4, bufferMeters: 10_000 });
    const points = buildMapPoints(dataset, result);
    const reportSample = result.predictions.find((item) => item.scheme === "spatial" && item.model === "forest");

    const selected = selectMapPoint(points, reportSample?.sampleId ?? "");

    expect(selected.id).toBe(reportSample?.sampleId);
    expect(selected.prediction).toBe(reportSample?.prediction);
    expect(selected.foldId).toBe(reportSample?.foldId);
  });
});
