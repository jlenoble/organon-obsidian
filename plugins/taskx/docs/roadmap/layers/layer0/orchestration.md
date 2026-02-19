# Layer 0 Orchestration

## Purpose

- Keep one historical view for Layer 0.
- Track execution order and state of Layer 0 steps.
- Express orchestration constraints without rewriting step content.

#### Rules

- Step files are the source of truth for step details.
- This note is the source of truth for Layer 0 history and ordering.
- Runtime slot assignment stays outside this note.

## History and status

```dataview
TABLE historical_order AS "order", step_id, track, status, added_at, updated_at, completed_at
FROM "plugins/taskx/docs/roadmap/layers/layer0"
WHERE step_id
SORT historical_order ASC
```

## Current orchestration focus

- Layer 0 is complete and should remain stable.
- Any reopen must be explicit in step status and date fields.

## Cross-layer handoff

- Main active work is expected in Layer 1 unless a regression forces Layer 0 changes.
- Global priorities live in [[layers/orchestration.md]].
