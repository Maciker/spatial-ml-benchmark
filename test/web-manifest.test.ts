import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("The web demo manifest", () => {
  it("matches sample IDs from the MVP fixture", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(process.cwd(), "apps/web/public/demo-manifest.json"), "utf8"),
    ) as { predictions: { sampleId: string }[] };
    const samples = JSON.parse(
      readFileSync(path.join(process.cwd(), "fixtures/mvp-demo/samples.json"), "utf8"),
    ) as { samples: { id: string }[] };

    const fixtureIds = new Set(samples.samples.map((sample) => sample.id));
    const predictionIds = new Set(manifest.predictions.map((row) => row.sampleId));

    predictionIds.forEach((id) => expect(fixtureIds.has(id)).toBe(true));
  });
});
