# Case study: MVP micro fixture

## Question

On a tiny synthetic point dataset, does a spatial holdout report a wider generalization gap than a random split when comparing a majority baseline to a seeded JavaScript random forest?

## Data limitations

- Twelve points in three spatial groups (`fixtures/mvp-demo/samples.json`, CC0-1.0).
- Features are synthetic elevation and slope values, not a real land-cover product.
- Metrics are for workflow demonstration only; they must not be quoted as model accuracy on real geography.

## What was measured

- Binary labels with balanced accuracy, per-class recall and confusion counts.
- Random splits intentionally allow spatial-group leakage; spatial splits hold out entire groups.
- Models: transparent majority baseline and `ml-random-forest@2.1.0` with fixed seed.

## Reproduction

```bash
pnpm install
pnpm quality:fast
pnpm benchmark:run
pnpm benchmark:replay
pnpm --filter @gis/spatial-ml-benchmark-web dev
```

Open the explorer at http://localhost:5173 and compare **Spatial holdout** vs **Random** warnings on fold 0.

## Failure cases to expect

- Single-class evaluation folds yield undefined balanced accuracy (reported explicitly).
- Random splits surface leakage warnings when groups appear in both train and test partitions.
