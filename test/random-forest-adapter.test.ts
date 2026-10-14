import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mlRandomForestAdapter } from "../apps/cli/src/infrastructure/mlRandomForestAdapter.js";

describe("The ml-random-forest adapter", () => {
  it("records the installed library version in manifests", () => {
    const require = createRequire(path.join(process.cwd(), "apps/cli/package.json"));
    const packageDir = path.join("node_modules", "ml-random-forest");
    const entry = require.resolve("ml-random-forest");
    const packageRoot = entry.slice(0, entry.lastIndexOf(packageDir) + packageDir.length);
    const installed = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8")) as { version: string };

    expect(mlRandomForestAdapter.libraryVersion).toBe(installed.version);
  });
});
