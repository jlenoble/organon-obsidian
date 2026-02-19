# TaskX Layer 1 Roadmap (M1 + T1)

## Purpose

- Define practical throughput goals for the current TaskX phase.
- Keep roadmap semantics clear and lightweight.
- Keep step history in orchestration only.

## Tracks in this layer

- `M1` (make it useful)
- `T1` (keep it safe)

## M1 — Coverage ramp (make it useful) 🟡

#### Goal

- Make TaskX useful for day-to-day decision support by increasing the share of
  real tasks that can flow toward execution or resolution.

#### Focus

- Policy-light facts and issue detectors.
- Mechanical, low-risk fix candidates.
- Patch application back to notes.
- Visible, explainable actionability signals.

#### Rule of thumb

- Prefer visible throughput and explainable behavior over sophisticated strategy.

## T1 — Feature test coverage (keep it safe) 🟡

#### Goal

- Raise confidence alongside M1 feature growth.

#### Focus

- Unit tests for core and pipeline behavior.
- Contract tests for pipeline-to-UI expectations.
- Adapter tests with deterministic fixtures.

#### Rules

- No new M1 feature without relevant tests.
- Import boundaries stay strict except explicit entrypoint contract tests.

## Boundaries

- Step internals live only in step files.
- Ordering, active focus, and history live in orchestration only.
- Runtime sloting remains dynamic and external to this roadmap note.

## Layer orchestration

- [[layers/layer1/orchestration.md|orchestration.md]]

## Step files in this layer

```dataview
TABLE historical_order AS "order", step_id, status
FROM "plugins/taskx/docs/roadmap/layers/layer1"
WHERE step_id
SORT historical_order ASC
```

## Cross-layer orchestration

- [[layers/orchestration.md]]
