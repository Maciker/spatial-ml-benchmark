# Spatial ML Benchmark

Compare a majority baseline and a JavaScript Random Forest under reproducible random and spatial evaluation.

## Current state

A 16-point CC0 meadow/woodland fixture now runs through feature provenance, spatial and random folds, a majority baseline, a seeded forest, a replayable manifest and a MapLibre error map. This is a bounded demonstration, not a land-cover product.

All application, CLI and API code uses TypeScript on Node.js. QGIS desktop and PostGIS SQL remain GIS tools. There is no Python, FastAPI or PyQGIS runtime.

## Start

Use Node.js 22 or 24 and pnpm 10.17.1 (pinned in package.json).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
```

See [local development](docs/development.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/97d01f03436cbbf35936c172008e74e55be56dd5). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

Follow [MVP tracker #7](https://github.com/Maciker/spatial-ml-benchmark/issues/7) / Linear [MAC-11](https://linear.app/maciker/issue/MAC-11). The TypeScript foundation (#8) is on `main`. No feature is complete merely because its ticket exists.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.
