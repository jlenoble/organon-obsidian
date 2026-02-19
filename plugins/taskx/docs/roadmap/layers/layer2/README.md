# TaskX Layer 2 Roadmap (M2 + T2)

## Purpose

- Define advanced capability intent without polluting current execution focus.
- Keep roadmap boundaries clean while Layer 1 remains primary.
- Keep step history in orchestration only.

## Tracks in this layer

- `M2` (make it smart)
- `T2` (keep it sane)

## M2 — Advanced behavior (make it smart) ⛔

#### Goal

- Introduce policy-heavy and interaction-heavy capabilities after Layer 1
  throughput is stable.

#### Focus

- Templates.
- Superblocks.
- Wizards.
- Sophisticated planning and shaping heuristics.
- Obsidian-API-driven interactions.

#### Rule of thumb

- Prefer Layer 1 throughput over Layer 2 feature-surface expansion.

## T2 — Advanced behavior tests (keep it sane) ⛔

#### Goal

- Cover M2-level behavior with scenario and integration confidence.

#### Focus

- Deterministic scenario tests for advanced workflows.
- Higher-level integration protection for pipeline plus UI.
- Regression coverage for complex interactions.

## Boundaries

- Do not invent detailed `T2.x` steps before they are truly needed.
- Keep step internals in step files.
- Keep ordering and history in orchestration only.

## Layer orchestration

- [[layers/layer2/orchestration.md|orchestration.md]]

## Step files in this layer

```dataview
TABLE historical_order AS "order", step_id, status
FROM "plugins/taskx/docs/roadmap/layers/layer2"
WHERE step_id
SORT historical_order ASC
```

## Cross-layer orchestration

- [[layers/orchestration.md]]
