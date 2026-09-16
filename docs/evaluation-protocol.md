# Evaluation protocol

1. Freeze the prediction task and prevent target leakage.
2. Create a majority-class or simple rules baseline.
3. Use the same feature preparation for every model.
4. Run ordinary stratified folds for comparison only.
5. Create spatial groups before splitting and report grouped-fold performance as the principal result.
6. Report balanced accuracy, class-wise error, confusion matrices, and spatial error patterns.
7. Separate exploratory tuning from final evaluation.

A model that performs well on random folds may still fail in unseen areas; the benchmark must make that visible.
