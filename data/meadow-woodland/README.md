# Meadow / woodland fixture

Tiny offline classification fixture for the Spatial ML Benchmark.

| Field | Value |
| --- | --- |
| Task | Binary land-cover class: meadow (0) vs woodland (1) |
| Sample unit | Point observation with a stable sample ID |
| CRS | EPSG:4326 (degrees). No other CRS is inferred. |
| License | CC0-1.0 |
| Source | Synthetic points authored for this repository; not observed land cover |
| Feature date | 2020-07-01 |
| Label date | 2020-07-01 |
| Unknown labels | Rejected |
| Deployment claim | Generalize to unsampled 1-degree cells in the same CRS. Not a global product. |

Leakage channels: spatial autocorrelation inside each 1-degree cell; shared acquisition date for features and labels.

Do not treat fixture accuracy as a real-world land-cover claim.
