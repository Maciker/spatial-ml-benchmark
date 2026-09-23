# Benchmark glossary

## Task (`mvp-land-cover-micro`)

| Term | Definition |
| --- | --- |
| Sample unit | A single point observation with stable `id`, coordinates, label and engineered features. |
| Target | Binary land-cover class stored in `label` (`0` = low relief, `1` = steeper / higher relief in the synthetic demo). |
| CRS | EPSG:4326 (WGS 84), longitude-latitude axis order. |
| Generalization claim | Models are evaluated on spatial groups that were not seen during training for the spatial split; random split shuffles IDs and can leak group structure. |
| Feature time | 2019-01-01 — synthetic elevation and slope attributes. |
| Label time | 2019-06-01 — class labels for the same growing season window. |

## Leakage channels tracked

1. **Future label in features** — columns such as `future_label` must never enter the feature matrix.
2. **Duplicate sample IDs** — rejected at parse time.
3. **Train statistics on full dataset** — normalization uses training-fold rows only.

## Fixture license

`fixtures/mvp-demo/` is synthetic data dedicated to this repository under **CC0-1.0** (see `fixtures/mvp-demo/LICENSE`). It is not a substitute for real-world accuracy claims.
