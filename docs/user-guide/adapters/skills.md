---
title: Skills
sidebar_label: Skills
---

# Skills Adapter

Agents shouldn't need every procedure configured up front — they should find expertise at the moment a task calls for it. The skills adapter is how they do: the read surface for [skills](../agents/tools-and-context#skills), the named bundles of instructions, context, and tools that agents load on demand. It exposes a single operation, `v/ops/skills`, dispatched by a `command` field, so it costs one tool definition in an agent's palette rather than two.

It is deliberately read-only: skills are authored with the ordinary write surfaces — [`covia:write`](./venue-adapter) for workspace skills, [`asset:store`](./asset) for immutable published ones. The same resolution logic backs the agent runtime's skills index and `skill_load` tool, so what you see here is exactly what a loading agent receives.

## Operations

### skills list — Render the Index

Returns the skill index — one `- name — description` line per skill — across the given sources, searched in order. A skill in `w/skills` shadows a venue skill of the same name.

```json
{
  "operation": "v/ops/skills",
  "input": { "command": "list", "sources": ["w/skills", "v/skills"] }
}
```

`sources` is optional and defaults to `["w/skills", "v/skills"]`. Entries are directory paths or content-addressed asset refs (`a/<hash>`). When no skills exist the result is `null`, not an empty string — used as a `config.context` assemble-op, the context entry is simply skipped.

### skills read — Fetch One Skill

Returns a single skill in full: `{name, description, tools, path, id, body?, context?}`. `body` is absent for a pure toolset; `context` appears only when the skill bundles context entries.

```json
{
  "operation": "v/ops/skills",
  "input": { "command": "read", "name": "workspace" }
}
```

Address the skill with exactly one of `name` (looked up across sources) or `ref` (a direct address such as `v/skills/workspace`, `w/skills/reports`, or `a/<hash>`).

## Access Control

No authentication is required — `v/skills` is publicly discoverable by design. Gating is per source: content-addressed refs pin `asset/read` and path sources pin `crud/read`, both inside the anonymous read-only grant scope. Loading a skill grants no authority either way — its tools are capability-checked at invocation.

## The Venue Skill Library

Every venue materialises a built-in library at `v/skills/<name>` covering its own mechanisms — workspace, assets, agents, orchestration, grid, secrets, scheduling, memory, MCP, HITL, skill-authoring, and more (22 skills out of the box). Module adapters ship their own: load the [SQL module](./sql) and its `sql` skill appears alongside. Agent templates declare `skills: ["w/skills", "v/skills"]` by default, so a new agent's index shows the whole library from its first turn.

## Related

- [Skills in Covia](/docs/overview/skills) — why skills are a differentiator
- [Teach an Agent a New Skill](../tutorials/skills) — authoring end to end
- [Skills reference](../agents/tools-and-context#skills) — loading, budgets, shadowing
- [COG-18: Skills](../../protocol/cogs/COG-018) — the specification
