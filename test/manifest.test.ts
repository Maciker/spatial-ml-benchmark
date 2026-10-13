import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BenchmarkReplayError, parseManifest } from "../packages/domain/src/index.js";

const referenceManifestPath = path.join(process.cwd(), "fixtures/mvp-demo/reference-manifest.json");

function referenceManifest(): Record<string, unknown> & { config: Record<string, unknown> } {
  return JSON.parse(readFileSync(referenceManifestPath, "utf8")) as Record<string, unknown> & {
    config: Record<string, unknown>;
  };
}

describe("Manifest parsing", () => {
  it("accepts the committed reference manifest", () => {
    expect(parseManifest(referenceManifest()).config.seed).toBe(42);
  });

  it.each([["metrics"], ["predictions"], ["foldAssignments"], ["dependencyVersions"], ["createdAt"]])(
    "rejects a manifest without %s",
    (field) => {
      const manifest = referenceManifest();
      delete manifest[field];

      expect(() => parseManifest(manifest)).toThrow(BenchmarkReplayError);
    },
  );

  it.each([
    ["seed", "42"],
    ["foldCount", 1.5],
    ["schemes", ["random", "kfold"]],
    ["models", ["majority", "svm"]],
    ["fixtureSha256", 7],
    ["randomForest", null],
  ])("rejects config.%s = %j", (field, value) => {
    const manifest = referenceManifest();
    manifest.config[field] = value;

    expect(() => parseManifest(manifest)).toThrow(BenchmarkReplayError);
  });
});
