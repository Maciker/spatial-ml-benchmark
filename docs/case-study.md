# Case study: LUCAS Spain 2022 exploratory demo

## Question

On a small Eurostat LUCAS extract (Galicia vs Andalusia), how do spatial holdout and random splits differ when comparing a majority baseline to a seeded JavaScript random forest — and where do individual points err?

## Data limitations

- Thirty-two theoretical survey points in two NUTS2 blocks (`es11-galicia`, `es61-andalusia`); see `fixtures/lucas-spain-2022/`.
- Only feature: `elevation_m` (LUCAS `POINT_ALTITUDE`). Binary label: herbaceous cropland vs woodland.
- Modified extract; not the full Eurostat Spain CSV. **No national land-cover accuracy, statistical significance, or general transfer claims.**
- Attribution and reuse terms: `fixtures/lucas-spain-2022/PROVENANCE.md` and `task.json` `source` fields (Eurostat / European Union).

Synthetic MVP (`fixtures/mvp-demo`) remains the contract fixture and is unchanged.

## What was measured

- Binary labels with balanced accuracy, per-class recall, confusion, train/test class support.
- Random splits intentionally allow spatial-group leakage; spatial splits hold out one entire block per fold (`foldCount === 2`).
- Models: majority baseline and `ml-random-forest@2.1.0` with fixed seed 42.
- Explorer shows **all folds** for the selected scheme/model (never a “best fold” summary). Map fold selector only changes drawn predictions.
- Point inspection shows sample ID, spatial group, true/predicted labels, model, scheme, fold from the manifest. Non-finite predictions are stated explicitly (never coerced to correct).
- Map uses a self-contained MapLibre background style (coordinate/group map, no basemap tiles).

## Reproduction

```bash
pnpm install
pnpm quality:fast
pnpm benchmark:publish:web-demo
pnpm web:dev
```

Or regenerate manually:

```bash
pnpm build
node dist/apps/cli/src/main.js benchmark run \
  --fixture fixtures/lucas-spain-2022 \
  --output .benchmark-runs/lucas-demo \
  --seed 42
cp .benchmark-runs/lucas-demo/manifest.json apps/web/public/demo-manifest.json
node dist/apps/cli/src/main.js benchmark replay \
  --fixture fixtures/lucas-spain-2022 \
  --manifest apps/web/public/demo-manifest.json
```

Open http://localhost:5173. Switch schemes/models, inspect both folds, select hit/miss points.

## Four-minute jury script

1. Load explorer offline → notice “Coordinate/group map (no basemap)” and Eurostat-facing attribution.
2. Switch scheme/model → read all-folds table (accuracy, supports, held-out groups, leakage warnings on random).
3. Change **Map fold** → map point set updates; metrics for both folds remain.
4. Select an error point → read labels, spatial group, fold from the detail panel.
5. Point to CLI publish/replay path above.

## Failure cases to expect

- Single-class evaluation folds yield undefined balanced accuracy (reported explicitly).
- Random splits surface leakage warnings when groups appear in both train and test partitions.
- Incomplete or warning-bearing folds stay visible; do not hide them for presentation.
