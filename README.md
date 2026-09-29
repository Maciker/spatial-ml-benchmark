# Spatial ML Benchmark

Compare a majority baseline and a JavaScript Random Forest under reproducible random and spatial evaluation.

## Current state

The TypeScript pipeline, CLI run/replay, LUCAS Spain 2022 extract, and offline MapLibre explorer are in place. The served demo is a seed-42 LUCAS run published to `apps/web/public/demo-manifest.json`. Synthetic MVP fixtures remain under `fixtures/mvp-demo` as contract tests.

All application, CLI and API code uses TypeScript on Node.js. QGIS desktop and PostGIS SQL remain GIS tools. There is no Python, FastAPI or PyQGIS runtime.

This LUCAS explorer is an exploratory 32-point / 2-region / elevation-only demo. It does **not** support national land-cover accuracy, statistical significance, or general transfer claims. See `fixtures/lucas-spain-2022/PROVENANCE.md`.

## Start

Use Node.js 22 or 24 and pnpm 10.17.1 (pinned in package.json).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
```

See [local development](docs/development.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

### Explorer demo

```sh
pnpm web:dev
```

Open http://localhost:5173. Regenerate and publish the committed LUCAS demo (replay must match predictions/metrics):

```sh
pnpm benchmark:publish:web-demo
```

### Four-minute jury script

1. Load the explorer (works offline; notice “Coordinate/group map (no basemap)”).
2. Switch **Spatial holdout** ↔ **Random** and **Majority** ↔ **Random forest**; read the all-folds metrics table (supports, held-out groups, warnings).
3. Use **Map fold** to change which fold’s points are drawn; confirm both fold rows stay visible.
4. Select a red (miss) and green (hit) sample from the evaluation list; read sample ID, spatial group, true/predicted labels, model, scheme, fold.
5. Mention CLI regenerate/replay: `pnpm benchmark:publish:web-demo` (or `benchmark:run:lucas` + copy + replay).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/c30e547b1306e10af31bbb8c6aa464832f5cf1b0). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full`, `pnpm prepr:gate` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

Hackathon demo epic [MAC-107](https://linear.app/maciker/issue/MAC-107/hackathon-explicar-validacion-espacial-y-errores-del-benchmark) wires the existing runner and map for jury rehearsal. Prior MVP (MAC-11) and LUCAS extract (MAC-49) are on `main`. Tickets specify dependencies, acceptance tests and relevant skills.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.
