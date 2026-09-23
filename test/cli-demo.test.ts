import { describe, expect, it } from "vitest";
import { renderKernelDemonstration } from "../apps/cli/src/demonstration.js";

describe("The kernel demonstration", () => {
  it("reports the known balanced-accuracy result", () => {
    const truth = [0, 0, 1, 1];
    const predictions = [0, 0, 1, 0];

    const output = renderKernelDemonstration(truth, predictions);

    expect(output).toContain("0.75");
  });
});
