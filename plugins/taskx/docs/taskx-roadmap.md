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

### M1 — Coverage ramp (make it useful) 🟡

Goal:

- Make TaskX immediately useful for day-to-day decision support by maximizing the
  proportion of tasks that can flow end-to-end toward execution or resolution.

Focus:

- Policy-light facts and issue detectors,
- Mechanical, low-risk fix candidates,
- Patch application back to notes,
- Visible, explainable “why” for actionability and urgency.

Rule of thumb:

> M1 favors **visible throughput** and **explainable behavior** over sophisticated strategy.

Success criterion:

- A growing share of real tasks can be analyzed, explained, fixed, and executed using TaskX.

---

#### M1.0 — Real task collection + visible sample (first step) ✅

Intent:

- Before we can fix tasks, we must see real tasks flowing through the system.
- This step removes stubbed collection and ensures all collected tasks have
  stable identities and explicit origins.
- The feed must display a small, raw sample to validate the end-to-end path.

Deliverables:

- Collect real tasks from the vault via a Dataview adapter.
- Ensure every collected TaskEntity has:
  - a stable `id` (extracted or deterministic temporary),
  - a `TaskOrigin` with an explicit `kind`.
- Show the first 5 collected tasks in the TaskX block output,
  even if they do not match any "do now" policy yet.

Status:

- ✅ Achieved

---

#### M1.1 — Task summaries in the feed (make it inspectable) ✅

Intent:

- The M1.0 "Collected sample" proves end-to-end throughput, but ids alone are not
  sufficient for day-to-day inspection.
- We want the feed to show a **human-readable task summary** while keeping the UI
  contract decoupled from TaskEntity internals.

Deliverables:

- The "Collected" section renders task text, not only ids.
- Optionally render origin metadata (path / line) as provenance diagnostics.
- Keep ids as optional diagnostics (do not remove them; just make them opt-in).

Status:

- ✅ Achieved

---

#### M1.2 — Append smart links for edit convenience ✅

Intent:

- Task lists rendered by TaskX should be actionable for editing: each rendered task should
  include a link back to its source note.
- This matches the ergonomic expectation set by popular task list renderers: “see it → click it
  → edit it”, without manual searching.

Deliverables:

- Every rendered task item (at least in "Collected" and "Do now") appends a provenance link:
  `[[path/to/file|filename]]` where `filename` is shown without the `.md` extension.
- The link rendering must be policy-free and purely derived from `TaskSummary.origin`.
- Link display should be gateable via a render option (for minimal/diagnostic modes).
- Jump-to-line behavior is explicitly **out of scope for M1** and is tracked under M2
  (it depends on Obsidian workspace/editor APIs).

Status:

- ✅ Achieved

---

#### M1.3 — First real issue detector: missing-duration ✅

Intent:

- If "Do now" is empty, the system must explain what is preventing execution.
- Missing duration is the lowest-risk, highest-coverage “blocker” to detect and surface.

Deliverables:

- Create `src/features/issues/missing-duration/`:
  - An `IssueDetector` that identifies leaf tasks missing ⏱️ duration.
  - Structured `Issue` output with stable identifiers and evidence.
  - A minimal `FixCandidate` (even if the first version is “manual fix” guidance only).
- Register the detector through `src/core/registries/issue-detectors.ts`.
- Ensure plugin startup imports feature modules so registration happens at runtime.
- Ensure each `fix` recommendation carries the target `TaskSummary` so the UI can
  show:
  - task text,
  - and provenance smart link(s), consistent with Collected / Do now rendering.

Implementation order (files to touch):

1. ✅ `src/features/issues/missing-duration/` (new)
   - Implement detector + fix builder + registration entry.

2. ✅ `src/plugin.ts`
   - Import the feature module(s) so registries are populated.

3. ✅ `src/core/pipeline/stage-issues.ts`
   - Confirm determinism (stable iteration order) when multiple detectors exist.

4. ✅ `tests/` (T1)
   - Unit test for the detector.
   - Contract test that a missing-duration issue results in visible fix/unblock recommendations.

5. ✅ `src/core/model/recommendation.ts` + `src/core/pipeline/stage-recommend.ts`
   - Extend the `fix` recommendation payload with target `TaskSummary[]` (or equivalent
     minimal task context), populated from issue targets.

6. ✅ `src/ui/feed/render-feed.ts`
   - Render fix recommendation task context with the same readability/provenance conventions
     used by Collected / Do now task lists.

7. ✅ `tests/` (T1)
   - Add/extend DOM and contract coverage to verify fix recommendations render task text and
     smart provenance links.

Success criterion:

