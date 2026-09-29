# Rehearsal: MAC-107 hackathon demo

Branch: `cursor/mac-107-hackathon-demo-00a2` (executor run).

| Step | Command | Result |
| --- | --- | --- |
| Quality | `pnpm quality:full` | pass |
| LUCAS publish | `pnpm benchmark:publish:web-demo` | pass (replay matched) |
| Replay committed public file | `benchmark replay --manifest apps/web/public/demo-manifest.json` | pass |
| Explorer e2e | `pnpm test:e2e` | pass (8/8, including offline/blocked network) |

Republishing may change only `createdAt`; keep the committed public manifest when predictions/metrics still replay-match. Full local notes also live under `.ai/workspace/tasks/mac-107/rehearsal.md` (workspace artifact, not versioned).
