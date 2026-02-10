# TaskX — Commit Message Style

This document defines the **authoritative commit message conventions** for the TaskX codebase.

Goals:

- Make history readable and reviewable.
- Make intent and scope obvious from the log.
- Avoid noise and filler text.
- Keep a clean signal between features, refactors, fixes, and docs.

---

## 1) Prefixes and scope

All commits must start with one of the following prefixes:

- `✨ feat(taskx):`
  For introducing a new capability, a new architectural piece, or a new file that adds behavior.

- `♻️ refactor(taskx):`
  For restructuring, renaming, moving files, or changing internal structure **without changing behavior**.

- `🐛 fix(taskx):`
  For correcting a bug or unintended behavior.

- `📝 docs(taskx):`
  For documentation only (README, docs/, comments style, naming rules, etc.).

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

Examples:

- `✨ feat(taskx): add stage_rank to group recommendations into a feed`
- `♻️ refactor(taskx): move core model files into core/model directory`
- `🐛 fix(taskx): handle empty task list in stage_recommend`
- `📝 docs(taskx): add authoritative naming conventions for TaskX`

---

## 3) Body (when and how to write it)

### 3.1 When a body is required

Add a body when:

- The change is architectural or structural.
- The intent is not obvious from the subject line.
- There are important **boundaries, invariants, or non-goals** to record.
- Future readers might ask “why was this done this way?”.

A body is **optional** when:

- The change is trivial and self-explanatory.
- The subject line fully captures the intent and impact.

### 3.2 Body style rules

- Use **short paragraphs or bullet points**.
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

No advanced scoring or planning policy is introduced here yet; the initial
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

**Docs (short, no body required, unless large documentation piece):**

```

📝 docs(taskx): fix typos in taskx-naming.md

```

**Fix (short body):**

```

🐛 fix(taskx): avoid crash when no executable tasks are found

Handle the empty case explicitly in stage_recommend to prevent undefined access
when building the do-now recommendation.

```

---

## 4) What commit messages should NOT do

- Do not include implementation details better suited for code comments.
- Do not include TODO lists or future plans.
- Do not mix multiple unrelated changes in one commit.
- Do not use vague summaries like “cleanup”, “misc”, “wip”.

---

## 5) Golden rules

1. The **prefix** communicates the nature of the change.
2. The **subject** says _what_ changed.
3. The **body** (if present) explains _why_ and _what boundaries exist_.
4. Brevity beats verbosity when intent is obvious.
5. If a future you would ask “why is this like this?”, put that answer in the body.