- A vault with tasks missing duration produces visible “needs duration” output in the feed.
- Missing-duration fix recommendations are directly actionable in the UI because they include
  task text and source-link context, not fix metadata alone.

Status:

- ✅ Achieved

---

#### M1.3b — Feed priority and unblock cap defaults (UX throughput) ✅

Intent:

- The feed should surface the most actionable information first.
- Large unblock lists must not drown immediate execution signals.
- Ordering and capping policy must remain core-owned (pipeline), not UI-owned.

Deliverables:

- Update ranking/grouping policy so section priority is:
  - **Do now** first (when non-empty),
  - then **Unblock**,
  - then **Collected** (diagnostic tail).
- Cap visible unblock recommendations by default to **5** items.
- Keep ordering deterministic and policy-light.

Implementation order (files to touch):

1. ✅ `src/core/pipeline/stage-rank.ts`
   - Encode default section order and unblock cap policy.
   - Keep tie-breaking deterministic.

2. ✅ `src/core/model/recommendation.ts` (only if needed)
   - Add minimal contract fields only when strictly required for deterministic capping/ordering.

3. ✅ `tests/` (T1)
   - Add/extend contract tests to verify section order and unblock capping behavior.

Success criterion:

- On a busy vault, the first visible section is actionable by default and unblock noise is bounded to 5.
- UI remains a pure renderer of pipeline decisions.

Status:

- ✅ Achieved

---

#### M1.3c — Explicit UX toggles and policy seams (settings-ready) ✅

Intent:

- Introduce explicit, documented seams for display defaults before full Obsidian settings UI.
- Prevent policy drift by separating:
  - core ranking policy,
  - UI visibility toggles,
  - entry/runtime wiring.

Deliverables:

- Introduce explicit default constants/modules for:
  - ranking policy defaults (core),
  - UI visibility defaults (UI/entry).
- Support minimal toggles such as:
  - show/hide collected section by default,
  - preserve existing diagnostics toggles (`showIds`, provenance link behavior).
- Keep toggles non-policy: they may hide/show sections but must not re-rank recommendations.

Implementation order (files to touch):

1. ✅ `src/core/pipeline/` (policy module + usage in rank stage)
   - Centralize ranking defaults (e.g., unblock cap, priority order).

2. ✅ `src/ui/feed/` and/or `src/entry/` (display default module + wiring)
   - Centralize render visibility defaults and runtime option mapping.

3. ✅ `tests/` (T1)
   - Add coverage that toggles affect visibility only, not ranking semantics.

Success criterion:

- UX defaults are explicit and centralized.
- Future settings integration can map onto existing seams without refactoring core contracts.

Status:

- ✅ Achieved

---

#### M1.4 — Actionability breakdown: blocked vs not-actionable vs executable 🟡

Intent:

- The user must be able to answer: “why is Do now empty?”
- We want clear, explainable reasons derived from facts and dependencies:
  blocked, missing metadata, non-leaf, not-yet-available, etc.

Constraint:

- `TaskSummary` remains minimal (id + text + optional origin).
- Diagnostics must be expressed via a separate UI-facing contract attached to recommendations,
  not embedded inside the raw task summary.
- Signal identifiers are stable contract IDs:
  - `RecommendationSignal.id` is machine-readable and must remain stable over time.
  - Signal IDs must be documented under one umbrella concept and individually enumerated.
  - Any correspondence between signal IDs and other stable IDs (issue kinds, section ids,
    recommendation kinds) must be explicitly contracted in docs.

Deliverables:

- Introduce a UI-facing “signals / badges” payload that can be rendered dumbly:
  - Example categories: overdue/due-soon, blocked, missing-duration, non-leaf, future-start.
- Define the signal ID contract and documentation source of truth:
  - Add an umbrella glossary entry for recommendation signals.
  - Add per-signal glossary entries with semantics and stability expectations.
  - Add naming guidance for signal IDs and signal-to-domain correspondence rules.
- Emit these signals deterministically from the pipeline (policy-light).
- Render signals in the feed with stable DOM structure and clear labels.
- Ensure signals are visually/semantically distinct from `why` rationale text,
  so users can clearly identify badges vs explanations.

Implementation order (files to touch):

1. ✅ `src/core/model/recommendation.ts`
   - Add a stable UI-facing diagnostic/signal type used by recommendations/sections.

2. ✅ `docs/taskx-glossary.md` + `docs/taskx-naming.md` (+ roadmap status refresh as needed)
   - Contract the umbrella concept for recommendation signals.
   - Add per-signal stable IDs and explicit correspondence rules to existing contract IDs.

3. 🟡 `src/core/pipeline/stage-analyze.ts` / `src/core/model/facts.ts`
   - Ensure facts needed for actionability explanation are available and deterministic.

