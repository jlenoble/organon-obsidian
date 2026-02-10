# TaskX — Development Process

This document defines the **standard development workflow** for the TaskX codebase.

Its goals are:

- Keep changes reviewable and intentional.
- Preserve architectural coherence over time.
- Avoid scope creep and accidental coupling.
- Make history readable and meaningful.
- Prioritize end-to-end usefulness over feature accumulation.

These rules apply to **all contributors** and to all changes, regardless of size.

---

## 1) Guiding principles

1. **Incremental by default**
   Work is done in small, coherent steps that can be reviewed and understood in isolation.

2. **Architecture before convenience**
   If a change does not fit the current structure, the structure (and the roadmap) must be updated first.

3. **Documentation is part of the change**
   If a change alters responsibilities, boundaries, or structure, the relevant files in `docs/` must be updated in the same commit or in a clearly associated one.

4. **History should explain itself**
   Commit messages are not a formality; they are the primary record of architectural intent.

5. **Throughput beats sophistication**
   The primary short- and mid-term goal is to maximize the number of tasks that can flow
   end-to-end toward completion. Feature richness comes after a working, high-coverage loop exists.

---

## 2) Milestone ordering and priorities

Development follows this high-level progression:

- **M0 — Vertical slice (make it run)**
  Achieve an end-to-end path:
  pipeline → feed → renderer → code block → visible output in Obsidian,
  even if the data is minimal or stubbed.

- **M1 — Coverage ramp (make it useful)**
  Add policy-light facts, detectors, and fixes that:
  - unblock common cases,
  - require minimal strategic choice,
  - increase the proportion of tasks that can reach execution or resolution.

  Examples:
  - missing-duration detection + simple duration fixes,
  - obvious blocking dependencies,
  - simple, mechanical normalizations.

- **M2 — Advanced behavior (make it smart)**
  Introduce policy-heavy or interactive features:
  - templates,
  - superblocks,
  - wizards,
  - sophisticated planning and shaping heuristics.

Rule of thumb:

> Prefer work that increases **end-to-end throughput** over work that increases **feature surface**.

---

## 3) Change granularity

### 3.1 Default rule: one coherent change set

A change should normally focus on:

- One file, or
- One tightly related set of files (e.g., a new feature folder, a pipeline stage plus its registry hook, or a bug fix that requires touching both logic and adapters/UI).

The goal is **coherence**, not artificial restriction.

### 3.2 When multiple files are expected and acceptable

Editing multiple files in a single commit is appropriate when:

- Introducing a new feature that requires:
  - a new model type + a pipeline stage + a registry entry,
- Fixing a bug that spans:
  - a pipeline stage and its caller,
- Renaming or moving files and updating imports,
- Adding a new feature module with its detector + registration glue,
- Updating documentation that must stay consistent with the code change.

In short: **if the files are inextricably related, they belong together**.

### 3.3 What should not be mixed

Avoid mixing in the same commit:

- Unrelated refactors,
- Formatting-only changes with logic changes,
- Two independent features,
- Drive-by cleanups unrelated to the main purpose of the change.

If in doubt: split the change.

---

## 4) Spec drift check (before starting new work)

Before implementing a new feature or stage, perform a quick consistency check in the
affected area:

- Do file preambles and JSDoc match `docs/taskx-comments.md`?
- Do names and paths match `docs/taskx-naming.md`?
- Are import directions consistent with `docs/taskx-import-boundaries.md`?
- Do responsibilities still match `docs/taskx-roadmap.md`?

If cheap, **fix drift immediately** in a small preliminary refactor.
If not, record the discrepancy explicitly and plan a dedicated correction step.

The goal is to prevent silent divergence between code and specifications.

---

## 5) Standard workflow for adding or changing code

1. **Consult the roadmap** (`docs/taskx-roadmap.md`)
   - Identify the next file or area to work on, with priority given to:
     - maintaining the vertical slice,
     - or increasing end-to-end coverage.
   - If the change does not fit the roadmap, update the roadmap first.

2. **Check conventions**
   - Naming: `docs/taskx-naming.md`
   - Comments and documentation: `docs/taskx-comments.md`
   - Commits: `docs/taskx-commits.md`
   - Import boundaries: `docs/taskx-import-boundaries.md`

3. **Implement the change**
   - Keep the scope minimal but complete.
   - Respect layer boundaries and import rules.
   - Prefer explicit, boring code over clever shortcuts.

4. **Update documentation if needed**
   - If responsibilities, structure, or expectations change, update the relevant `docs/` files.
   - Do not let docs drift behind the code.

5. **Write the commit message**
   - Use the correct prefix (`feat`, `refactor`, `fix`, `docs`).
   - Make the subject precise.
   - Add a body when it adds real explanatory value.

---

## 6) Relationship to the roadmap

The roadmap is **normative**:

- It defines what files and layers are expected to exist.
- It defines where new responsibilities should go.
- It encodes the intended milestone progression.

Rules:

- If a new file or folder is introduced, the roadmap must be updated.
- If responsibilities move, the roadmap must be updated.
- If reality diverges from the roadmap, fix the roadmap first or alongside the change.

---

## 7) Review checklist (mental or explicit)

Before finalizing a change, verify:

- [ ] Does this change respect the layering rules?
- [ ] Does it move the system closer to a working vertical slice or higher coverage?
- [ ] Is the scope coherent and focused?
- [ ] Are naming and file locations consistent with conventions?
- [ ] Are comments and docstrings aligned with the comment style guide?
- [ ] Does the commit message explain the intent clearly?
- [ ] If architecture or structure changed, did the docs get updated?

---

## 8) Philosophy

TaskX is intended to grow over time into a complex but **comprehensible** system.

We optimize for:

- End-to-end usefulness over speculative features,
- Long-term readability over short-term speed,
- Explicit structure over implicit conventions,
- Predictable evolution over ad-hoc growth.

This process exists to support those goals, not to create bureaucracy.
