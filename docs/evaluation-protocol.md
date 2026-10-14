# Evaluation protocol

1. Freeze the prediction task and prevent target leakage.
2. Create a majority-class or simple rules baseline.
3. Use the same feature preparation for every model.
4. Run ordinary stratified folds for comparison only.
5. Create spatial groups before splitting and report grouped-fold performance as the principal result.
6. Report balanced accuracy, class-wise error, confusion matrices, and spatial error patterns.
7. Separate exploratory tuning from final evaluation.

A model that performs well on random folds may still fail in unseen areas; the benchmark must make that visible.

## Implementation notes

- Random folds are stratified by label (`config.randomFoldStrategy: "stratified"`). Manifests without that field were recorded with the original unstratified shuffle and still replay with it.
- Spatial folds hold out whole groups; groups are spread so fold sizes differ by at most one group.
- `foldCount` must be an integer of at least 2. The CLI uses one spatial fold per group and the same count for random folds.
- Every fold records warnings for single-class training or evaluation partitions and for random folds that share spatial groups.
- Replay checks the samples hash (`fixtureSha256`) and the canonical task hash (`taskSha256`), then requires identical predictions and metrics. It warns when the Node.js major version differs from the recorded one.
- Results come from one seed. The explorer shows how much a single evaluation point can move balanced accuracy; smaller differences are not evidence.
- Samples must be EPSG:4326 longitude/latitude points within valid bounds; other CRS are rejected, not reprojected.
