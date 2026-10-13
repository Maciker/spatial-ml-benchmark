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

  it.each([
    [{ epsg: 3857, name: "WGS 84 / Pseudo-Mercator", axisOrder: "easting-northing" }],
    [{ epsg: 4326, name: "WGS 84", axisOrder: "latitude-longitude" }],
  ])("rejects the unsupported CRS %j", (crs) => {
    const task = { ...readTaskJson(), crs };

    expect(() => parseTaskDefinition(task)).toThrow(BenchmarkValidationError);
  });

  it.each([
    [{ lon: 181, lat: 0 }],
    [{ lon: -180.5, lat: 0 }],
    [{ lon: 0, lat: 90.1 }],
    [{ lon: 0, lat: -91 }],
    [{ lon: Number.NaN, lat: 0 }],
  ])("rejects out-of-range coordinates %j", (coordinates) => {
    const task = parseTaskDefinition(readTaskJson());

    expect(() =>
      parseSamples({ samples: [{ id: "x", ...coordinates, spatialGroup: "g", label: 0, elevation_m: 1, slope_deg: 1 }] }, task),
    ).toThrow(BenchmarkValidationError);
  });

  it("reads optional class names for every declared class", () => {
    const raw = readTaskJson();
    const task = parseTaskDefinition({ ...raw, target: { ...raw.target, classNames: { "0": "open", "1": "forest" } } });

    expect(task.target.classNames).toEqual({ "0": "open", "1": "forest" });
  });

  it("rejects class names that do not match the declared classes", () => {
    const raw = readTaskJson();

    expect(() => parseTaskDefinition({ ...raw, target: { ...raw.target, classNames: { "0": "open", "7": "x" } } })).toThrow(
      BenchmarkValidationError,
    );
  });
});

function readTaskJson(): { target: Record<string, unknown> } & Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as {
    target: Record<string, unknown>;
  } & Record<string, unknown>;
}

describe("The MVP samples fixture", () => {
  it("loads twelve labelled points with spatial groups", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(fixtureDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(fixtureDir, "samples.json"), "utf8")) as unknown, task);

    expect(samples).toHaveLength(12);
    expect(new Set(samples.map((sample) => sample.spatialGroup)).size).toBe(3);
  });
});
