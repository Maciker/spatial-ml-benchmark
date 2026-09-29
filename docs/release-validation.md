# Release validation

## Clean-checkout checklist

1. `pnpm install --frozen-lockfile`
2. `pnpm quality:full` — typecheck, lint, unit tests, architecture, knip, duplication, ratchet.
3. LUCAS publish path:
   - `pnpm benchmark:publish:web-demo`, or
   - `pnpm build` then run/copy/replay as in `docs/development.md` / `docs/case-study.md`.
4. Confirm replay reports matched against `apps/web/public/demo-manifest.json`.
5. `pnpm test:e2e:install` (once per machine) then `pnpm test:e2e` — explorer journey including all-folds UI, point inspection, and offline/blocked-network map (no demotiles).

MVP contract path (optional regression):

- `pnpm benchmark:run` / `pnpm benchmark:replay` against `fixtures/mvp-demo`.

## CI coverage

GitHub Actions `quality.yml` runs the deterministic quality pipeline on Node 22/24. Benchmark replay is covered by unit tests (`test/benchmark-cli.test.ts`, `test/folds.test.ts`, `test/experiment.test.ts`). Web demo provenance is covered by `test/web-manifest.test.ts`. Explorer UX is covered by `test/e2e/explorer.e2e.test.ts`.

## Licenses

| Asset | License |
| --- | --- |
| `fixtures/mvp-demo/` | CC0-1.0 (synthetic) |
| `fixtures/lucas-spain-2022/` | Eurostat reuse with attribution; see `PROVENANCE.md` |
| `ml-random-forest` | MIT |

## Known limitations

- LUCAS demo is intentionally tiny (32 points, two regions, elevation only); do not infer national accuracy or production performance.
- Explorer map is a coordinate/group canvas with no remote basemap tiles, glyphs, or sprites.
- Root `pnpm typecheck` currently excludes `apps/web`; web regressions are covered by the web package build and Playwright e2e.
