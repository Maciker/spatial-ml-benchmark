# Architecture

## Current scaffold

The domain kernel (balanced accuracy, folds, feature table, experiment runner), CLI `benchmark run` / `benchmark replay`, LUCAS Spain 2022 fixture, and React + MapLibre explorer are delivered. The web app loads a committed CLI-generated manifest from `apps/web/public/demo-manifest.json` (LUCAS seed 42). Synthetic MVP under `fixtures/mvp-demo` remains the contract fixture.

## Dependency direction

`apps/` contains entry points and delivery adapters. `packages/domain/` contains pure computational behavior. Application use cases and ports grow with vertical slices; infrastructure adapters depend on those ports. Do not add speculative interfaces.

Domain code must not depend on application, infrastructure, HTTP, filesystem, databases or browser APIs. CLI, API and web reuse contracts/use cases instead of duplicating rules. TypeScript is the implementation language throughout; SQL and QGIS desktop assets are external tools, not alternate application runtimes.

## Boundaries in use

- Inputs are validated at adapters; preserve source metadata and stable IDs.
- Computation returns explicit results and limitations (undefined metrics stay non-finite; warnings are not hidden).
- Persistence/export adapters keep immutable provenance and distinguish incomplete runs.
- UI displays only recorded manifest fields; the MapLibre style is self-contained (background only, no remote glyphs/sprites/tiles).

## Workflow

The imported `.ai/` skills are canonical. Generated vendor projections must be regenerated with `pnpm ai:sync`; validate with `pnpm quality:stabilization`. Architecture, lint, test, duplication, dead-code and ratchet checks include apps/packages. Upstream workflow manuals remain under docs and may describe the original boilerplate; this page and project-spec.md define this product's architecture.
