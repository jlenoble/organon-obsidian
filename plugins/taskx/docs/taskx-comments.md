# TaskX — Comment & Documentation Style

This document defines the **authoritative commenting style** for the TaskX codebase.
All new files and changes must follow these conventions.

The purpose of these rules is simple: make the code understandable to a future you
(or a future teammate) without having to reconstruct the architecture from scratch.
Comments are part of the design, not decoration.

Goals:

- Make intent and boundaries explicit.
- Preserve architectural decisions in the code itself.
- Keep comments useful, stable, and low-noise.
- Avoid restating what TypeScript already says.

Tone:

- Use a **collective, neutral voice**: “we”, “the system”, “this layer”.
- Do not address a person directly.
- Prefer short, clear sentences.
- Prefer intent and invariants over implementation trivia.
- Prefer **plain English first**, then structured clarifications if needed.

The preambles in `src/core/model/*.ts` are the **reference style** for tone:
narrative, architectural, and focused on why a file exists and what it guarantees.

---

## 1) File preamble (mandatory for all non-trivial files)

Every non-trivial file must start with a block comment.

### 1.1 Path line (mandatory)

The first line of the preamble must be the file path **relative to `src/`**, and must **not**
include the `src/` prefix.

Example:

```ts
/**
 * core/pipeline/stage-rank.ts
 *
 * ...
 */
```

### 1.2 Content and structure

A file preamble should first **explain itself in plain English**.

A reader should be able to understand, after a few sentences:

- What role this file plays in the architecture,
- Why it exists,
- What boundary or responsibility it establishes,
- What kind of problems it is meant to solve or avoid.

After this narrative introduction, it is **allowed and encouraged** to add
short, labeled bullet sections to make things precise.

For example:

- `Intent:`
- `Goals:`
- `Limits:`
- `Non-goals:`
- `Caveats:`
- `Invariants:`

These bullet sections exist to **clarify** the text, not to replace it.
They should never be the only content of the preamble.

Guidelines:

- Start with a short explanatory text in full sentences.
- Keep sentences simple and direct.
- Use bullet lists only after the intent is clear.
- Keep the focus **architectural**, not historical.
- Prefer **stable intent** over current implementation details.
- If a file is truly trivial, the preamble may be shorter, but it must still exist.

### 1.3 Anti-patterns (avoid)

Do **not** write file preambles as:

- A pure bullet list with no narrative introduction,
- A spec sheet with only section headers and checklists,
- A restatement of the roadmap or folder structure,
- API documentation for the contents of the file,
- A history log (“we used to…”, “this was added because…”).

The goal is to **make sense first**, then **make things precise**.

---

## 2) JSDoc for exported types, interfaces, and functions

### 2.1 What to document

Add JSDoc when a symbol:

- Represents a **domain concept** (e.g., TaskEntity, Issue, Recommendation).
- Is part of a **public or internal contract** between layers.
- Has **invariants, expectations, or non-obvious semantics**.
- Marks an **architectural seam** (pipeline stage, registry, adapter boundary).

Do NOT:

- Restate TypeScript types in prose.
- Document obvious getters/setters or trivial passthroughs.
- Explain syntax instead of intent.

### 2.2 Style guidelines

- Use full sentences.
- Keep sentences short and concrete.
- Explain:
  - What this represents,
  - Why it exists,
  - What it guarantees,
  - What it deliberately does not cover (if relevant).

You may use short labeled sections such as:

- `Notes:`
- `Invariants:`
- `Rationale:`
- `Limits:`

Use them to clarify, not to replace the explanation.

### 2.3 Example

```ts
/**
 * A RecommendationFeed is the structured, UI-ready output of the pipeline.
 *
 * It represents the final decision of the core about what should be shown to the user.
 * The UI is expected to render this as-is, without reinterpreting it.
 *
 * Invariants:
 * - Sections are already ordered.
 * - Items inside each section are already ordered.
 * - The UI must not re-rank or reinterpret this structure.
 *
 * Rationale:
 * - This keeps all decision policy in the core pipeline and makes rendering
 *   a pure view concern.
 */
export interface RecommendationFeed {
	sections: Array<{
		title: string;
		items: Recommendation[];
	}>;
}
```

---

## 3) Function documentation

Document functions when they:

- Are part of the **pipeline** or **registry**.
- Implement a **policy or transformation step**.
- Hide non-trivial decisions or invariants.

Structure:

- Start with 1–2 sentences that explain what the function does and why it exists.
- Then, if useful, add a small labeled bullet section.

Template:

```ts
/**
 * <Short explanation of what this function does and why it exists.>
 *
 * Notes:
 * - <Purity / side effects expectations.>
 * - <What this function assumes about its inputs.>
 * - <What it deliberately does not handle.>
 */
```

Example:

```ts
/**
 * Group and order recommendations into a feed structure for rendering.
 *
 * This is the place where presentation order becomes a core decision, not a UI concern.
 *
 * Notes:
 * - This function is pure and must not mutate its inputs.
 * - All grouping and ordering policy lives here, not in the UI.
 * - The UI must treat the returned structure as authoritative.
 */
export function stageRank(recs: Recommendation[]): RecommendationFeed {
	// ...
}
```

---

## 4) Inline comments

Use inline comments **sparingly** and only to explain:

- Why something is done a certain way,
- A non-obvious constraint or workaround,
- A subtle invariant or ordering dependency.

Avoid:

- Commenting every line.
- Restating the code in English.
- Explaining “what” when the code already shows it clearly.

Good example:

```ts
// We keep registration order to make detector interactions debuggable and predictable.
const registry: IssueDetector[] = [];
```

Bad example:

```ts
// Push the detector into the array.
registry.push(detector);
```

---

## 5) What comments must NOT do

- Do not describe **temporary states** or TODOs as architecture.
- Do not explain **history** (“we used to…”).
- Do not encode **UI instructions** in core logic comments.
- Do not duplicate information that belongs in `docs/taskx-roadmap.md` or `docs/taskx-naming.md`.

---

## 6) Consistency rules

1. Every non-trivial file has a preamble.
2. The preamble starts with the **path relative to `src/`**, without the `src/` prefix.
3. The preamble starts with **plain English explanation** before any bullet lists.
4. Any bullet list must be under a **labeled section** (Intent, Goals, Limits, Non-goals, etc.).
5. Every domain-level type has a JSDoc explaining intent and invariants.
6. Pipeline stages and registries always document purity and responsibility.
7. Inline comments justify **why**, not **what**.
8. If a comment becomes false, **fix or remove it immediately**.
