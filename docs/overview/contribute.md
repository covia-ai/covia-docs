---
title: Contribute to the Grid
sidebar_label: Contribute
sidebar_position: 8
---

# Build the Open Grid with Us

The Grid is an open, interoperable fabric for AI — built in the open, by and for developers. If you believe AI should be modular, auditable, and connectable across tools, frameworks, and venues, you're in the right place.

- Core (Covia): [github.com/covia-ai/covia](https://github.com/covia-ai/covia)
- Documentation: [github.com/covia-ai/covia-docs](https://github.com/covia-ai/covia-docs)
- Frontend: [github.com/covia-ai/frontend](https://github.com/covia-ai/frontend)
- All repositories: [github.com/covia-ai](https://github.com/covia-ai)
- Discord: [discord.gg/fywdrKd8QT](https://discord.gg/fywdrKd8QT)

## Why contribute

- Help define open standards that make AI systems composable and portable.
- Ship real infrastructure: venues, adapters, operations, and governance tooling.
- Work in a pragmatic codebase with a strong focus on DX, observability, and security.
- Join an active community of builders (researchers, operators, and application devs).

## Ways you can contribute

- Fix a bug or improve docs (great for first contributions)
- Add or enhance an adapter (e.g. LangChain, HTTP, MCP, or an adapter of your own)
- Implement new grid operations or examples
- Improve testing, CI, and developer tooling
- Propose protocol and governance improvements

## Get started in minutes

1. Explore the docs
   - Start at [Overview](./) and the [Grid](./grid).
   - See the [SDK](./sdk) direction and the [Venues](./venues) model.

2. Pick an issue
   - Core issues: [covia/issues](https://github.com/covia-ai/covia/issues)
   - Docs issues: [covia-docs/issues](https://github.com/covia-ai/covia-docs/issues)
   - Frontend issues: [frontend/issues](https://github.com/covia-ai/frontend/issues)
   - Look for labels like "good first issue", "help wanted", or "docs".

3. Run the docs locally (optional, for docs changes)

   ```bash
   pnpm install
   pnpm run start
   ```

   The docs build fails on broken links and anchors (enforced in CI), so run `pnpm build` before opening a PR.

4. Submit your PR
   - Fork the repo, create a branch, open a PR against `develop`.
   - Provide a concise description, screenshots where helpful, and test notes.

## Development pointers

- Adapters live under the user guide: see [Adapters](../user-guide/adapters/) for integration patterns.
- Keep code clear and self-explanatory; prefer readability over cleverness.
- Add meaningful tests and docs alongside code changes.
- Follow existing formatting and conventions; avoid unrelated refactors.
- Use British English in documentation prose.

## Community & support

- Join [Discord](https://discord.gg/fywdrKd8QT) to ask questions, share work, and find collaborators.
- Follow updates on [X](https://x.com/CoviaAI).
- Discussions and proposals: [GitHub Discussions](https://github.com/orgs/covia-ai/discussions), or issues and PRs on the relevant repo.

## Not sure where to start?

Tell us what you want to build in Discord, and we'll help you map it to the Grid — whether that's a new venue, a custom adapter, or a production workflow. Your feedback directly shapes the roadmap.

Ready? Open your first issue or PR today:

- Core: [github.com/covia-ai/covia](https://github.com/covia-ai/covia)
- Docs: [github.com/covia-ai/covia-docs](https://github.com/covia-ai/covia-docs)
- Frontend: [github.com/covia-ai/frontend](https://github.com/covia-ai/frontend)
