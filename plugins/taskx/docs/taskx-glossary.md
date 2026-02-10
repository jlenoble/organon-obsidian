# TaskX — Glossary

This glossary defines the **canonical meaning** of key terms used in the TaskX codebase
and documentation.

Its goals are:

- Prevent semantic drift over time,
- Ensure consistent usage across code, docs, and discussions,
- Make architectural and domain concepts easier to reason about and communicate.

If a term is used in the codebase with a different meaning than what is written here,
**either the code or this document must be updated** to restore consistency.

---

## Index

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · H · [I](#i) · J · K · L · M ·
N · O · [P](#p) · Q · [R](#r) · [S](#s) · [T](#t) · U · V · [W](#w) · X · Y · Z

---

## A

### Adapter

Code under `src/adapters/` that bridges the environment (Obsidian, filesystem, time, etc.)
to the core pipeline and model.

Adapters:

- Collect external data and normalize it into core models,
- Apply changes (patches) back to the environment,
- Must not contain core decision logic.

---

## B

### Block (informal)

A contiguous slice of time or attention used for planning or execution.

Note:

- In TaskX, blocks are not hard scheduling primitives.
- They are conceptual units used by planning and recommendation logic.
- The formalized concept for recurring or structural blocks is **Superblock**.

---

## C

### Core Model

The set of types under `src/core/model/` that define the language of the system:
tasks, facts, issues, fixes, recommendations, and time.

Characteristics:

- Pure and environment-agnostic,
- Contains no UI, Obsidian, or storage logic,
- Defines stable contracts between layers.

---

## D

### Domain Contract

A type or interface in the core model that defines the meaning and structure of a concept
(e.g., TaskEntity, Issue, Recommendation).

Domain contracts:

- Are stable over time,
- Are shared across pipeline, features, and UI,
- Encode intent and invariants, not implementation details.

---

## E

### Entry Point

Code that wires together adapters, registries, pipeline, and UI (e.g., `plugin.ts`, `src/entry/*`).

Responsibilities:

- Perform registration of features,
- Build environment-specific contexts,
- Trigger pipeline execution and rendering.

---

## F

### FixAction

An atomic, domain-level intent to change the world.

Examples:

- Set a duration,
- Add a tag,
- Create a dependency,
- Spawn a template.

Important:

- A FixAction describes _what_ should change, not _how_ files are edited.

---

### FixCandidate

A user-facing bundle of one or more FixAction objects.

Represents:

- “One coherent way to resolve an issue”.

Characteristics:

- Has a unique instance identity (FixCandidateId),
- References a shared recipe identity (FixId),
- Carries metadata such as confidence and impact.

---

### FixCandidateId (fix instance ID)

A stable identifier for a **concrete fix suggestion instance** in a feed.

Characteristics:

- Must be unique per rendered candidate,
- Typically composed from issue ID and fix recipe ID,
- Used by the UI and action routing.

---

### FixId (fix recipe ID)

A stable identifier for a **kind of fix option** (a recipe), reused across tasks and issues.

Examples:

- `fix:set-duration-15m`
- `fix:add-tag:b5`

Characteristics:

- Collisions are intentional and desirable,
- Identifies the type of fix, not a specific instance.

---

## G

### Glossary

This document.

It is normative:

- If a concept is used in code, it should appear here.
- If a concept’s meaning changes, this document must be updated.

---

## I

### Issue

A structured report of a problem, inconsistency, or missing information that blocks or degrades progress.

Represents:

- “What is wrong or missing”.

Characteristics:

- Targets a specific task (or, rarely, a global condition),
- Carries evidence,
- May propose FixCandidates.

---

### IssueDetector

A feature-provided component that analyzes tasks and facts to produce Issue objects.

Characteristics:

- Pure (no side effects),
- Registered via a registry,
- Does not apply fixes or perform UI actions.

---

## P

### Pipeline

The sequence of pure orchestration stages that transforms:

`TaskEntity[] → TaskFacts → Issue[] → Recommendation[] → RecommendationFeed`

Characteristics:

- Deterministic,
- Composed of single-responsibility stages,
- Free of UI and environment-specific logic.

---

### Stage

A single step in the pipeline that transforms data from one representation to another.

Examples:

- Collection stage,
- Analysis stage,
- Issue detection stage,
- Recommendation compilation stage,
- Ranking/grouping stage.

---

## R

### Recommendation

A UI-facing suggestion derived from issues and facts.

Represents:

- “What to do now”.

Kinds may include:

- Applying fixes,
- Executing tasks,
- Launching a wizard,
- Planning or shaping time.

---

### RecommendationFeed

The structured, ordered output of the pipeline intended for rendering.

Characteristics:

- Grouped into semantic sections,
- Already ordered by core policy,
- Treated as authoritative by the UI (no re-ranking or re-grouping in views).

---

### Registry

A controlled extension point where features register implementations
(detectors, wizards, scorers, templates, etc.).

Characteristics:

- The pipeline depends only on registries, not on concrete features,
- Enables extensibility by addition rather than modification.

---

## S

### Superblock

A recurring or structural availability envelope representing when certain kinds of work
are allowed or encouraged (e.g., shallow work windows, admin time, deep work blocks).

Used for:

- Planning and recommendation shaping,
- Not as a hard schedule, but as a guiding constraint.

---

## T

### TaskEntity

The canonical, tool-agnostic representation of a task as observed from notes.

Represents:

- “What the world is” at the time of collection.

Does not represent:

- Planning decisions,
- Priorities,
- Execution strategy.

---

### TaskFacts / TaskFactsIndex

Derived, computed observations about tasks.

Represents:

- “What we can infer” from the current state of tasks (e.g., executability, missing data, leaf-ness).

Characteristics:

- Purely derived from TaskEntity and other explicit inputs,
- Do not mutate tasks,
- Do not prescribe actions.

---

### TaskOrigin

Metadata describing where a task comes from in the vault (path, line, etc.).

Used for:

- Diagnostics,
- UI provenance,
- Patch application back to source files.

---

### Template

A reusable blueprint for creating or decomposing tasks into a canonical structure.

Used to:

- Standardize recurring task patterns,
- Accelerate consistent decomposition and setup.

---

### TimeContext

The explicit representation of “now” and related temporal context for a pipeline run.

Used to:

- Make time-dependent reasoning deterministic and testable,
- Avoid reading global clocks inside core logic.

---

## W

### Wizard

An interactive, multi-step resolution flow used when a problem cannot be solved
by a single simple fix (e.g., task decomposition, day shaping, complex planning).

Produces:

- One or more FixCandidates on completion.

---

## Notes

- This glossary is normative.
- If a new concept is introduced, it should be added here.
- If an existing term changes meaning, both the code and this document must be updated together.
