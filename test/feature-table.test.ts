import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDataset } from "../packages/domain/src/dataset.js";
import { buildFeatureTable, scaleTrainingFold } from "../packages/domain/src/feature-table.js";

const dataset = parseDataset(
  JSON.parse(readFileSync(resolve("data/meadow-woodland/samples.json"), "utf8")),
);

describe("The feature table", () => {
  it("records source, units and missing-value policy for each predictor", () => {
    const table = buildFeatureTable(dataset);

    expect(table.rows).toHaveLength(16);
    expect(table.rows[0]?.id).toBe("WN-01");
    expect(table.rows[0]?.spatialGroup).toBe("west-north");
    expect(table.features.map((feature) => feature.name)).toEqual(["ndvi", "elevationMeters", "moisture"]);
    expect(table.features[0]?.units).toBe("1");
    expect(table.features[0]?.missingValuePolicy).toBe("reject");
    expect(table.features[1]?.source).toContain("synthetic");
  });

  it("rejects a target column disguised as a feature", () => {
    expect(() => buildFeatureTable(dataset, ["ndvi", "label"])).toThrow(/Target/i);
  });

  it("scales using training-fold statistics only", () => {
    const table = buildFeatureTable(dataset);
    const trainIds = table.rows.filter((row) => row.spatialGroup === "west-north").map((row) => row.id);
    const scaled = scaleTrainingFold(table, trainIds);

    const trainNdvi = scaled.rows.filter((row) => trainIds.includes(row.id)).map((row) => row.values[0] ?? 0);
    const mean = trainNdvi.reduce((total, value) => total + value, 0) / trainNdvi.length;
    expect(Math.abs(mean)).toBeLessThan(1e-10);
    expect(scaled.rows[0]?.id).toBe(table.rows[0]?.id);
    expect(scaled.rows[0]?.spatialGroup).toBe(table.rows[0]?.spatialGroup);
  });
});
