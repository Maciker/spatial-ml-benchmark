# Spatial ML Benchmark

A reproducible benchmark for evaluating geospatial machine-learning models without misleading random train/test splits.

The project will classify a clearly defined target using open data, compare a simple baseline with a tree-based model, and report performance under spatially separated validation.

## First release

1. Choose a small, openly licensed labelled dataset and define one prediction task.
2. Build a documented feature table with spatial units and provenance.
3. Establish a transparent baseline.
4. Compare it with a Random Forest pipeline.
5. Evaluate both with random and spatially grouped cross-validation.
6. Publish metrics, error maps, and an explanation of where the model generalises poorly.

## Repository structure

- `config/` — reproducible experiment configuration.
- `src/` — data preparation, split logic, modelling, and evaluation.
- `notebooks/` — exploration; stable code moves to `src/`.
- `docs/` — project brief, evaluation protocol, and data policy.
- `data/` — instructions and tiny fixtures; full data stays out of Git.

## Scope guardrails

This benchmark measures a model on a stated dataset and protocol. It does not claim a general-purpose land-cover model, use a random split as its headline result, or introduce deep learning before the baseline is understood.

## Learning connection

This is the third portfolio project in the [Modern Geospatial Engineering roadmap](https://github.com/Maciker/modern-geospatial-engineering).
