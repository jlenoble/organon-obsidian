# TaskX — Development Process

This document defines the **standard development workflow** for the TaskX codebase.

Its goals are:

- Keep changes reviewable and intentional.
- Preserve architectural coherence over time.
- Avoid scope creep and accidental coupling.
- Make history readable and meaningful.

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

---

## 2) Change granularity

### 2.1 Default rule: one coherent change set

A change should normally focus on:

- One file, or
- One tightly related set of files (e.g., a new feature folder, a pipeline stage plus its registry hook, or a bug fix that requires touching both logic and tests/adapters).

The goal is **coherence**, not artificial restriction.

### 2.2 When multiple files are expected and acceptable

Editing multiple files in a single commit is appropriate when:

- Introducing a new feature that requires:
  - a new model type + a pipeline stage + a registry entry,
- Fixing a bug that spans:
  - a pipeline stage and its caller,
- Renaming or moving files and updating imports,
- Adding a new feature module with its detector + registration glue,
- Updating documentation that must stay consistent with the code change.

In short: **if the files are inextricably related, they belong together**.

### 2.3 What should not be mixed

Avoid mixing in the same commit:

- Unrelated refactors,
- Formatting-only changes with logic changes,
- Two independent features,
- Drive-by cleanups unrelated to the main purpose of the change.

If in doubt: split the change.

---

## 3) Standard workflow for adding or changing code

1. **Consult the roadmap** (`docs/taskx-roadmap.md`)
   - Identify the next file or area to work on.
   - If the change does not fit the roadmap, update the roadmap first.

2. **Check conventions**
   - Naming: `docs/taskx-naming.md`
   - Comments and documentation: `docs/taskx-comments.md`
   - Commits: `docs/taskx-commits.md`

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

## 4) Relationship to the roadmap

The roadmap is **normative**:

- It defines what files and layers are expected to exist.
- It defines where new responsibilities should go.

Rules:

- If a new file or folder is introduced, the roadmap must be updated.
- If responsibilities move, the roadmap must be updated.
- If reality diverges from the roadmap, fix the roadmap first or alongside the change.

---

## 5) Review checklist (mental or explicit)

Before finalizing a change, verify:

- [ ] Does this change respect the layering rules?
- [ ] Is the scope coherent and focused?
- [ ] Are naming and file locations consistent with conventions?
- [ ] Are comments and docstrings aligned with the comment style guide?
- [ ] Does the commit message explain the intent clearly?
- [ ] If architecture or structure changed, did the docs get updated?

---

## 6) Philosophy

TaskX is intended to grow over time into a complex but **comprehensible** system.

We optimize for:

- Long-term readability over short-term speed,
- Explicit structure over implicit conventions,
- Predictable evolution over ad-hoc growth.

This process exists to support those goals, not to create bureaucracy.
