# TaskX — Architecture Principles and Invariants

This document defines the **foundational architectural principles** of TaskX.

It complements:

- `docs/taskx-roadmap.md` (what exists and where),
- `docs/taskx-import-boundaries.md` (who may depend on whom),
- `docs/taskx-dev-process.md` (how we evolve the codebase).

If a change violates the principles here, the architecture must be updated
**explicitly** before or alongside the code change.

---

## 1) Core goals

TaskX aims to provide:

- A **progressive, structured path** from raw tasks to concrete action.
- A system that is **extensible by addition**, not by modification.
- A codebase that remains **understandable after years of growth**.
- A system that **maximizes end-to-end task throughput**, i.e. the proportion of tasks
  that can flow from observation to execution or resolution.

We optimize for:

- End-to-end usefulness and coverage over early feature sophistication,
- Long-term readability over short-term convenience,
- Explicit structure over implicit conventions,
- Deterministic behavior over “magic”.

---

## 2) Layered architecture (invariants)

The architecture is intentionally layered:

1. **Core model (`src/core/model`)**
   - Defines the language of the system (tasks, facts, issues, fixes, recommendations, time).
   - Must be **pure and environment-agnostic**.
   - Contains **no behavior tied to Obsidian, UI, or storage**.

2. **Pipeline (`src/core/pipeline`)**
   - Orchestrates transformations step by step:
     tasks → facts → issues → recommendations → feed.
   - Must be **pure orchestration**:
     - no UI,
     - no adapters,
     - no feature-specific logic.

3. **Registries (`src/core/registries`)**
   - Define **extension seams**.
   - The pipeline depends only on registries, never on concrete features.

4. **Features (`src/features`)**
   - Provide concrete implementations (issue detectors, wizards, policies, templates, etc.).
   - Register themselves via registries.
   - Must not control orchestration or rendering.

5. **Adapters and UI**
   - Adapters bridge the environment (Obsidian, filesystem, time, etc.) to the core.
   - UI renders the final `RecommendationFeed` and triggers actions.
   - Neither re-implements core decision logic.

These layers and their dependency directions are **not accidental** and must remain explicit.

---

## 3) Domain concepts and their roles

- **TaskEntity**
  Canonical representation of observed tasks. Represents “what the world is”.

- **TaskFacts**
  Derived observations computed from tasks. Represents “what we can infer”.

- **Issue**
  A structured report of a problem, inconsistency, or missing information that blocks progress.

- **FixAction / FixCandidate**
  Domain-level intents to change the world in order to resolve issues.

- **Recommendation**
  A UI-facing suggestion derived from issues and facts. Represents “what to do now”.

- **RecommendationFeed**
  The final, structured output of the pipeline. The UI must treat it as authoritative.

These concepts form a **one-way flow** from observation to action.

---

## 4) Pipeline philosophy

The pipeline is:

- **Deterministic**: same inputs produce the same feed.
- **Composable**: each stage has a single responsibility.
- **Replaceable**: stages can evolve internally without changing the global contract.

Key rules:

- No stage should “reach around” another stage.
- No stage should embed UI or environment assumptions.
- Policy decisions (ranking, grouping, planning) live in dedicated stages, not in the UI.

The pipeline exists to **increase end-to-end task throughput** by progressively
turning raw tasks into actionable recommendations.

---

## 5) Extensibility model

TaskX grows by:

- Adding **new feature modules**,
- Registering them via **registries**,
- Letting the **pipeline remain stable**.

Consequences:

- The pipeline must not import features.
- Features must not modify the pipeline.
- New behavior is introduced by registration and composition, not by branching core logic.

---

## 6) UI contract

The UI layer is responsible for **rendering** and **wiring** the output of the core
pipeline into the host environment. It is deliberately kept dumb and declarative.

The UI:

- Consumes **only** the `RecommendationFeed` and its UI-facing contracts.
- Must not:
  - re-rank recommendations,
  - re-group sections,
  - re-interpret core decisions,
  - or depend on `TaskEntity`, adapters, or registries.

When task information must be displayed, it is provided through **lightweight
UI contracts** carried by the feed, such as `TaskSummary`:

- A `TaskSummary` contains only:
  - a stable task id,
  - a human-readable text,
  - and optional, lightweight origin diagnostics.
- It exists to make the feed **inspectable and renderable** without exposing
  `TaskEntity` or adapter-specific shapes.
- It must not carry policy, computed facts, or mutation capabilities.

This keeps **all decision policy** in the core and makes the UI a pure rendering layer.

---

## 7) Testing as an architectural concern

Testing is part of the architecture, not an afterthought.

Principles:

- **Determinism is mandatory**:
  - Tests must control time and environment inputs.
  - The same inputs must always produce the same outputs.

- **Layer-appropriate tests**:
  - Core model and pipeline: unit tests and small contract tests (node environment).
  - UI: DOM structure tests against `RecommendationFeed` (dom environment).
  - Adapters: thin tests with stubs and fixtures.

- **Contracts over internals**:
  - High-level tests should go through **public entrypoints**.
  - Tests must not become a backdoor to bypass architectural boundaries.

- **Milestone alignment**:
  - **T0** establishes the test harness and environments.
  - **T1** adds coverage for M1 features.
  - **T2** adds scenario and integration coverage for M2 behavior.

The purpose of tests is to **protect architectural intent** and make refactors safe,
not to lock in incidental implementation details.

---

## 8) Non-goals (explicit)

TaskX is **not**:

- A general-purpose task editor,
- A scheduling engine that imposes a fixed methodology,
- A tag-driven rule system baked into the core,
- A UI-centric system where logic lives in views.

It is a **decision-support and action-shaping system** built around progressive structure
and increasing task throughput.

---

## 9) Change discipline

- If a new requirement does not fit these principles, update this document first.
- If a shortcut seems tempting, prefer making the architecture explicit instead.
- Architectural clarity and end-to-end usefulness are treated as features, not as overhead.
