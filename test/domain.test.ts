import { describe, expect, it } from "vitest";
import { scoreClassification } from "../packages/domain/src/index.js";
describe("The classification score", () => {
  it("weights class recalls equally", () => {
    expect(scoreClassification([0, 0, 1, 1], [0, 0, 1, 0]).balanced_accuracy).toBe(0.75);
  });
});
