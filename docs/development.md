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

## Demo and benchmark

```sh
pnpm demo
pnpm benchmark:run
pnpm benchmark:replay
pnpm benchmark:run:lucas
pnpm benchmark:publish:web-demo
pnpm web:dev
```

- `pnpm demo` — tiny numerical-kernel demonstration.
- `pnpm benchmark:run` / `benchmark:replay` — synthetic MVP fixture contracts.
- `pnpm benchmark:run:lucas` — LUCAS Spain 2022 extract with seed 42 into `.benchmark-runs/lucas-demo`.
- `pnpm benchmark:publish:web-demo` — regenerate LUCAS, copy to `apps/web/public/demo-manifest.json`, replay against the published file. Prefer verifying replay equality of predictions/metrics over requiring identical JSON bytes (`createdAt` may change).
- `pnpm web:dev` — MapLibre explorer on the published demo (offline background style).

Browser e2e (Chromium once per machine):

```sh
pnpm test:e2e:install
pnpm test:e2e
```
