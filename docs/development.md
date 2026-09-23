# Local development

Use Node.js 22 or 24, Corepack and pinned pnpm 10.17.1. From the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
pnpm quality:full
pnpm quality:stabilization
```

For environments with a different global pnpm, use `corepack pnpm` or enable Corepack shims first. Esbuild is the sole allowlisted dependency build script.

Run `pnpm demo` for the kernel check and the offline meadow/woodland experiment. It writes `outputs/manifest.json` and `outputs/case-study.md`. It does not download imagery or claim real-world accuracy.

`pnpm --filter @gis/spatial-ml-benchmark-web build` builds the MapLibre error map from the recorded fixture in `apps/web/public/experiment.json`.
