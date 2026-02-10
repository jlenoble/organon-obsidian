# TaskX — Import and Layer Boundaries

This document defines the **allowed dependency directions** inside the TaskX codebase.

Its goals are:

- Preserve a clean, understandable architecture over time.
- Prevent accidental coupling between layers.
- Make refactors and extensions predictable and low-risk.
- Keep the core domain independent from UI and environment details.

These rules apply to **all contributors** and to all new code.

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

5. **Adapters** — `src/adapters/`
   Bridges to Obsidian, Dataview, Tasks plugin, filesystem, time, etc.

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
   ranking, grouping, or planning policy.

4. **Features plug into registries, not into the pipeline directly**
   The pipeline only knows about registries, never about concrete feature modules.

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

- Features provide implementations and register themselves, but do not control
  orchestration or rendering.
