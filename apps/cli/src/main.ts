import { renderKernelDemonstration } from "./demonstration.js";
import { runFixtureDemo } from "./run-demo.js";

process.stdout.write(`${renderKernelDemonstration([0, 0, 1, 1], [0, 0, 1, 0])}\n`);
process.stdout.write(`${runFixtureDemo()}\n`);