4. 🟡 `src/core/pipeline/stage-recommend.ts`
   - Attach signals to relevant recommendations (especially do-now and unblock/cleanup).

5. 🟡 `src/ui/feed/render-feed.ts`
   - Render signals as stable, testable badges/labels.
   - Keep a dedicated signal container/markup distinct from rationale bullet lists.

6. 🟡 `tests/` (T1)
   - Stage-level unit tests for signal computation.
   - DOM contract test asserting badge presence and stability.
   - DOM contract test asserting signals are distinguishable from `why` text.

Success criterion:

- “Do now = 0” is accompanied by visible, specific reasons in the output.
- Signal badges are clearly distinguishable from rationale bullets in rendered output.

#### M1.4b — Dev debug mirror for rendered block state (follow-up, implicit) 🟡

Intent:

- Improve debugging feedback loops by persisting the rendered block state to disk
  during development.

Constraints:

- The mirror is debug-only and must not change ranking/recommendation policy.
- The mirror is gated by a dedicated boolean flag.
- Default behavior: enabled in dev mode.

Implementation note:

- Write a sanitized mirror file of block content to local disk when the debug
  mirror flag is `true`.

---

#### M1.5 — Useful sections in the feed (attention / can-do-now / needs-cleanup) 🟡

Intent:

- Raw “Collected” is useful for debugging, but not for daily decisions.
- We want three obvious, explainable lenses that stay policy-light.

Deliverables:

- Add deterministic sections derived from facts/issues/signals:
  - **Attention**: overdue / due soon / urgent problems.
  - **Can do now**: executable leaf tasks (duration set, unblocked, available).
  - **Needs cleanup**: tasks prevented from execution (missing duration, blocked, non-leaf).
- Establish deterministic sort rules inside each section:
  - Overdue first, then due date ascending, then duration ascending (when available),
    with stable tie-breakers.

Implementation order (files to touch):

1. 🟡 `src/core/pipeline/stage-rank.ts`
   - Group recommendations into the new sections and apply stable ordering.

2. 🟡 `src/core/model/recommendation.ts`
   - Ensure section identity/kinds remain stable and testable.

3. 🟡 `src/ui/feed/render-feed.ts`
   - Render the new sections without embedding any policy.

4. 🟡 `tests/` (T1)
   - Unit tests for ranking/grouping determinism.
   - Contract test verifying section presence and basic ordering.

Success criterion:

- The TaskX block immediately highlights “important / late / actionable” tasks in a stable way.

---

#### M1.5b — Apply missing-duration fixes from the feed (narrow interaction loop) 🟡

Intent:

- Reduce friction between “Unblock” diagnosis and actual note updates.
- Keep the interaction explicit and conservative (no auto-write, no bulk-magic).
- Validate that M1 recommendations solve real-world workflow pain, not only visibility.

Deliverables:

- Add a minimal interaction path to apply a selected missing-duration fix from feed output.
- Scope to one fix action type initially: `set-duration`.
- Keep user intent explicit (click/confirm style), with clear success/failure feedback.

Implementation order (files to touch):

1. 🟡 `src/ui/feed/render-feed.ts`
   - Add stable action hooks for fix application controls.

2. 🟡 `src/entry/` + `src/adapters/obsidian/patch-applier.ts`
   - Wire action dispatch to conservative patch application.

3. 🟡 `tests/` (T1)
   - Contract tests for interaction-to-patch flow and failure safety.

Success criterion:

- From an Unblock recommendation, a user can apply duration fixes without manual
  note hunting via smart links.

---

#### M1.5c — Duration rollup for parent tasks via `partOf` tree reuse 🟡

Intent:

- Ensure parent task durations stay meaningful once leaf durations are set.
- Reuse existing `partOf` relation groundwork rather than rebuilding hierarchy logic.

Deliverables:

- Compute/update parent task duration from child durations in the `partOf` tree.
- Define deterministic rollup semantics (sum of executable child durations unless overridden).
- Preserve manual override behavior where explicitly encoded (if present in source format).

Implementation order (files to touch):

1. 🟡 `src/core/model/facts.ts` and/or `src/core/pipeline/stage-analyze.ts`
   - Add deterministic rollup facts based on `partOf` structure.

2. 🟡 `src/adapters/obsidian/patch-applier.ts` (if write-back is part of this step)
   - Apply rolled-up duration updates conservatively.

3. 🟡 `tests/` (T1)
   - Unit/contract tests for rollup correctness, overrides, and edge cases.

Success criterion:

- After leaf durations are set, parent tasks reflect coherent rolled-up duration
  values and no longer remain structurally under-specified.

