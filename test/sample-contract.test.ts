import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDataset } from "../packages/domain/src/dataset.js";

const fixture = JSON.parse(
  readFileSync(resolve("data/meadow-woodland/samples.json"), "utf8"),
) as Record<string, unknown> & { samples: Array<Record<string, unknown> & { longitude: number; label: number }> };

describe("The labelled spatial fixture", () => {
  it("records the target, sample unit and deployment claim", () => {
    const dataset = parseDataset(fixture);

    expect(dataset.crs).toBe("EPSG:4326");
    expect(dataset.classes).toEqual({ 0: "meadow", 1: "woodland" });
    expect(dataset.unknownLabelPolicy).toBe("reject");
    expect(dataset.license).toBe("CC0-1.0");
    expect(dataset.samples).toHaveLength(16);
    expect(dataset.samples[0]?.id).toBe("WN-01");
    expect(dataset.leakageChannels.length).toBeGreaterThan(0);
    expect(dataset.deploymentAssumption).toContain("unsampled");
  });

  it("rejects an unknown class label", () => {
    const invalid = {
      ...fixture,
      samples: [{ ...fixture.samples[0], label: 9 }],
    };

    expect(() => parseDataset(invalid)).toThrow(/label|Duplicate|CRS|field/i);
  });

  it("rejects duplicate sample identifiers", () => {
    const first = fixture.samples[0];
    if (!first) throw new Error("fixture must include a sample");
    const invalid = {
      ...fixture,
      samples: [first, { ...first, longitude: first.longitude + 0.01 }],
    };

    expect(() => parseDataset(invalid)).toThrow(/label|Duplicate|CRS|field/i);
  });

  it("rejects a missing CRS instead of inferring one", () => {
    const withoutCrs: Record<string, unknown> = { ...fixture };
    delete withoutCrs.crs;

    expect(() => parseDataset(withoutCrs)).toThrow(/label|Duplicate|CRS|field/i);
  });
});
