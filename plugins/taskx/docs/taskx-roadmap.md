# TaskX — Architecture Roadmap

This document is the **authoritative roadmap** for the TaskX codebase structure.

It answers:

- What folders and files are expected to exist,
- What each area is responsible for,
- Which parts are already implemented and which are planned,
- Where new features must be added.

If there is a conflict between ad-hoc implementation and this file, **this file wins**
(unless it is explicitly updated first).

Status markers:

- ✅ Implemented
- 🟡 Planned / stubbed
- ⛔ Not started

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
  Branded ID types and casting helpers (TaskId, IssueId, FixId, FixCandidateId, RecommendationId).

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

Planned additions:

- 🟡 `template.ts`
  Task templates / blueprints (spawnable canonical decompositions).
- 🟡 `superblock.ts`
  Recurring availability windows / planning envelopes.

---

## 3) Registries (src/core/registries)

Purpose: define **plugin-style extension points** without changing the pipeline.

- ✅ `issue-detectors.ts`
  Registry for `IssueDetector` implementations.

Planned:

- 🟡 `wizards.ts`
  Registry for interactive wizards (decomposition, planning, etc.).
- 🟡 `scorers.ts`
  Registry for recommendation scoring policies.
- 🟡 `templates.ts`
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

- 🟡 `stage-rank.ts`
  Group and order `Recommendation[]` into a `RecommendationFeed`.

- 🟡 `pipeline.ts`
  Orchestrate all stages end-to-end and return the final feed.

Planned later:

- 🟡 `stage-plan.ts` or similar
  Dedicated planning stage for superblocks, day shaping, etc. (name TBD, but role is here).

---

## 5) Features (src/features)

Purpose: **one folder per feature**, matching stable IDs.

### Issues

- 🟡 `features/issues/missing-duration/`
  Detect tasks missing duration and propose fixes.
- 🟡 `features/issues/missing-dependency/`
- 🟡 `features/issues/inconsistent-dates/`
- 🟡 `features/issues/ambiguous-next-step/`
- 🟡 … (others as needed)

Each issue feature provides:

- a detector,
- fix builders (and later, optional wizard hooks),
- and registers itself in the appropriate registry.

### Wizards

- 🟡 `features/wizards/decompose-task/`
- 🟡 `features/wizards/shape-day/`

Each wizard:

- implements a state machine,
- produces `FixCandidate[]` on completion,
- registers itself in the wizard registry.

---

## 6) Adapters (src/adapters)

Purpose: **bridge the outside world to the core**.

- 🟡 `adapters/obsidian/collect-tasks.ts`
  Collect tasks from Obsidian / Tasks plugin / Dataview and normalize to `TaskEntity[]`.

- 🟡 `adapters/obsidian/patch-applier.ts`
  Apply `FixAction[]` / patch plans back to markdown files.

- 🟡 `adapters/obsidian/time-context.ts`
  Build `TimeContext` from the environment.

---

## 7) UI and entrypoints

### UI (src/ui)

- 🟡 `ui/feed/render-feed.ts`
  Render `RecommendationFeed` to an HTMLElement (dumb view).

- 🟡 `ui/feed/render-recommendation-*.ts`
  Optional split renderers per kind (fix, do-now, wizard, plan).

### Entry (src/entry)

- 🟡 `entry/render.ts`
  Glue code: run pipeline, pass feed to renderer.

### Plugin root

- 🟡 `plugin.ts`
  Obsidian plugin entry: register code block, commands, registries, settings.

---

## 8) Rules for extending the system

1. New **domain concepts** go in `src/core/model/`.
2. New **analysis or orchestration steps** go in `src/core/pipeline/`.
3. New **pluggable logic** goes behind a registry in `src/core/registries/`.
4. New **behavioral features** live in `src/features/<kind>/<feature-id>/`.
5. New **environment-specific code** lives in `src/adapters/`.
6. The UI only consumes `RecommendationFeed` and never re-ranks or re-interprets core decisions.

---

## 9) Change management

- This file must be updated **before or alongside** any structural change.
- If a new folder or responsibility appears, it must be recorded here.
- This document is the contract that keeps long-term evolution coherent.
