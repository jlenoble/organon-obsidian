# Layer 1 Orchestration

## Purpose

- Keep one historical view for Layer 1.
- Manage active and next steps for the current working layer.
- Preserve original ordering while allowing dynamic execution choices.

#### Rules

- Step files are the source of truth for step details.
- This note is the source of truth for Layer 1 history and sequencing view.
- This note does not duplicate step prose.
- Runtime sloting decisions are not hard-coded here.

## Historical sequence and status

```dataview
TABLE historical_order AS "order", step_id, track, status, added_at, updated_at, completed_at
FROM "plugins/taskx/docs/roadmap/layers/layer1"
WHERE step_id
SORT historical_order ASC
```

## Active set (dynamic)

```dataview
TABLE step_id, track, status, updated_at
FROM "plugins/taskx/docs/roadmap/layers/layer1"
WHERE step_id AND (status = "ongoing" OR status = "paused")
SORT updated_at DESC
```

## Immediate next candidates (dynamic)

```dataview
TABLE step_id, track, depends_on, status
FROM "plugins/taskx/docs/roadmap/layers/layer1"
WHERE step_id AND status = "planned"
SORT historical_order ASC
LIMIT 5
```

## Cross-layer handoff

- If Layer 2 is activated in parallel, arbitration happens in
  [[layers/orchestration.md]].
