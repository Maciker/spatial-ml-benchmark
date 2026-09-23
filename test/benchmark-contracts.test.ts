import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BenchmarkValidationError,
  parseSamples,
  parseTaskDefinition,
} from "../packages/domain/src/index.js";

const fixtureDir = path.join(process.cwd(), "fixtures/mvp-demo");

describe("The MVP task contract", () => {
  it("parses the committed fixture task definition", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);

    expect(task.taskId).toBe("mvp-land-cover-micro");
    expect(task.crs.epsg).toBe(4326);
    expect(task.target.classes).toEqual([0, 1]);
  });

  it("rejects unknown labels when policy is reject", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);

    expect(() =>
      parseSamples(
        {
          samples: [{ id: "x", lon: 0, lat: 0, spatialGroup: "g", label: 99, elevation_m: 1, slope_deg: 1 }],
        },
        task,
      ),
    ).toThrow(BenchmarkValidationError);
  });
});

describe("The MVP samples fixture", () => {
  it("loads twelve labelled points with spatial groups", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);

    expect(samples).toHaveLength(12);
    expect(new Set(samples.map((sample) => sample.spatialGroup)).size).toBe(3);
  });
});