---

#### M1.6 — Patch application (minimal) 🟡

Intent:

- M1 features should not remain read-only: we must close the loop by writing back simple fixes.
- Missing duration is the first target: safe, local, and mechanically applicable.

Deliverables:

- Implement `src/adapters/obsidian/patch-applier.ts`:
  - Apply a minimal set of `FixAction` plans back to markdown.
  - Keep patching conservative: local edits, clear failure modes, no silent rewrites.
- Wire patch application into the minimal interaction surface (M1 scope):
  - The pipeline can propose fixes; applying them is an explicit user action (no auto-write).

Implementation order (files to touch):

1. 🟡 `src/adapters/obsidian/patch-applier.ts` (new)
2. 🟡 `src/core/model/fix.ts`
   - Confirm `FixAction` primitives cover minimal duration insertion.
3. 🟡 `tests/` (T1)
   - String/fixture-based patch tests for correctness and safety.

Success criterion:

- At least one mechanical fix can be applied reliably to vault notes (missing-duration insertion).

---

### T1 — Feature test coverage (keep it safe) 🟡

Goal:

- Bring coverage up alongside M1 so the system can evolve safely.
- Target: high confidence on M1 behavior (core, pipeline, adapters, UI), with deterministic tests.

Focus:

- Unit tests for new core and pipeline logic,
- Contract tests for pipeline-to-UI behavior via entrypoints,
- Adapter tests with thin stubs and fixtures,
- Deterministic time fixtures.

Rules:

- No new M1 feature without at least one relevant test.
- Tests must respect import boundaries, except for explicit contract tests
  that go through public entrypoints only.

Deliverables (in order):

#### T1.0 — Test fixtures and builders 🟡

- Add `tests/fixtures/` (markdown snippets, task samples, expected feeds).
- Add `tests/builders/` (TaskEntity builders, Facts builders, Recommendation builders).
- Add a deterministic `TimeContext` fixture to avoid time-dependent flakiness.

#### T1.1 — Core model unit coverage 🟡

- Unit tests for:
  - `core/model/task.ts` (origin/id invariants),
  - `core/model/facts.ts` (fact derivations),
  - `core/model/issue.ts` + `core/model/fix.ts` (shape invariants),
  - `core/model/recommendation.ts` (contract invariants).

#### T1.2 — Pipeline stage unit coverage 🟡

- Unit tests for:
  - `stage-analyze.ts` (facts computation),
  - `stage-issues.ts` (detector orchestration determinism),
  - `stage-recommend.ts` (issue→recommendation mapping),
  - `stage-rank.ts` (grouping + stable ordering rules).

#### T1.3 — Adapter unit coverage 🟡

- Unit tests for:
  - id extraction / id creation,
  - time context adapter,
  - patch applier (once M1.6 begins).

#### T1.4 — UI DOM contract coverage 🟡

- DOM contract tests that assert:
  - each section renders with stable structure,
  - provenance links remain stable,
  - diagnostic signals render predictably.

Success criterion:

- M1 features are covered by tests at the appropriate layer.
- Regressions in core behavior are caught early.

---

### M2 — Advanced behavior (make it smart) ⛔

Goal:

- Introduce policy-heavy and interactive features once M1 throughput is solid.

Focus:

- Templates,
- Superblocks,
- Wizards,
- Sophisticated planning and shaping heuristics,
- Obsidian-API-driven interactions (best-effort editor/navigation behavior).

Success criterion:

- TaskX supports complex workflows and strategic planning, without compromising
  the M0/M1 pipeline.

Rule of thumb:

> Prefer work that improves **end-to-end throughput** (M1) over work that expands the
> **feature surface** (M2), once M0 exists.

---

#### M2.1 — Jump-to-line navigation from task provenance ⛔

Intent:

- When a rendered task has `origin.path` and `origin.line`, clicking the UI affordance should
  open the note and attempt to position the cursor near that line (best-effort).

Notes:

- This is an interaction feature and depends on Obsidian workspace/editor APIs.
- It must gracefully fall back to opening the file when cursor positioning is not available.
- The core/UI contracts remain “origin path + optional line”; no URI scheme is required.

---

### T2 — Advanced behavior tests (keep it sane) ⛔

Goal:

- Extend the test suite to cover M2-level behavior and higher-level integration confidence.

Focus:

- Scenario tests for M2 interactions and complex flows,
- Higher-level integration tests across pipeline + UI,
- Regression tests for complex workflows.

Deliverables:

- `tests/scenario/` with curated, deterministic scenarios exercising:
  - pipeline + renderer end-to-end,
  - best-effort navigation behavior (where mockable),
  - wizard state machines (once they exist).

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
