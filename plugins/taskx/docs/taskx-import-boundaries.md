# TaskX — Import and Layer Boundaries

This document defines the **allowed dependency directions** inside the TaskX codebase.

Its goals are:

- Preserve a clean, understandable architecture over time.
- Prevent accidental coupling between layers.
- Make refactors and extensions predictable and low-risk.
- Keep the core domain independent from UI and environment details.

These rules apply to **all contributors** and to all new code, including tests.

---

## 1) Architectural layers (recap)

TaskX is structured around these main areas:

1. **Core model** — `src/core/model/`
   Pure domain contracts and types.

2. **Pipeline** — `src/core/pipeline/`
   Pure orchestration stages that transform data step by step.

3. **Registries** — `src/core/registries/`
   Extension points where features register detectors, wizards, scorers, etc.

4. **Features** — `src/features/`
   Concrete implementations of issues, wizards, policies, templates, etc.
   (Introduced progressively starting with M1 feature work, per the roadmap.)

5. **Adapters** — `src/adapters/`
   Bridges to Obsidian, Dataview, Tasks plugin, filesystem, time, patch application, etc.

6. **UI** — `src/ui/`
   Rendering and interaction code. Consumes only UI contracts from the core.

7. **Entry points** — `src/entry/`, `plugin.ts`
   Wiring and lifecycle integration with Obsidian.

---

## 2) General rules

1. **Dependencies point inward, never outward**
   Higher-level or environment-specific layers may depend on lower-level, abstract layers,
   but not the other way around.

2. **Core must remain environment-agnostic**
   Anything under `src/core/` must not import Obsidian APIs, DOM APIs, or adapter code.

3. **UI is a consumer, not a decision-maker**
   UI code renders `RecommendationFeed` and triggers actions, but does not re-implement
   ranking, grouping, diagnostics, or planning policy. All such decisions live in the
   core pipeline and features.

4. **Features plug into registries, not into the pipeline directly**
   The pipeline only knows about registries, never about concrete feature modules.

5. **Tests must respect the same boundaries by default**
   Tests are not a backdoor to bypass the architecture. They follow the same import rules
   as production code, with the explicit, limited exceptions described in section 4.

---

## 3) Allowed imports by area

### 3.1 `src/core/model/`

May import:

- Other files in `src/core/model/`

Must NOT import:

- `core/pipeline`
- `core/registries`
- `features/*`
- `adapters/*`
- `ui/*`
- Any Obsidian, DOM, or environment-specific APIs

Rationale:

- The model defines the language of the system and must stay pure and portable.

---

### 3.2 `src/core/pipeline/`

May import:

- `src/core/model/*`
- `src/core/registries/*`

Must NOT import:

- `features/*`
- `adapters/*`
- `ui/*`
- Obsidian or DOM APIs

Rationale:

- The pipeline orchestrates steps but must not know about concrete implementations
  or the environment.

---

### 3.3 `src/core/registries/`

May import:

- `src/core/model/*`

May be imported by:

- `src/core/pipeline/*`
- `src/features/*`
- Entry points during registration

Must NOT import:

- `features/*`
- `adapters/*`
- `ui/*`

Rationale:

- Registries define extension seams and must not depend on any specific extensions.

---

### 3.4 `src/features/*`

May import:

- `src/core/model/*`
- `src/core/registries/*`

Must NOT import:

- `src/core/pipeline/*`
- `ui/*`
- `adapters/*` (except through clearly defined, narrow interfaces if ever needed)

Rationale:

- Features provide concrete implementations and register themselves, but do not control
  orchestration or rendering.

---

### 3.5 `src/adapters/*`

May import:

- `src/core/model/*`
- `src/core/pipeline/*`
- `src/core/registries/*` (for registration or wiring)
- Environment APIs (Obsidian, filesystem, time, etc.)

Must NOT import:

- `ui/*` (except through explicit, narrow UI hooks if introduced later)

Rationale:

- Adapters are the boundary with the outside world and may depend on the core.
- They are responsible for collection, normalization, and patch application, but should
  not entangle UI and environment concerns by default.

---

### 3.6 `src/ui/*`

May import:

- `src/core/model/*` (UI-facing contracts only)
- `src/entry/*` (if needed for wiring helpers)

Must NOT import:

- `src/core/pipeline/*`
- `src/core/registries/*`
- `src/features/*`
- `src/adapters/*`

Rationale:

- The UI is a pure consumer of `RecommendationFeed` and related contracts.
- It must not re-run or re-interpret core decisions.

---

### 3.7 `src/entry/*` and `plugin.ts`

May import:

- `src/core/*`
- `src/adapters/*`
- `src/ui/*`
- `src/features/*` (for registration and wiring)

Rationale:

- Entry points are the composition root. They are allowed to see the whole system.

---

## 4) Special rules for tests

All tests live under the top-level `tests/` directory and are categorized by intent:

- `tests/unit/`
- `tests/contract/`
- `tests/scenario/`
- `tests/fixtures/`
- `tests/builders/`

These categories correspond to the T0/T1/T2 testing track in the roadmap.

### 4.1 Unit tests (`tests/unit/`)

- Unit tests follow **exactly the same import rules** as the layer they test.
- Examples:
  - Core model unit tests import only `src/core/model/*`.
  - Pipeline unit tests import `src/core/model/*` and `src/core/pipeline/*`, but not adapters or UI.
  - UI unit tests import `src/ui/*` and UI-facing core contracts, but not the pipeline.

Rationale:

- Unit tests protect local behavior and must not bypass the architecture.

### 4.2 Contract tests (`tests/contract/`)

Contract tests protect **public cross-layer contracts** (for example, the shape of
`RecommendationFeed` produced by the pipeline and consumed by the UI).

Rules:

- They may cross layers **only via public entrypoints**.
- They must not reach into private internals of a layer.
- They must not import adapters or environment-specific code unless that is the
  explicit subject of the test.

Rationale:

- Contract tests protect integration points without turning tests into an
  architecture bypass.

### 4.3 Scenario tests (`tests/scenario/`)

- Scenario tests may exercise **larger slices** of the system.
- They should still prefer public entrypoints and stable contracts.
- They must not import adapters or environment code unless the scenario is
  explicitly about that adapter or environment boundary.

Rationale:

- Scenario tests exist to protect workflows, not to blur architectural layers.

### 4.4 Fixtures and builders

- `tests/fixtures/` and `tests/builders/` may import from any layer **only to construct
  test data**, not to exercise behavior directly.
- Production code must never import from `tests/`.

Rationale:

- These folders exist to support tests, not to become shared infrastructure.

---

## 5) Enforcement and discipline

- If a test needs to break these rules, the architecture or this document must be
  updated first.
- If a production file violates these rules, fix the violation before adding features.
- Boundaries are treated as **invariants**, not as suggestions.
