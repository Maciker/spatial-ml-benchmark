# Meadow / woodland benchmark case study

This demonstration uses 16 synthetic CC0 points. It is not a land-cover product.

Dataset: Synthetic meadow and woodland points authored for Spatial ML Benchmark. Not observed land cover.
License: CC0-1.0
CRS: EPSG:4326
Target: meadow (0) vs woodland (1)
Deployment assumption: Generalize to unsampled 1-degree cells in EPSG:4326. This is not a global land-cover product.

## Principal result (spatial folds)

Majority baseline balanced accuracy: 0.500
Seeded forest balanced accuracy: 0.500

## Comparison-only random folds

Seeded forest balanced accuracy: 0.896

## Limitations

Do not invent statistical significance from this tiny fixture.
Failure cases include minority points at group edges and any claim that these numbers transfer to real imagery.

## Reproduction

```
pnpm install --frozen-lockfile
pnpm demo
```
