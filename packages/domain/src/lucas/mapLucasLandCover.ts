import { BenchmarkValidationError } from "../benchmark/errors.js";

const CROPLAND = /^B[1-5]\d$/;
const WOODLAND = /^(?:C10|C2[0-3]|C3[0-3])$/;

export function mapLucasLandCover(code: string): 0 | 1 {
  const normalized = code.trim().toUpperCase();
  if (CROPLAND.test(normalized)) return 0;
  if (WOODLAND.test(normalized)) return 1;
  throw new BenchmarkValidationError(`LUCAS code ${normalized} is outside cropland and woodland`);
}
