# Spatial ML Benchmark: bounded MVP

## Outcome
Compare a majority baseline and a seeded TypeScript Random Forest under reproducible random and spatial evaluation.

## Foundation delivered
The balanced-accuracy kernel, licensed meadow/woodland fixture, feature table, folds, models, experiment runner, replayable manifest, case study and error map are implemented. Real imagery, hosted services and statistical claims from this 16-point fixture are out of scope.

## Constraints
- TypeScript application code, Node 22/24, pnpm workspaces.
- Deterministic spatial/numerical results; never use an LLM as a geometry or accuracy oracle.
- Preserve CRS, units, NoData, source hashes, identifiers and licenses.
- Reject unsupported operations explicitly; never infer an authoritative CRS or silently repair inputs.
- Local demo first, bounded inputs and resources; no hosted service, billing or automatic publishing.

## Acceptance source
Linear project Spatial ML Benchmark (parent [MAC-11](https://linear.app/maciker/issue/MAC-11)) and [tracker #7](https://github.com/Maciker/spatial-ml-benchmark/issues/7).

## Workflow references
Use domain-modeling for contracts, architecture-hexagonal for ports/adapters, xp-tdd-practices and testing-standards for behavior, frontend-patterns for React, git-strategy for branches and qa-review for independent review.
