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

- Folder names that represent **features** or **stable IDs** must match the **stable ID** exactly.
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

## 5) Feed contract naming (kinds and sections)

### 5.1 Recommendation kinds (UI contract)

`RecommendationKind` is a **closed set** and uses **kebab-case strings**:

- `fix`
- `do-now`
- (later) `wizard`
- (later) `plan`

These strings are part of the UI contract and must not be renamed casually.

### 5.2 Feed sections (UI contract)

`RecommendationFeed` groups recommendations into **semantic sections**. Section identifiers must:

- be **kebab-case stable strings**,
- be treated as part of the UI contract once emitted,
- not be encoded in CSS classnames in a way that makes renames painful.

Examples of stable section ids used or planned by the roadmap:

- `collected`
- `do-now`
- `attention`
- `can-do-now`
- `needs-cleanup`

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

Examples (matching current repository usage):

- Unit test, default environment:
  - `id.test.ts`

- Unit test, DOM:
  - `render-feed.dom.test.ts`

- Contract test, default environment:
  - `pipeline.contract.test.ts`

- Contract test, DOM:
  - `render.contract.dom.test.ts`
  - `feed-provenance.contract.dom.test.ts`

### 6.3 Relationship to production files

Tests must **mirror the production directory tree** so navigation is mechanical.

Base rule:

> Replace the `src/` prefix with `tests/<kind>/` and keep the rest of the path identical.

Where `<kind>` is one of: `unit`, `contract`, or `scenario`.

#### 6.3.1 Single-file test (default)

For a production file:

- `src/<path>/<name>.ts`

The default location is:

- `tests/<kind>/<path>/<name>[.<role>][.<env>].test.ts`

Examples:

- `src/core/model/id.ts`
  → `tests/unit/core/model/id.test.ts`

- `src/core/pipeline/pipeline.ts`
  → `tests/contract/core/pipeline/pipeline.contract.test.ts`

- `src/ui/feed/render-feed.ts`
  → `tests/unit/ui/feed/render-feed.dom.test.ts`

#### 6.3.2 Per-file test folder (allowed for splitting by intent)

When tests for a single production file become large or need multiple “intent”
slices, we may represent the production file as a **folder** in the test tree.

Rule:

> Replace `<name>.ts` with `<name>/` and place one or more `*.test.ts` files inside.

So:

- `src/<path>/<name>.ts`
  → `tests/<kind>/<path>/<name>/*.test.ts`

Constraints:

- The folder name must equal the production file name **without** extension:
  - `render-feed.ts` → `render-feed/`
- Test filenames inside the folder must remain **intent-based**, not path-based.
- Qualifiers still follow the same ordering rule:
  - `<intent>[.<role>][.<env>].test.ts`
- We do not duplicate the mirrored path inside the filename.

Examples:

- `src/ui/feed/render-feed.ts`
  → `tests/contract/ui/feed/render-feed/feed-provenance.contract.dom.test.ts`
  → `tests/contract/ui/feed/render-feed/feed-empty.contract.dom.test.ts`

- `src/core/pipeline/pipeline.ts`
  → `tests/contract/core/pipeline/pipeline/pipeline-shape.contract.test.ts`

Forbidden:

- ❌ `tests/unit/core-model/id.test.ts` (flattened path)
- ❌ `tests/unit/ui-feed/render-feed.dom.test.ts` (flattened path)
- ❌ `tests/unit/render-feed.dom.test.ts` (lost hierarchy)
- ❌ `tests/contract/ui/feed/render-feed-provenance.contract.dom.test.ts`
  (encodes hierarchy into filename instead of using folders)

Rationale:

- The test tree must reflect the architecture tree.
- Splitting by intent should not force lossy naming or path-encoding filenames.
- The “per-file folder” is a controlled escape hatch that preserves mechanical
  navigation while allowing multiple focused tests for one production file.

The only differences between production and tests are:

- the root (`src/` → `tests/<kind>/`), and
- either:
  - the filename suffix (`.ts` → `.test.ts`, with optional qualifiers), **or**
  - the filename becomes a folder (`<name>.ts` → `<name>/`) containing one or
    more `*.test.ts` files.

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
