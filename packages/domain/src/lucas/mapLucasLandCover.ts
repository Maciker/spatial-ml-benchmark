import { BenchmarkValidationError } from "../benchmark/errors.js";

const CROPLAND = /^B[1-5]/;
const WOODLAND = /^C[123]/;

export function mapLucasLandCover(code: string): 0 | 1 {
  const normalized = code.trim().toUpperCase();
  if (CROPLAND.test(normalized)) return 0;
  if (WOODLAND.test(normalized)) return 1;
  throw new BenchmarkValidationError(`LUCAS code ${normalized} is outside cropland and woodland`);
}
