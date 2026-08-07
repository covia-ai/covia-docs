# Covia Documentation

The Docusaurus-based documentation site published at [docs.covia.ai](https://docs.covia.ai).

Active development happens on `develop`; pushing to `master` deploys the site.

Requires Node.js 18+ with pnpm (via Corepack: `corepack enable`).

## Installation

```bash
pnpm install
```

## Local Development

```bash
pnpm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
pnpm run build
```

This command generates static content into the `build` directory, which can be served from any static hosting service. The build fails on broken internal links and anchors — it doubles as the docs link-integrity check (enforced in CI).

## Deployment

Push to `master` on GitHub. The documentation site will be automatically deployed.
