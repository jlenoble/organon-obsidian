# TaskX — Commit Message Style

This document defines the **authoritative commit message conventions** for the TaskX codebase.

Goals:

- Make history readable and reviewable.
- Make intent and scope obvious from the log.
- Avoid noise and filler text.
- Keep a clean signal between features, refactors, fixes, tests, and docs.
- Keep roadmap progress legible (M* product milestones vs T* testing milestones) without
  encoding milestone ids in subject lines.

General formatting rules:

- Hard limit: wrap all lines at **100 characters maximum**.
- Safety target: aim for **80 characters maximum** to avoid accidental overflow.
- Prefer short, readable lines over dense paragraphs.
- Use blank lines to separate logical blocks.

---

## 1) Prefixes and scope

All commits must start with one of the following prefixes:

- `✨ feat(taskx):`
  For introducing a new capability, a new architectural piece, or a new file that adds behavior.

- `♻️ refactor(taskx):`
  For restructuring, renaming, moving files, or changing internal structure **without changing
  behavior**.

- `🐛 fix(taskx):`
  For correcting a bug or unintended behavior.

- `🧪 test(taskx):`
  For tests only:
  - new tests,
  - test refactors,
  - test harness wiring,
  - fixtures and builders used only by tests,
  - test runner configuration when its purpose is exclusively testing.

- `📝 docs(taskx):`
  For documentation only (README, docs/, comment style, naming rules, etc.).

- `👷 build(taskx):`
  For changes that affect **what users install or what Obsidian loads**.

  Use this when a change can alter the **built plugin output**:
  - bundling and build pipeline (Vite, tsconfig build options),
  - emitted files and their layout (dist/, dist-types/),
  - module format, targets, minification,
  - manifest handling, version injection, packaging scripts,
  - CI steps that build the plugin package.

  Plain test:

  > If I rebuild the plugin after this commit, could the output files differ?

  If **yes**, this is `👷 build(taskx):`.

- `🔧 chore(taskx):`
  For changes that affect **only developer workflow** and **cannot** change what users get.

  Use this for:
  - linting and formatting (ESLint, Prettier),
  - editor tooling and repo scripts,
  - git hooks and repo hygiene,
  - dependency maintenance that does not change runtime or build output,
  - CI checks that only lint or test and do not build the plugin.

  Plain test:

  > If I rebuild the plugin after this commit, will the output be identical?

  If **yes**, this is `🔧 chore(taskx):`.

Hard boundary rules:

- If a change can affect **what ends up in the built plugin**, it is `👷 build(taskx):`.
- If a change affects **only how developers work** and not the built plugin, it is
  `🔧 chore(taskx):`.
- If a change is **exclusively about tests**, it is `🧪 test(taskx):`.
- If a change is **exclusively about documentation**, it is `📝 docs(taskx):`.

The `(taskx)` scope is mandatory and fixed for this repository.

---

## 2) Subject line

Format:

```

<prefix> <short summary in imperative mood>

```

Rules:

- Use **imperative mood**: “add”, “introduce”, “rename”, “fix”, “remove”.
- Keep it **short and specific**.
- Do not end with a period.
- Describe **what changes**, not why.
- Hard limit: keep the subject line **under 80 characters**.
- Safety target: keep the subject line **under 60 characters**.
- Do not encode roadmap ids (M1.3, T1.2, etc.) in the subject line.

Examples:

- `✨ feat(taskx): add stage_rank to group recommendations into a feed`
- `♻️ refactor(taskx): move core model files into core/model directory`
- `🐛 fix(taskx): handle empty task list in stage_recommend`
- `🧪 test(taskx): add contract tests for pipeline feed shape`
- `📝 docs(taskx): add authoritative naming conventions for TaskX`
- `👷 build(taskx): update vite config to change output format`
- `🔧 chore(taskx): update eslint config for test TypeScript parsing`

---

## 3) Body (when and how to write it)

### 3.1 Body is mandatory

Every commit message must include a body.

Rationale:

