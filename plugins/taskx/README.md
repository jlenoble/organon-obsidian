# TaskX

TaskX is an Obsidian plugin that turns collected tasks into a structured,
action-oriented recommendation feed.

Current architecture:
- core model (`src/core/model`)
- core pipeline (`src/core/pipeline`)
- registries (`src/core/registries`)
- feature modules (`src/features`)
- Obsidian adapters (`src/adapters`)
- UI renderer (`src/ui`)
- entry wiring (`src/entry`, `src/plugin.ts`)

The normative project contract lives in `docs/`, especially:
- `docs/taskx-roadmap.md`
- `docs/taskx-architecture.md`
- `docs/taskx-import-boundaries.md`
- `docs/taskx-naming.md`
- `docs/taskx-dev-process.md`

## Status

- This project is under active local development.
- It is not intended for public publication/distribution at this stage.

## Usage In Obsidian

TaskX is rendered from a `taskx` code block:

````md
```taskx
```
````

The plugin executes the pipeline and renders the resulting
`RecommendationFeed` into the code block output.

## Development

From `plugins/taskx`:

```bash
npm run build
npm test
```

In the monorepo workflow:

```bash
rushx build
rushx copy
```

`rushx copy` updates the dev-vault plugin folder used for manual Obsidian checks.
