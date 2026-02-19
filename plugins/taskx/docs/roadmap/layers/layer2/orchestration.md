# Layer 2 Orchestration

## Purpose

- Keep one historical view for Layer 2.
- Track readiness and activation state of advanced work.
- Avoid premature decomposition while preserving traceability.

#### Rules

- Step files are the source of truth for step details.
- This note is the source of truth for Layer 2 history and sequencing view.
- Do not fabricate `T2.x` breakdown before real scope exists.

## Historical sequence and status

```dataview
TABLE historical_order AS "order", step_id, track, status, added_at, updated_at, completed_at
FROM "plugins/taskx/docs/roadmap/layers/layer2"
WHERE step_id
SORT historical_order ASC
```

## Activation gate

- Layer 2 should start only when Layer 1 has enough stable throughput.
- Exceptions must be called out in cross-layer orchestration.

## Cross-layer handoff

- Arbitration with Layer 1 happens in
  [[layers/orchestration.md]].