- Preserve explicit intent and boundaries in history.
- Keep decisions auditable even for small changes.
- Avoid ambiguous one-line commits.

### 3.2 Body style rules

- Hard limit: wrap all lines at **100 characters maximum**.
- Safety target: aim for **80 characters maximum** per line.
- Prefer short sentences in plain English.
- Avoid over-coordination and packed paragraphs.
- Make each unrelated point plainly distinguishable from others
  (separate sentence, bullet, or paragraph).
- Do **not** pad with text just to reach a certain length.
- Prefer:
  - what was introduced or changed,
  - why this boundary or decision exists,
  - what this deliberately does **not** do (if relevant).
- Avoid:
  - restating the subject line in different words,
  - implementation trivia,
  - vague statements like “clean up code”.

### 3.3 Examples

**Feature (with body):**

```

✨ feat(taskx): add stage_rank to group recommendations into a feed

Introduce the stage_rank pipeline stage to convert a flat list of Recommendation
objects into a structured RecommendationFeed with semantic sections. This
centralizes presentation grouping and ordering policy in the pipeline instead
of the UI.

No advanced scoring or planning policy is introduced here yet. The initial
implementation is intentionally simple and deterministic.

```

**Refactor (with body):**

```

♻️ refactor(taskx): align pipeline and registry filenames with naming conventions

Rename files to kebab-case to match the authoritative naming scheme and remove
the previous mix of snake_case and camelCase. This makes paths predictable and
reduces long-term churn around imports and documentation.

This is a structural change only and does not modify runtime behavior.

```

**Docs (with body):**

```

📝 docs(taskx): fix typos in taskx-naming.md

Fix spelling and wording errors to improve readability.
No meaning or policy changes.

```

**Tests (short body):**

```

🧪 test(taskx): add pipeline feed contract test

Snapshot the RecommendationFeed shape to catch accidental grouping or ordering
changes during refactors.

```

**Fix (short body):**

```

🐛 fix(taskx): avoid crash when no executable tasks are found

Handle the empty case explicitly in stage_recommend to prevent undefined access
when building the do-now recommendation.

```

**Build (with body):**

```

👷 build(taskx): adjust build output directory

Change output directory configuration in the build pipeline.
This affects emitted artifact paths only.

```

**Chore (with body):**

```

🔧 chore(taskx): update prettier config

Update formatting rules for repository consistency.
No runtime or build-output behavior changes.

```

### 3.4 Roadmap context (M* / T* milestones)

TaskX progress is tracked along two orthogonal tracks:

- **M\*** milestones: product/capability evolution
- **T\*** milestones: test infrastructure and coverage

Commit messages should **not** include milestone ids in the subject line.
However, the body may mention milestone context when it improves future readability.

Guidelines:

- Prefer short, factual phrasing:
  - “This implements M1.3 …”
  - “This contributes to T1.2 …”
- Keep the reference tied to **what this commit actually does**.
- Use milestone context to clarify **scope** and **non-goals**, not to plan future work.

Example:

```

This implements M1.3:

- Adds the first issue detector (missing-duration).
- Registers it at plugin startup.

This also contributes to T1:

- Adds a unit test for the detector.

This does not yet introduce patch application (planned for M1.6).

```

---

## 4) What commit messages should NOT do

- Do not include implementation details better suited for code comments.
- Do not include TODO lists or speculative future plans.

  Milestone context and explicit non-goals are allowed when they describe the
  boundaries of the current change (see 3.4), but the commit message must not
  become a planning document.

- Do not mix multiple unrelated changes in one commit.
- Do not use vague summaries like “cleanup”, “misc”, “wip”.

---

## 5) Golden rules

1. The **prefix** communicates the nature of the change.
2. The **subject** says _what_ changed.
3. The **body** (if present) explains _why_ and _what boundaries exist_.
4. Brevity beats verbosity when intent is obvious.
5. If a future you would ask “why is this like this?”, put that answer in the body.
6. Hard limit is **100 chars** per line; safety target is **80 chars**.
