import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BenchmarkValidationError, mapLucasLandCover, parseSamples, parseTaskDefinition } from "../packages/domain/src/index.js";

describe("The LUCAS land-cover mapper", () => {
  it("maps herbaceous cropland codes to class 0", () => {
    expect(mapLucasLandCover("B10")).toBe(0);
  });

  it("maps woodland codes including subclasses to class 1", () => {
    expect(mapLucasLandCover("C22")).toBe(1);
    expect(mapLucasLandCover("c31")).toBe(1);
  });

  it("rejects olive, vineyard, shrubland and unknown codes", () => {
    expect(() => mapLucasLandCover("B81")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("B71")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("D10")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("C00")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("C11")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("C24")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("C34")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("C10x")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("B100")).toThrow(BenchmarkValidationError);
    expect(() => mapLucasLandCover("")).toThrow(BenchmarkValidationError);
  });
});

const extractDir = path.join(process.cwd(), "fixtures/lucas-spain-2022");

type LucasRecord = {
  readonly id: string;
  readonly lon: number;
  readonly lat: number;
  readonly spatialGroup: string;
  readonly lucasCode: string;
  readonly elevation_m: number;
};

describe("The LUCAS Spain 2022 extract", () => {
  it("loads through the existing task and sample contract", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(extractDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(extractDir, "samples.json"), "utf8")) as unknown, task);

    expect(task.taskId).toBe("lucas-spain-2022-cropland-woodland");
    expect(task.crs.epsg).toBe(4326);
    expect(task.crs.axisOrder).toBe("longitude-latitude");
    expect(samples).toHaveLength(32);
    expect(samples.every((sample) => Object.keys(sample.rawFeatures).join(",") === "elevation_m")).toBe(true);
  });

  it("keeps the LUCAS code out of model features and aligned with the mapper", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(extractDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(extractDir, "samples.json"), "utf8")) as unknown, task);
    const records = (JSON.parse(readFileSync(path.join(extractDir, "records.json"), "utf8")) as { records: LucasRecord[] }).records;

    expect(records).toHaveLength(samples.length);
    for (const [index, record] of records.entries()) {
      const sample = samples[index];
      expect(sample?.id).toBe(record.id);
      expect(sample?.lon).toBe(record.lon);
      expect(sample?.lat).toBe(record.lat);
      expect(sample?.spatialGroup).toBe(record.spatialGroup);
      expect(sample?.label).toBe(mapLucasLandCover(record.lucasCode));
      expect(sample?.rawFeatures.elevation_m).toBe(record.elevation_m);
      expect(sample?.rawFeatures).not.toHaveProperty("lucasCode");
    }
  });

  it("places both classes in Galicia and in Andalusia", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(extractDir, "task.json"), "utf8")) as unknown);
    const samples = parseSamples(JSON.parse(readFileSync(path.join(extractDir, "samples.json"), "utf8")) as unknown, task);

    for (const group of ["es11-galicia", "es61-andalusia"]) {
      const labels = new Set(samples.filter((sample) => sample.spatialGroup === group).map((sample) => sample.label));
      expect(labels).toEqual(new Set([0, 1]));
    }
  });

  it("rejects a task that omits the CRS", () => {
    const task = JSON.parse(readFileSync(path.join(extractDir, "task.json"), "utf8")) as Record<string, unknown>;
    delete task.crs;

    expect(() => parseTaskDefinition(task)).toThrow(BenchmarkValidationError);
  });

  it("credits Eurostat and states that the extract was modified", () => {
    const provenance = readFileSync(path.join(extractDir, "PROVENANCE.md"), "utf8");

    expect(provenance).toContain("Eurostat");
    expect(provenance).toContain("modified extract");
    expect(provenance).toContain("not responsible");
  });

  it("rejects duplicate sample ids", () => {
    const task = parseTaskDefinition(JSON.parse(readFileSync(path.join(extractDir, "task.json"), "utf8")) as unknown);
    const payload = JSON.parse(readFileSync(path.join(extractDir, "samples.json"), "utf8")) as {
      samples: Array<Record<string, unknown>>;
    };
    const first = payload.samples[0];
    if (!first) throw new Error("extract is empty");

    expect(() => parseSamples({ samples: [first, { ...first }] }, task)).toThrow(BenchmarkValidationError);
  });
});
