# Architecture

## Current scaffold
The TypeScript foundation now includes the meadow/woodland fixture, feature table, spatial and random folds, majority baseline, seeded forest adapter, experiment runner, replayable manifest, English case study and a MapLibre error map.

## Dependency direction
`apps/` contains entry points and delivery adapters. `packages/domain/` contains pure computational behavior. CLI and web reuse those contracts instead of duplicating rules. Domain code must not depend on application, infrastructure, HTTP, filesystem, databases or browser APIs. TypeScript is the implementation language throughout; SQL and QGIS desktop assets are external tools, not alternate application runtimes.

## Boundaries
- Inputs are validated at adapters; CRS is never inferred.
- Computation returns explicit results and limitations.
- Persistence/export adapters keep immutable provenance and distinguish incomplete runs.
- UI displays only recorded results from the committed experiment fixture.

## Workflow
The imported `.ai/` skills are canonical. Generated vendor projections must be regenerated with `pnpm ai:sync`; validate with `pnpm quality:stabilization`.
