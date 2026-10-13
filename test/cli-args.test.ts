import { describe, expect, it } from "vitest";
import { CliUsageError, parseCliArgs } from "../apps/cli/src/cliArgs.js";

const defaults = {
  fixtureDir: "/repo/fixtures/mvp-demo",
  outputDir: "/repo/.benchmark-runs/latest",
  manifestPath: "/repo/.benchmark-runs/latest/manifest.json",
};

describe("CLI argument parsing", () => {
  it("reads run flags and an integer seed", () => {
    const parsed = parseCliArgs(["benchmark", "run", "--fixture", "f", "--output", "o", "--seed", "7"], defaults);

    expect(parsed).toEqual({ command: "run", fixtureDir: "f", outputDir: "o", seed: 7 });
  });

  it("falls back to defaults when run flags are absent", () => {
    expect(parseCliArgs(["benchmark", "run"], defaults)).toEqual({
      command: "run",
      fixtureDir: defaults.fixtureDir,
      outputDir: defaults.outputDir,
    });
  });

  it("reads replay flags", () => {
    expect(parseCliArgs(["benchmark", "replay", "--fixture", "f", "--manifest", "m.json"], defaults)).toEqual({
      command: "replay",
      fixtureDir: "f",
      manifestPath: "m.json",
    });
  });

  it("runs the kernel demonstration without arguments", () => {
    expect(parseCliArgs([], defaults)).toEqual({ command: "demonstration" });
  });

  it.each([["abc"], ["1.5"], ["-1"], [""]])("rejects the seed %j", (seed) => {
    expect(() => parseCliArgs(["benchmark", "run", "--seed", seed], defaults)).toThrow(CliUsageError);
  });

  it.each([
    [["benchmark", "run", "--seed"]],
    [["benchmark", "run", "--fixture"]],
    [["benchmark", "run", "--output", "--seed", "1"]],
    [["benchmark", "replay", "--manifest"]],
  ])("rejects a flag without a value in %j", (argv) => {
    expect(() => parseCliArgs(argv, defaults)).toThrow(CliUsageError);
  });

  it.each([
    [["benchmark", "run", "--sed", "1"]],
    [["benchmark", "replay", "--seed", "1"]],
    [["benchmark", "explode"]],
    [["unknown"]],
  ])("rejects the unsupported arguments %j", (argv) => {
    expect(() => parseCliArgs(argv, defaults)).toThrow(CliUsageError);
  });
});
