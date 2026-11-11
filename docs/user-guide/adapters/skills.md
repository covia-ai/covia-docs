---
title: Skills
sidebar_label: Skills
---

# Skills Adapter

Agents shouldn't need every procedure configured up front — they should find expertise at the moment a task calls for it. The skills adapter is how they do: the read surface for [skills](../agents/tools-and-context#skills), the named bundles of instructions, context, and tools that agents load on demand.

It is deliberately read-only: skills are authored with the ordinary write surfaces — [`covia:write`](./venue-adapter) for workspace skills, [`asset:store`](./asset) for immutable published ones. The same resolution logic backs the agent runtime's skills index and `skill_load` tool, so what you see here is exactly what a loading agent receives.

## Skills and skillsets

Two **declared kinds**, never inferred from what a reference happens to resolve to:

- A **skill** is one asset — instructions, tools, and further sources it makes discoverable.
- A **skillset** is a directory whose entries are skills.

Assets and directories are never mixed at one level. `v/skills` holds skillsets; `v/skills/root` holds the skills an agent starts with. That is what lets a level be walked without guessing what its entries are — and it is why `v/skills` is the classic mistake in a `skillsets` declaration, where `v/skills/root` was meant.

## Operations

Two operations with precise schemas, because a skillset listing and a single-skill read are different questions.

### `skills:list` — the skills in a skillset

```json
{
  "operation": "v/ops/skills/list",
  "input": { "skillset": "v/skills/root" }
}
```

Returns a map from each skill's **resolved path** to `{name, description, id}`, so you see where a skill lives next to what it is:

```json
{
  "v/skills/root/workspace": { "name": "workspace", "description": "Read and write your durable lattice workspace", "id": "0x8cd1…" },
  "v/skills/root/grid":      { "name": "grid",      "description": "Invoke operations here and on remote venues",      "id": "0x41af…" }
}
```

`id` is the skill's content identity — two paths with the same `id` are the same skill. Entries that are not skills (nested directories, unrelated data) are omitted.

Omit `skillset` to list the venue's configured entry skillsets — "where should I start" is inherently a set, and it is the one plural case. The defaults are `adapters.skills.defaultSkillsets` / `defaultSkills`, published at `v/info/adapters/skills`, so a venue curating its own library answers discovery from it rather than having clients assume `v/skills/root`.

**Listing is a survey.** A skillset that doesn't resolve, or that the caller may not read, yields an empty map rather than an error — one inaccessible venue default doesn't break every call.

### `skills:read` — one skill in full

```json
{
  "operation": "v/ops/skills/read",
  "input": { "skill": "v/skills/data/workspace" }
}
```

Returns `{name, description, path, id, tools, body?, skills?, skillsets?, context?}`. `tools` are the operation refs added to an agent's palette while the skill is loaded; `skills` and `skillsets` are the further sources it makes discoverable; `body` is absent for a pure toolset; `context` appears only when the skill bundles context entries.

`read` takes a **path or asset ref, never a name** — a name is only meaningful against a declared set of sources, and there is no global index to look one up in. List a skillset to obtain the path. (An agent's own by-name lookup is `skill_load`, which does have its sources in scope.) Unlike `list`, a denial here is an error: reading one named skill is a specific request.

There is deliberately **no operation that enumerates skillsets**. A skillset is not a registered thing — it is any lattice path that happens to contain skill assets — so listing what a venue ships is an ordinary lattice read (`v/ops/covia/list` on `v/skills`, whose keys are the skillsets).

:::note New in 0.9.4
These two operations replace the single command-dispatched `v/ops/skills`, whose `{"command": "list", …}` form no longer resolves. The same release reorganises the venue library from a flat `v/skills/<name>` into skillsets under `v/skills/<set>/`, with `v/skills/root` as the entry index, and splits agent configuration into `skills` and `skillsets`.

On a 0.9.3 venue you will still find the flat layout and the single `v/ops/skills` operation. Ask the venue rather than assuming: `v/info/adapters/skills` publishes its configured entry point.
:::

## Access Control

No authentication is required — `v/skills` is publicly discoverable by design. Gating is **per source**: a content-addressed ref pins `asset/read`, a path source pins `crud/read`, and nothing from a denied source reaches the caller.

An `asset/read` grant does not substitute for a path read. The public read-only scope grants `asset/read` unscoped, which is safe for content addressing — you must already hold the hash to ask — but against a path it would become a licence to read any user's workspace.

Loading a skill grants no authority either way: its tools are capability-checked at invocation, exactly as before it was loaded.

## The Venue Skill Library

Every venue materialises a library under `v/skills/<skillset>/`, with **`v/skills/root` as the entry index**: a short list of entry-point skills, each of which opens a family when loaded.

| Entry point | Opens |
|-------------|-------|
| `workspace` | `v/skills/data` |
| `agents` | `v/skills/agents` |
| `grid` | `v/skills/grid` |
| `discovery` | `v/skills/ops-tools`, `v/skills/adapters` |
| `auth` | `v/skills/auth`, `v/skills/caps-permissions` |
| `venue` | `v/skills/venue`, `v/skills/admin` |
| `skills` | `v/skills/building` |
| `covia` | `v/skills/convex` |

That takes an agent's always-on index from around two dozen lines to a handful, while every skill stays one load away. The exact contents depend on which adapters are active, which is the point — read `v/skills/root` rather than assuming.

An entry point is installed at **both** its family path and its `root/` mirror, from the same resource, so both addresses carry identical metadata and content-identity dedup treats them as one skill — never two entries in an agent's context.

**Adapters own their skills.** Each built-in adapter installs its own skill, so a skill is published exactly when its adapter is active and retracted when it is disabled or unloaded; modules ship theirs from their own jars (the [SQL module](./sql)'s `sql`, [Telegram](./telegram)'s `telegram`). A skillset therefore only ever lists what the venue actually offers. The platform skills the skills adapter itself owns are `covia`, `venue`, `discovery`, `provenance`, `skills`, `skill-authoring` and `lattice`.

Agent templates declare `skillsets: ["w/skills", "v/skills/root"]`, so a new agent sees a compact entry-point index from its first turn and reaches the rest by loading. A user's own `w/skills/<name>` shadows the venue skill of the same name.

## Related

- [Skills in Covia](/docs/overview/skills) — why skills are a differentiator
- [Teach an Agent a New Skill](../tutorials/skills) — authoring end to end
- [Skills reference](../agents/tools-and-context#skills) — loading, budgets, shadowing
- [COG-18: Skills](../../protocol/cogs/COG-018) — the specification
