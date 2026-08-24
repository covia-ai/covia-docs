# Agent instructions — covia-docs

Docusaurus 3 documentation site for [docs.covia.ai](https://docs.covia.ai),
covering the Covia grid: overview, user guide, operator guide, and the COG
protocol specifications.

## Workflow

- Active development happens on **`develop`**; pushing to **`master`** deploys
  the site. Do not push to `master` unless a deployment is intended.
- Requires Node.js 18+ with pnpm (via Corepack: `corepack enable`).

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Dev server on port 3000 with hot reload (alias of `pnpm start`) |
| `pnpm build` | Static build into `build/` — **fails on broken internal links or anchors**, so it doubles as the link-integrity check (enforced in CI) |
| `pnpm typecheck` | TypeScript check of config/site code |
| `pnpm serve` | Serve the last production build locally |

Run `pnpm build` before pushing content changes — broken links that pass the
dev server will fail the build.

## Layout

- `docs/overview/` — high-level introduction to the grid, venues, SDK
- `docs/user-guide/` — quick start, tutorials, SDK, API, MCP, adapters, agents
- `docs/operator-guide/` — running and configuring venues
- `docs/protocol/` — governance, whitepaper, and the **COG specifications**
  (`docs/protocol/cogs/`)
- `sidebars.ts`, `docusaurus.config.ts` — navigation and site config
- `src/`, `static/` — theme code and static assets

## Editorial rules

- **British English** throughout, with two deliberate exceptions:
  **"catalog"** and **"artifact"** are Covia terms of art — never "correct"
  them to "catalogue"/"artefact".
- The COG documents are **normative specs**. Before editing spec content
  (as opposed to prose polish), verify the behaviour against the Covia source
  implementation — do not change normative statements on editorial judgement
  alone. COG numbering is topical, not sequential.
- `REVIEW_FINDINGS.md` and `DOCS_UPDATE_PLAN.md` are working notes for review
  and planning — not site content. Delete entries (or the files) once
  triaged; never publish them.
