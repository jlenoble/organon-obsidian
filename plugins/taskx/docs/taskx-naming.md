# TaskX — Naming Conventions

This document defines the **authoritative naming rules** for the TaskX codebase.
All new files, types, identifiers, and features must follow these conventions.
If a conflict appears, **this document wins** unless explicitly updated.

The goals are:

- Predictability (you can guess names from roles),
- Grep-ability (names encode intent),
- Extensibility (new features don’t force renames),
- Stability (public/internal IDs don’t churn).

---

## 1) Case conventions

### 1.1 Filenames and folders

- Use **kebab-case** for folders and files.
  - ✅ `missing-duration/`
  - ✅ `stage-recommend.ts`
  - ❌ `MissingDuration/`
  - ❌ `stageRecommend.ts`

- Folder names that represent **features** or **IDs** must match the **stable ID** exactly.
  - Example: `features/issues/missing-duration/`

### 1.2 TypeScript symbols

- **Types / Interfaces / Classes**: `PascalCase`
  - `TaskEntity`, `TaskFactsIndex`, `RecommendationFeed`
- **Functions / variables**: `camelCase`
  - `stageRecommend`, `buildFactsIndex`
- **Constants**:
  - `SCREAMING_SNAKE_CASE` for true constants
  - `camelCase` for regular values

---

## 2) ID conventions (critical)

TaskX uses **string IDs with branded types** for safety and extensibility.

### 2.1 General rules

- All **stable IDs** are **kebab-case strings**.
  - Examples: `missing-duration`, `decompose-task`, `shape-day`
- Composite IDs may use `:` as a namespace delimiter.
  - Examples:
    - `missing-duration:task-123`
    - `fixcand:missing-duration:task-123:fix:set-duration-15m`

- **Never** use spaces or camelCase in stable IDs.

### 2.2 ID types

- `TaskId`
  Identifies a concrete task instance in the pipeline.

- `IssueId`
  Identifies a concrete issue instance.
  Typical shape:
  - `<issue-kind>:<taskId>`
  - or `<issue-kind>:global`

- `FixId` (**recipe ID**)
  Identifies a **shared fix option** (a “recipe”), reused across tasks.
  Examples:
  - `fix:set-duration-15m`
  - `fix:add-tag:b5`

  Collisions are **intentional**: the same recipe can apply to many tasks.

- `FixCandidateId` (**instance ID**)
  Identifies a **concrete fix suggestion instance** in the feed.
  Must be unique per rendered item.
  Typical shape:
  - `fixcand:<issueId>:<fixId>`

- `RecommendationId`
  Identifies a recommendation item in the feed.
  Typical shape:
  - `rec:fix:<issueId>`
  - `rec:do-now:shallow`

---

## 3) Feature naming

### 3.1 Issues

- Each issue kind has a **stable kebab-case ID**.
  - Examples:
    - `missing-duration`
    - `inconsistent-dates`
    - `depends-cycle`

- Folder name **must equal** the issue ID:
  - `features/issues/missing-duration/`

- Detectors should use IDs like:
  - `missing-duration:<taskId>`

### 3.2 Wizards

- Each wizard has a **stable kebab-case ID**.
  - Examples:
    - `decompose-task`
    - `shape-day`

- Folder name **must equal** the wizard ID:
  - `features/wizards/decompose-task/`

### 3.3 Scorers / policies / planners

- Same rule: stable kebab-case IDs.
  - Example: `default-payoff-friction`, `gain-pressure-friction`

---

## 4) File naming by role

### 4.1 Core model

- Location: `src/core/model/`
- Filenames are **nouns**:
  - `task.ts`
  - `facts.ts`
  - `issue.ts`
  - `fix.ts`
  - `recommendation.ts`
  - `time.ts`

### 4.2 Pipeline stages

- Location: `src/core/pipeline/`
- Filenames are **verbs or stage names**:
  - `stage-collect.ts`
  - `stage-analyze.ts`
  - `stage-issues.ts`
  - `stage-recommend.ts`
  - `stage-rank.ts`

- Exported function name mirrors file:
  - `stageCollect`, `stageAnalyze`, etc.

### 4.3 Registries

- Location: `src/core/registries/`
- Filenames describe **what is being registered**:
  - `issue-detectors.ts`
  - `wizards.ts`
  - `scorers.ts`

---

## 5) Recommendation kinds (UI contract)

`RecommendationKind` is a **closed set** and uses **kebab-case strings**:

- `fix`
- `do-now`
- (later) `wizard`
- (later) `plan`

These strings are part of the UI contract and must not be renamed casually.

---

## 6) Test directories and file naming

Tests follow the same naming rules as production files, with an explicit suffix.

All tests live under a top-level `tests/` directory.

### 6.1 Canonical test folders

- `tests/unit/`
  Unit tests for a single file or module.

- `tests/contract/`
  Contract tests that protect **public cross-layer contracts**.

- `tests/scenario/`
  Scenario or integration tests for larger workflows (primarily T2).

- `tests/fixtures/`
  Static test data (markdown snippets, serialized tasks, example feeds).

- `tests/builders/`
  Code helpers to build common test objects (`TaskEntity`, `TimeContext`,
  `RecommendationFeed`, etc.).

Folder names are **semantic** and must not be repurposed.

### 6.2 Test file suffixes

Test filenames may include **two independent qualifiers**:

- A **role qualifier** (what kind of test this is):
  - `.contract` for contract tests
  - (absence means a regular unit-style test)

- An **environment qualifier** (where it runs):
  - `.node` for node environment tests
  - `.dom` for DOM / jsdom environment tests

The base suffix is always:

- `*.test.ts`

When qualifiers are used, the **ordering rule** is:

> `<name>[.<role>][.<env>].test.ts`

Role and environment qualifiers are **orthogonal**. Neither is more important
than the other, and either may appear alone or together.

Examples:

- Unit test, node:
  - `facts-index.node.test.ts`

- Contract test, default environment:
  - `pipeline-feed.contract.test.ts`

- Contract test, DOM:
  - `render-feed.contract.dom.test.ts`

- Unit test, DOM:
  - `render-feed.dom.test.ts`

### 6.3 Relationship to production files

- Test filenames should **mirror the role** of the production code they protect.
- Prefer:
  - `stage-rank.ts` → `stage-rank.test.ts`
  - `render-feed.ts` → `render-feed.dom.test.ts`
- Avoid opaque names like:
  - `test1.ts`, `misc.test.ts`, `pipeline-tests.ts`

The goal is that a test file name answers: **what behavior or contract is being protected?**

---

## 7) Tags and semantics

- Tags in notes are **user data**, not stable API.
- Core logic should prefer **facts** over raw tags whenever possible.
- When tags are used in logic:
  - Normalize them at the adapter boundary.
  - Never hardcode “magic tags” in the core without routing through a policy/lexicon.

---

## 8) Golden rules

1. **Folder name = feature ID** (always).
2. **Stable IDs are kebab-case strings**.
3. **Instance IDs are composite and unique**.
4. **Types are PascalCase, values are camelCase**.
5. **Tests live under `tests/` and use semantic subfolders.**
6. **Test files use `.test.ts` with optional role and env qualifiers.**
7. **Do not invent new casing or separators**.

If a new feature does not fit these rules, the feature must adapt — not the naming system.
