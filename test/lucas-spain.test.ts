import { describe, expect, it } from "vitest";
import { BenchmarkValidationError, mapLucasLandCover } from "../packages/domain/src/index.js";

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
    expect(() => mapLucasLandCover("")).toThrow(BenchmarkValidationError);
  });
});
