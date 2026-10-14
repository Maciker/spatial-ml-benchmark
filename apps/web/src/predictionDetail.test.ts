import { describe, expect, it } from "vitest";
import { formatClassLabel, formatPredictedLabel } from "./predictionDetail";

describe("Prediction detail labels", () => {
  it("adds the declared class name to a label", () => {
    expect(formatClassLabel(1, { "0": "herbaceous cropland", "1": "woodland" })).toBe("1 (woodland)");
  });

  it("shows the bare value when no class name is declared", () => {
    expect(formatClassLabel(1, undefined)).toBe("1");
    expect(formatClassLabel(2, { "0": "a", "1": "b" })).toBe("2");
  });

  it("states non-finite predictions explicitly", () => {
    expect(formatPredictedLabel(Number.NaN, { "0": "a" })).toBe("undefined (non-finite prediction)");
    expect(formatPredictedLabel(null, undefined)).toBe("undefined (non-finite prediction)");
    expect(formatPredictedLabel(0, { "0": "a" })).toBe("0 (a)");
  });
});
