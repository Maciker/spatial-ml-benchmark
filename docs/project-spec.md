# Spatial ML Benchmark: bounded MVP

## Outcome
Compare a majority baseline and a JavaScript Random Forest under reproducible random and spatial evaluation.

## Foundation delivered by this branch
The balanced-accuracy kernel and its known-result test are ported to TypeScript. Dataset, features, folds, model adapter, experiment runner and map are pending.

## Constraints
- TypeScript application code, Node 22/24, pnpm workspaces.
- Deterministic spatial/numerical results; never use an LLM as a geometry or accuracy oracle.
- Preserve CRS, units, NoData, source hashes, identifiers and licenses.
- Reject unsupported operations explicitly; never infer an authoritative CRS or silently repair inputs.
- Local demo first, bounded inputs and resources; no hosted service, billing or automatic publishing.

## Acceptance source
The [Spatial ML Benchmark Linear project](https://linear.app/maciker/project/spatial-ml-benchmark-c18b3a2a91b5) (tracker **MAC-11**) is the authoritative product backlog. Each child issue provides a vertical user outcome, dependencies and testable acceptance criteria.

## Workflow references
Use domain-modeling for contracts, architecture-hexagonal for ports/adapters, xp-tdd-practices and testing-standards for behavior, frontend-patterns for React, git-strategy for branches and qa-review for independent review. See canonical `.ai/skills/*/SKILL.md` and `.ai/commands/to-spec.md`, `to-tickets.md`.
