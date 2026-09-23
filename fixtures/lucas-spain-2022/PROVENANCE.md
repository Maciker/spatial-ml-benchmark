# LUCAS 2022 Spain extract

Source: Eurostat, LUCAS 2022 Spain microdata, file `ES_LUCAS_2022.csv`.
Database page: https://ec.europa.eu/eurostat/web/lucas/database/2022
Land-cover classification: https://ec.europa.eu/eurostat/documents/205002/13686460/C3-LUCAS-2022.pdf
Copyright notice: https://ec.europa.eu/eurostat/about-us/policies/copyright

This directory is a modified extract. It is not the Eurostat file. The full Spain CSV is not stored in this repository.

© European Union. Source: Eurostat. Eurostat and the European Commission are not responsible for the results and conclusions drawn from this modified extract. Reuse of Eurostat data requires acknowledgement of the source.

## What was kept

- 32 theoretical survey points.
- `POINT_ID` as `id`.
- `POINT_LONG` as `lon` and `POINT_LAT` as `lat`, EPSG:4326, longitude then latitude. GPS, car, and soil coordinates were not copied.
- `POINT_ALTITUDE` as `elevation_m`, the only model feature.
- `SURVEY_LC1` as `lucasCode` in `records.json` only. The code is not a model feature.
- `SURVEY_DATE` rewritten from `M/D/YYYY` to ISO `YYYY-MM-DD` as `surveyDate`.
- Binary label: `0` herbaceous cropland, `1` woodland.

## What was dropped

Photos, soil measurements, GPS tracks, and every other LUCAS column. Olive (`B7x`), vineyard (`B8x`), shrubland, grassland, artificial land, water, wetlands, and points with missing coordinates were not selected.

## Selection

1. Keep `POINT_NUTS2` `ES11` (Galicia, group `es11-galicia`) and `ES61` (Andalusia, group `es61-andalusia`) after trimming whitespace.
2. Keep herbaceous cropland codes matching `B1`–`B5`, including subclasses, and woodland codes `C10`, `C20`, `C30`, including subclasses `C21`–`C23` and `C31`–`C33`.
3. Require finite latitude, longitude, and altitude.
4. Sort by `POINT_ID` numerically.
5. Take the first 8 cropland points and the first 8 woodland points in each region.

`samples.json` is the benchmark contract input. `records.json` is the sidecar that preserves the original LUCAS code. Labels in `samples.json` must match `mapLucasLandCover` applied to `records.json`.

`featureTimestamp` and `labelTimestamp` in `task.json` are the earliest and latest `surveyDate` values in this extract (`2022-05-02` through `2022-10-29`). Elevation is the published theoretical-point altitude, not a separate observation.

The two blocks are distant. The claim is spatial transfer between them, not national land-cover accuracy.
