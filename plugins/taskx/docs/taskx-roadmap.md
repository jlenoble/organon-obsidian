# TaskX — Architecture Roadmap

This document is the **authoritative roadmap** for the TaskX codebase structure.

It answers:

- What folders and files are expected to exist,
- What each area is responsible for,
- Which parts are already implemented and which are planned,
- In which order major capabilities should be built,
- Where new features must be added.

If there is a conflict between ad-hoc implementation and this file, **this file wins**
(unless it is explicitly updated first).

Status markers:

- ✅ Implemented
- 🟡 Planned / stubbed
- ⛔ Not started

---

## 0) Milestones and priorities

Development is organized around two **orthogonal tracks**:

- **M\*** milestones: product capabilities
- **T\*** milestones: testing infrastructure and coverage

Rule of thumb:

> Product milestones define _what_ the system can do.
> Test milestones define _how confidently_ we can evolve it.

No M* milestone should advance significantly without its corresponding T* support.

---

### M0 — Vertical slice (make it run) ✅

Goal:

- Achieve an end-to-end path:
  pipeline → feed → renderer → code block → visible output in Obsidian,
  even with minimal or stubbed data.

Focus:

- Pipeline orchestration completeness,
- Feed rendering,
- Entry points and plugin wiring.

Success criterion:

- A TaskX code block renders a `RecommendationFeed` in Obsidian.

Status:

- ✅ Achieved

---

### T0 — Test harness (make it testable) ✅

Goal:

- Install and wire the testing framework.
- Make the codebase testable in a deterministic way.

Focus:

- Vitest integration compatible with Vite and Rush,
- Node test environment for core and pipeline,
- JSDOM test environment for UI rendering,
- Path alias resolution consistent with the build,
- Deterministic time handling (injectable `TimeContext` in tests).

Deliverables:

- Test runner configuration and scripts,
- At least a minimal test scaffold:
  - ✅ One core/pipeline contract test,
  - ✅ One UI renderer DOM test,
  - ✅ One simple pure unit test.

Success criterion:

- Tests can be run in CI and locally.
- We can write both node and DOM tests reliably.

Status:

- ✅ Achieved

---

### M1 — Coverage ramp (make it useful) ⛔

Goal:

- Maximize the proportion of tasks that can flow end-to-end toward execution or resolution.

Focus:

- Policy-light facts and issue detectors,
- Mechanical, low-risk fixes,
- Patch application back to notes,
- Real task collection from the vault.

Examples:

- Missing duration detection + simple duration fixes,
- Obvious blocking dependencies,
- Simple normalization and cleanup steps.

Success criterion:

- A growing share of real tasks can be analyzed, fixed, and executed using TaskX.

---

### T1 — Feature test coverage (keep it safe) ⛔

Goal:

- Add tests alongside M1 features.

Focus:

- Unit tests for new core and pipeline logic,
- Contract tests for pipeline behavior,
- UI tests for new render paths,
- Adapter tests with thin stubs and fixtures.

Rules:

- No new M1 feature without at least one relevant test.
- Tests must respect import boundaries, except for explicit contract tests
  that go through public entrypoints only.

Success criterion:

- M1 features are covered by tests at the appropriate layer.
- Regressions in core behavior are caught early.

---

### M2 — Advanced behavior (make it smart) ⛔

Goal:

- Introduce policy-heavy and interactive features.

Focus:

- Templates,
- Superblocks,
- Wizards,
- Sophisticated planning and shaping heuristics.

Success criterion:

- TaskX supports complex workflows and strategic planning, without compromising
  the M0/M1 pipeline.

Rule of thumb:

> Prefer work that improves **end-to-end throughput** (M1) over work that expands the
> **feature surface** (M2), once M0 exists.

---

### T2 — Advanced behavior tests (keep it sane) ⛔

Goal:

- Extend the test suite to cover M2-level behavior.

Focus:

- State machine tests for wizards,
- Scenario tests for planning and shaping,
- Higher-level integration tests across pipeline + UI,
- Regression tests for complex workflows.

Success criterion:

- Complex behaviors are protected by scenario and integration tests.
- Refactors in M2 do not silently break user-facing logic.

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
  RecommendationId).

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
  `Recommendation`, `RecommendationKind`, and `RecommendationFeed` (UI contract).

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
  Collect tasks from adapters and return `TaskEntity[]` (currently stubbed).

- ✅ `stage-analyze.ts`
  Build `TaskFactsIndex` from `TaskEntity[]`.

- ✅ `stage-issues.ts`
  Run all registered issue detectors and return `Issue[]`.

- ✅ `stage-recommend.ts`
  Convert issues and facts into `Recommendation[]` (fix + minimal do-now).

- ✅ `stage-rank.ts`
  Group and order `Recommendation[]` into a `RecommendationFeed`.

- ✅ `pipeline.ts`
  Orchestrate all stages end-to-end and return the final feed.

Planned (M2):

- ⛔ `stage-plan.ts` or similar
  Dedicated planning stage for superblocks, day shaping, etc.

---

## 5) Features (src/features)

Purpose: **one folder per feature**, matching stable IDs.

### Issues (primarily M1)

- 🟡 `features/issues/missing-duration/`
  Detect tasks missing duration and propose fixes.
- ⛔ `features/issues/missing-dependency/`
- ⛔ `features/issues/inconsistent-dates/`
- ⛔ `features/issues/ambiguous-next-step/`
- ⛔ … (others as needed)

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

- 🟡 `adapters/obsidian/collect-tasks.ts` (M1)
  Collect tasks from Obsidian / Tasks plugin / Dataview and normalize to
  `TaskEntity[]`.

- 🟡 `adapters/obsidian/patch-applier.ts` (M1)
  Apply `FixAction[]` / patch plans back to markdown files.

- ✅ `adapters/obsidian/time-context.ts`
  Build `TimeContext` from the environment.

---

## 7) UI and entrypoints

### UI (src/ui)

- ✅ `ui/feed/render-feed.ts`
  Render `RecommendationFeed` to an HTMLElement (dumb view).

- 🟡 `ui/feed/render-recommendation-*.ts` (M1/M2)
  Optional split renderers per kind (fix, do-now, wizard, plan).

### Entry (src/entry)

- ✅ `entry/render.ts`
  Glue code: run pipeline, pass feed to renderer.

### Plugin root

- ✅ `plugin.ts`
  Obsidian plugin entry: register code block, commands, registries, settings.

---

## 8) Tests (tests/)

Purpose: **protect behavior and contracts** at different scales.

- 🟡 `tests/unit/` (T0/T1)
  Unit tests for core model, pipeline stages, UI renderers, and adapters.

- 🟡 `tests/contract/` (T0/T1)
  Cross-layer tests that protect public contracts via entrypoints only.

- ⛔ `tests/scenario/` (T2)
  Scenario and integration tests for M2-level behavior.

- 🟡 `tests/fixtures/` (T0)
  Static test data such as markdown snippets, tasks, and example feeds.

- 🟡 `tests/builders/` (T0)
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
