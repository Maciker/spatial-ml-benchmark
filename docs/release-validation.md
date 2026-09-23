# Release validation (MAC-17)

## Clean-checkout checklist

1. `pnpm install`
2. `pnpm quality:full` — typecheck, lint, unit tests, architecture, knip, duplication, ratchet.
3. `pnpm benchmark:run` — writes `.benchmark-runs/latest/manifest.json`.
4. `pnpm benchmark:replay` — confirms deterministic replay.
5. `pnpm test:e2e:install` (once per machine) then `pnpm test:e2e` — browser journey on the MapLibre explorer.

## CI coverage

GitHub Actions `quality.yml` runs the deterministic quality pipeline on Node 22/24. Benchmark replay is covered by unit tests (`test/benchmark-cli.test.ts`, `test/folds.test.ts`, `test/experiment.test.ts`).

## Licenses

| Asset | License |
| --- | --- |
| `fixtures/mvp-demo/` | CC0-1.0 (synthetic) |
| `ml-random-forest` | MIT |

## Known limitations

- Fixture size is intentionally microscopic; do not infer significance or production accuracy.
- Browser map uses public MapLibre demo tiles (network required for UI only).
