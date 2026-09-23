import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runFixtureDemo } from "../apps/cli/src/run-demo.js";

describe("The fixture demonstration", () => {
  it("writes a replayable manifest and an English case study", () => {
    const directory = mkdtempSync(join(tmpdir(), "spatial-ml-demo-"));

    const output = runFixtureDemo(directory);

    expect(output).toContain("principal_scheme=spatial");
    expect(output).toContain("tiny fixture");
    const caseStudy = readFileSync(join(directory, "case-study.md"), "utf8");
    expect(caseStudy).toContain("Reproduction");
    expect(caseStudy).toContain("pnpm demo");
    const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8")) as { status: string };
    expect(manifest.status).toBe("complete");
  });
});
