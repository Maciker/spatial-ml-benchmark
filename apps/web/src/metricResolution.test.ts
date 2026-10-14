import { describe, expect, it } from "vitest";
import { balancedAccuracyStep, formatBalancedAccuracyStep } from "./metricResolution";

describe("Balanced accuracy resolution", () => {
  it("is one over classes times the smallest class support", () => {
    expect(balancedAccuracyStep({ "0": 8, "1": 8 })).toBeCloseTo(0.0625);
    expect(balancedAccuracyStep({ "0": 10, "1": 4 })).toBeCloseTo(0.125);
  });

  it("is undefined without test support", () => {
    expect(balancedAccuracyStep({})).toBeNaN();
    expect(balancedAccuracyStep(undefined)).toBeNaN();
  });

  it("formats the step for the metrics table", () => {
    expect(formatBalancedAccuracyStep({ "0": 8, "1": 8 })).toBe("±0.063");
    expect(formatBalancedAccuracyStep(undefined)).toBe("—");
  });
});
