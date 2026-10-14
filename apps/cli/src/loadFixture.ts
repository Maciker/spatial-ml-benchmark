import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSamples, parseTaskDefinition, type ParsedSample, type TaskDefinition } from "../../../packages/domain/src/index.js";

type LoadedFixture = {
  readonly directory: string;
  readonly task: TaskDefinition;
  readonly samples: readonly ParsedSample[];
  readonly fixtureSha256: string;
  readonly taskSha256: string;
};

function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function loadFixture(directory: string): Promise<LoadedFixture> {
  const taskPath = path.join(directory, "task.json");
  const samplesPath = path.join(directory, "samples.json");
  const [taskRaw, samplesRaw, samplesBytes] = await Promise.all([
    readFile(taskPath, "utf8").then((text) => JSON.parse(text) as unknown),
    readFile(samplesPath, "utf8").then((text) => JSON.parse(text) as unknown),
    readFile(samplesPath),
  ]);

  const task = parseTaskDefinition(taskRaw);
  const samples = parseSamples(samplesRaw, task);
  const fixtureSha256 = sha256Hex(samplesBytes);
  // Hash re-serialized JSON so whitespace and line endings do not change the task identity.
  const taskSha256 = sha256Hex(JSON.stringify(taskRaw));

  return { directory, task, samples, fixtureSha256, taskSha256 };
}
