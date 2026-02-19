# Layers Orchestration

## Purpose

- Coordinate work across Layer 0, Layer 1, and Layer 2.
- Keep one place for cross-layer priorities and tradeoffs.
- Support back-and-forth execution without rewriting layer histories.

#### Rules

- Layer-level history stays in each layer `orchestration.md`.
- This file only handles cross-layer arbitration.
- Step content remains in step files.

## Layer map

- Layer 0 orchestration: [[plugins/taskx/docs/roadmap/layers/layer0/orchestration.md|layer0/orchestration.md]]
- Layer 1 orchestration: [[plugins/taskx/docs/roadmap/layers/layer1/orchestration.md|layer1/orchestration.md]]
- Layer 2 orchestration: [[plugins/taskx/docs/roadmap/layers/layer2/orchestration.md|layer2/orchestration.md]]

## Cross-layer active steps (dynamic)

```dataview
TABLE layer, step_id, track, status, updated_at
FROM "plugins/taskx/docs/roadmap/layers"
WHERE step_id AND (status = "ongoing" OR status = "paused")
SORT updated_at DESC
```

## Cross-layer planned queue (dynamic)

```dataview
TABLE layer, historical_order, step_id, track, depends_on
FROM "plugins/taskx/docs/roadmap/layers"
WHERE step_id AND status = "planned"
SORT layer ASC, historical_order ASC
```

## Current policy

- Default priority is Layer 1 throughput.
- Layer 2 can run in parallel only if explicitly selected.
- Layer 0 remains stable unless regression work is required.
