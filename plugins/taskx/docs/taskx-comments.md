# TaskX — Comment & Documentation Style

This document defines the **authoritative commenting style** for the TaskX codebase.
All new files and changes must follow these conventions.

Goals:

- Make intent and boundaries explicit.
- Preserve architectural decisions in the code itself.
- Keep comments useful, stable, and low-noise.
- Avoid restating what TypeScript already says.

Tone:

- Use a **collective, neutral voice**: “we”, “our intent”, “the system”.
- Avoid addressing a person directly.
- Prefer intent and invariants over implementation trivia.

---

## 1) File preamble (mandatory for all non-trivial files)

Every file must start with a block comment with the following sections:

```ts
/**
 * <path/to/file.ts>
 *
 * What this file is:
 * - <1–2 lines describing the role of this file in the architecture.>
 *
 * Why this exists:
 * - <Explain the architectural boundary or seam this file establishes.>
 * - <Explain what problem it isolates or decouples.>
 *
 * Responsibilities:
 * - <Bullet list of what this file does.>
 * - <Keep this concrete and testable.>
 *
 * Non-goals:
 * - <Bullet list of what this file explicitly does NOT do.>
 * - <Helps prevent scope creep and accidental coupling.>
 *
 * Design notes:
 * - <Optional: invariants, extension points, or future evolution hints.>
 */
```

Guidelines:

- Keep it **architectural**, not historical.
- Prefer **stable intent** over current implementation details.
- If a file is truly trivial, the preamble may be shortened but must still exist.

---

## 2) JSDoc for exported types, interfaces, and functions

### 2.1 What to document

Add JSDoc when a symbol:

- Represents a **domain concept** (e.g., TaskEntity, Issue, Recommendation).
- Is part of a **public/internal contract** between layers.
- Has **invariants, expectations, or non-obvious semantics**.
- Marks an **architectural seam** (pipeline stage, registry, adapter boundary).

Do NOT:

- Restate TypeScript types in prose.
- Document obvious getters/setters or trivial passthroughs.
- Explain syntax instead of intent.

### 2.2 Style guidelines

- Use full sentences.
- Explain:
  - What this represents,
  - Why it exists,
  - What it guarantees,
  - What it deliberately does not cover (if relevant).

- Prefer sections like:
  - “Notes:”
  - “Invariants:”
  - “Rationale:”

### 2.3 Example

```ts
/**
 * A RecommendationFeed is the structured, UI-ready output of the pipeline.
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

Template:

```ts
/**
 * <Short summary of what this function does.>
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
- Do not duplicate information that belongs in docs/taskx-roadmap.md or docs/taskx-naming.md.

---

## 6) Consistency rules

1. Every non-trivial file has a preamble.
2. Every domain-level type has a JSDoc explaining intent and invariants.
3. Pipeline stages and registries always document purity and responsibility.
4. Inline comments justify **why**, not **what**.
5. If a comment becomes false, **fix or remove it immediately**.
