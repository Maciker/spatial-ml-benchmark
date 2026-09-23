# Domain glossary

| Term | Meaning |
| --- | --- |
| Sample | One labelled point with a stable identifier, coordinates, spatial group and features. |
| Spatial group | Declared geographic block used for grouped validation. Groups are assigned before splitting. |
| Target / label | Meadow (0) or woodland (1). Unknown labels are rejected. |
| Feature table | Numeric predictors with recorded source, units, transformation and missing-value policy. The target is never a feature. |
| Random fold | Seeded assignment of sample IDs to folds without using geography. Comparison only. |
| Spatial fold | Assignment that keeps an entire spatial group out of training. Principal evaluation. |
| Majority baseline | Predict the most common training label. Ties choose the lower class id. |
| Seeded forest | Deterministic TypeScript random-forest adapter trained on the same folds as the baseline. |
| Manifest | Immutable record of hashes, folds, seeds, predictions and metrics used for replay. |
| Leakage | Using the target, future information, shared groups across the split, or full-dataset scaling. |

Rejected synonyms: CRS guesswork, silent Python fallback, unpublished accuracy from this fixture as a product claim.
