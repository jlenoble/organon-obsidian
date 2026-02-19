# TaskX — Structure and Extension Reference

This document contains the non-milestone reference material previously stored in
`docs/taskx-roadmap.md`:

- architecture layer map,
- file and folder responsibility map,
- extension and change-management rules.

It is the structural companion to `docs/taskx-roadmap-milestones.md`.

---

## 1) High-level architecture

TaskX is structured around four layers:

1. **Core model (`src/core/model/`)**
   Pure domain contracts. No Obsidian, no UI, no side effects.

2. **Pipeline (`src/core/pipeline/`)**
   Pure orchestration stages that transform data step by step:
   tasks → facts → issues → recommendations → feed.

3. **Registries (`src/core/registries/`)**
   Extensibility seams where features register detectors, wizards, scorers, etc.

4. **Adapters & UI (`src/adapters/`, `src/ui/`, `src/entry/`)**
   Everything that touches Obsidian, Dataview, Tasks plugin, or rendering.

---

## 2) Core model (src/core/model)

Purpose: define the **stable language** of the system.

- ✅ `id.ts`
  Branded ID types and casting helpers (TaskId, IssueId, FixId, FixCandidateId,
  RecommendationId, RecommendationSignalId).

- ✅ `task.ts`
  Canonical `TaskEntity` and `TaskOrigin` (tool-agnostic task representation).

- ✅ `time.ts`
  `TimeContext` as the only source of “now” for the pipeline.

- ✅ `facts.ts`
  `TaskFacts` and `TaskFactsIndex` (derived, computed observations about tasks).

- ✅ `fix.ts`
  `FixAction` (atomic intents) and `FixCandidate` (user-facing bundles).

- ✅ `issue.ts`
  `Issue` and `IssueSeverity` (structured problem reports).

- ✅ `recommendation.ts`
  `Recommendation`, `RecommendationKind`, `RecommendationSignal`, and
  `RecommendationFeed` (UI contract).

Planned (M2):

- ⛔ `template.ts`
  Task templates / blueprints (spawnable canonical decompositions).

- ⛔ `superblock.ts`
  Recurring availability windows / planning envelopes.

---

## 3) Registries (src/core/registries)

Purpose: define **plugin-style extension points** without changing the pipeline.

- ✅ `issue-detectors.ts`
  Registry for `IssueDetector` implementations.

Planned (M2):

- ⛔ `wizards.ts`
  Registry for interactive wizards (decomposition, planning, etc.).

- ⛔ `scorers.ts`
  Registry for recommendation scoring policies.

- ⛔ `templates.ts`
  Registry/loader for task templates.

---

## 4) Pipeline (src/core/pipeline)

Purpose: **pure orchestration**. No UI, no Obsidian, no side effects.

Stages (in order):

- ✅ `stage-collect.ts`
  Collect tasks from adapters and return `TaskEntity[]`.

- ✅ `stage-analyze.ts`
  Build `TaskFactsIndex` from `TaskEntity[]`.

- ✅ `stage-issues.ts`
  Run all registered issue detectors and return `Issue[]`.

- ✅ `stage-recommend.ts`
  Convert issues and facts into `Recommendation[]` (fix + minimal do-now).

- ✅ `stage-rank.ts`
  Group and order `Recommendation[]` into a `RecommendationFeed`.

- ✅ `rank-policy.ts`
  Centralized default ranking/display policy constants for section priority and
  default capping behavior.

- ✅ `pipeline.ts`
  Orchestrate all stages end-to-end and return the final feed.

Planned (M2):

- ⛔ `stage-plan.ts` or similar
  Dedicated planning stage for superblocks, day shaping, etc.

---

## 5) Features (src/features)

Purpose: **one folder per feature**, matching stable IDs.

Status:

- ✅ Feature folder present.

### Issues (primarily M1)

- ✅ `features/issues/missing-duration/` (M1.3)
  Detect tasks missing duration and propose fixes.

(Other issue features remain out of scope until the first one is solid and end-to-end.)

Each issue feature provides:

- a detector,
- fix builders,
- and registers itself in the appropriate registry.

### Wizards (M2)

- ⛔ `features/wizards/decompose-task/`
- ⛔ `features/wizards/shape-day/`

Each wizard:

- implements a state machine,
- produces `FixCandidate[]` on completion,
- registers itself in the wizard registry.

---

## 6) Adapters (src/adapters)

Purpose: **bridge the outside world to the core**.

- ✅ `adapters/obsidian/collect-tasks.ts`
  Collect tasks from Obsidian / Tasks plugin / Dataview and normalize to
  `TaskEntity[]`.

- 🟡 `adapters/obsidian/patch-applier.ts` (M1.6)
  Apply `FixAction[]` / patch plans back to markdown files.

- ✅ `adapters/obsidian/time-context.ts`
  Build `TimeContext` from the environment.

---

## 7) UI and entrypoints

### UI (src/ui)

- ✅ `ui/feed/render-feed.ts`
  Render `RecommendationFeed` to an HTMLElement (dumb view).

Planned:

- ⛔ `ui/feed/render-recommendation-*.ts` (optional)
  Optional split renderers per kind (fix, do-now, wizard, plan) once the feed grows.

### Entry (src/entry)

- ✅ `entry/render.ts`
  Glue code: run pipeline, pass feed to renderer.

- ✅ `entry/render-defaults.ts`
  Settings-ready entry defaults seam for render visibility and diagnostics
  behavior.

### Plugin root

- ✅ `plugin.ts`
  Obsidian plugin entry: register code block and wire entrypoints.

Planned (M1):

- ✅ Feature registration imports (M1.3+)
  Plugin startup imports feature modules so registries are populated at runtime.

---

## 8) Tests (tests/)

Purpose: **protect behavior and contracts** at different scales.

- 🟡 `tests/unit/` (T1)
  Unit tests for core model, pipeline stages, UI renderers, and adapters.

- 🟡 `tests/contract/` (T0/T1)
  Cross-layer tests that protect public contracts via entrypoints only.

- ⛔ `tests/scenario/` (T2)
  Scenario and integration tests for advanced behavior and high-level regression coverage.

- ⛔ `tests/fixtures/` (T1.0)
  Static test data such as markdown snippets, tasks, and example feeds.

- ⛔ `tests/builders/` (T1.0)
  Test helpers to construct domain objects and contexts.

Rules:

- Tests follow the same import boundaries as production code by default.
- Only contract tests may cross layers, and only via public entrypoints.
- New test categories or folders must be recorded in this roadmap.

---

## 9) Rules for extending the system

1. New **domain concepts** go in `src/core/model/`.
2. New **analysis or orchestration steps** go in `src/core/pipeline/`.
3. New **pluggable logic** goes behind a registry in `src/core/registries/`.
4. New **behavioral features** live in `src/features/<kind>/<feature-id>/`.
5. New **environment-specific code** lives in `src/adapters/`.
6. The UI only consumes `RecommendationFeed` and never re-ranks or re-interprets
   core decisions.
7. Tests must respect the same boundaries, except for explicit contract tests
   that go through public entrypoints only.
8. New test folders or categories must be added to this document.

---

## 10) Change management

- This file must be updated **before or alongside** any structural change.
- If a new folder or responsibility appears, it must be recorded here.
- This document is the contract that keeps long-term evolution coherent.
