import { readFileSync } from "node:fs";
import { parseDataset, type Dataset } from "../../../packages/domain/src/dataset.js";

export function loadDataset(path: string): Dataset {
  return parseDataset(JSON.parse(readFileSync(path, "utf8")));
}
