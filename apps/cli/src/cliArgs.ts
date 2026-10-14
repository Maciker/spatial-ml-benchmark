export class CliUsageError extends Error {
  override readonly name = "CliUsageError";
}

type CliDefaults = {
  readonly fixtureDir: string;
  readonly outputDir: string;
  readonly manifestPath: string;
};

type CliCommand =
  | { readonly command: "demonstration" }
  | { readonly command: "run"; readonly fixtureDir: string; readonly outputDir: string; readonly seed?: number }
  | { readonly command: "replay"; readonly fixtureDir: string; readonly manifestPath: string };

const RUN_FLAGS = ["--fixture", "--output", "--seed"] as const;
const REPLAY_FLAGS = ["--fixture", "--manifest"] as const;

function readFlags(args: readonly string[], allowed: readonly string[]): Map<string, string> {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index] ?? "";
    if (!allowed.includes(flag)) {
      throw new CliUsageError(`Unsupported argument "${flag}". Allowed flags: ${allowed.join(", ")}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new CliUsageError(`Flag ${flag} requires a value`);
    }
    values.set(flag, value);
  }
  return values;
}

function parseSeed(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new CliUsageError(`--seed must be a non-negative integer, received "${raw}"`);
  const seed = Number(raw);
  if (!Number.isSafeInteger(seed)) throw new CliUsageError(`--seed is too large: "${raw}"`);
  return seed;
}

export function parseCliArgs(argv: readonly string[], defaults: CliDefaults): CliCommand {
  if (argv.length === 0) return { command: "demonstration" };

  const [command, subcommand, ...rest] = argv;
  if (command === "benchmark" && subcommand === "run") {
    const flags = readFlags(rest, RUN_FLAGS);
    const seed = flags.get("--seed");
    return {
      command: "run",
      fixtureDir: flags.get("--fixture") ?? defaults.fixtureDir,
      outputDir: flags.get("--output") ?? defaults.outputDir,
      ...(seed === undefined ? {} : { seed: parseSeed(seed) }),
    };
  }

  if (command === "benchmark" && subcommand === "replay") {
    const flags = readFlags(rest, REPLAY_FLAGS);
    return {
      command: "replay",
      fixtureDir: flags.get("--fixture") ?? defaults.fixtureDir,
      manifestPath: flags.get("--manifest") ?? defaults.manifestPath,
    };
  }

  throw new CliUsageError(
    "Usage: benchmark run [--fixture DIR] [--output DIR] [--seed N] | benchmark replay [--fixture DIR] [--manifest FILE]",
  );
}
