---
title: Teach an Agent a New Skill
sidebar_position: 4
---

# Teach an Agent a New Skill

Most agent frameworks make you decide everything up front: every tool, every procedure, every instruction, pinned into the configuration and paid for on every single turn. Covia agents don't work that way. A well-built agent starts **lean** — a couple of read tools — and carries a one-line index of **skills** it can pick up when a task needs them.

A skill is a named bundle of instructions, context, and tools. It's an ordinary [asset](../../protocol/cogs/COG-005), so you can write one in your workspace, publish it content-addressed, and hand it to any agent on any venue.

In this tutorial you'll browse the skills a venue already ships, watch a lean agent acquire one mid-task, write your own, and publish it for anyone to load.

**You'll need:** a running venue (`docker run -p 8080:8080 ghcr.io/covia-ai/covia:latest`, or see [Venue Quick Start](../../operator-guide/venue-start)) and an LLM API key for the agent steps — the examples use OpenAI, but any [backend](../agents/llm-backends) works, including a local Ollama with no key at all.

All calls go to `POST /api/v1/invoke`. Every operation here is also an MCP tool (`skills_list`, `skills_read`, `agent_create`, `covia_write`, …), so you can drive the whole tutorial from Claude instead — see [Give Claude Your Own Tools](./claude-mcp).

:::note Venue version
This tutorial follows the 0.9.4 skills surface: `v/ops/skills/list` / `v/ops/skills/read`, skillsets under `v/skills/<set>/`, and `config.skillsets`. On a 0.9.3 venue you will find the earlier flat layout and a single command-dispatched `v/ops/skills`. `GET /api/v1/status` reports the version.
:::

## 1. See what the venue already knows

Every venue ships a skill library covering its own mechanisms. It's public — no key, no agent, no authentication required:

```json
POST /api/v1/invoke
{ "operation": "v/ops/skills/list", "wait": true }
```

With no `skillset`, you get the venue's configured entry point — `v/skills/root` out of the box. The result maps each skill's **path** to what it is:

```json5
{
  "v/skills/root/workspace": { name: "workspace", description: "Read and write your durable lattice workspace — paths, namespaces, lists, deep structures. Load before storing or querying any per-user data.", id: "0x8cd1…" },
  "v/skills/root/agents":    { name: "agents",    description: "Create, configure and delegate to other agents on this venue.", id: "0x41af…" },
  "v/skills/root/grid":      { name: "grid",      description: "Run operations on OTHER venues — cross-venue federation, remote jobs, hash-verified definitions.", id: "0x93bc…" },
  "v/skills/root/discovery": { name: "discovery", description: "Find out what a venue can do: adapters, operations and their schemas, published assets.", id: "0x2d70…" }
}
```

That's the whole design in one screen. Each description says **what the skill does and when to load it** — enough for an agent to choose, small enough that eight of them cost almost nothing. The bodies stay out of context until someone asks for one.

Each of those eight is an **entry point**: load it and it reveals its family. `workspace` opens `v/skills/data`, `agents` opens `v/skills/agents`, and so on — so the always-on index stays short while every skill is one load away. List a family directly by naming it:

```json
{ "operation": "v/ops/skills/list", "input": { "skillset": "v/skills/data" }, "wait": true }
```

Read one in full without loading it, addressing it by the path the listing gave you:

```json
{ "operation": "v/ops/skills/read", "input": { "skill": "v/skills/ops-tools/provenance" }, "wait": true }
```

```json5
{
  name: "provenance",
  description: "The audit trail: every invocation leaves an immutable job record...",
  body: "## Provenance\nA venue is a system of record: every operation invocation persists a job record under `j/`...",
  tools: ["v/ops/covia/list", "v/ops/covia/read", "v/ops/covia/slice", "v/ops/covia/inspect", "v/ops/covia/aggregate"],
  path: "v/skills/ops-tools/provenance",
  id: "0x5f2a…"
}
```

`body` is the instructions an agent would receive; `tools` are the operations that would join its palette. `read` is how you audit a skill before trusting it — see exactly what would enter an agent's prompt.

`read` takes a **path or an asset ref, never a name**: a name only means something against a declared set of sources, and `list` is how you turn a name into a path. (An agent's own by-name lookup is `skill_load`, which does have its sources in scope.)

## 2. Create a lean agent

The `skilled` template is the recommended starting point: read and list, plus the skills index.

```json
{ "operation": "v/ops/agent/create",
  "input": { "agentId": "Nomad", "config": "template:skilled" },
  "wait": true }
```

Its config is deliberately small — the interesting line is `skillsets`:

```json
{
  "tools": ["v/ops/covia/read", "v/ops/covia/list"],
  "skillsets": ["w/skills", "v/skills/root"],
  "defaultTools": false
}
```

Two skillsets — directories of skills — searched in order. Nomad's index is now the union of your workspace skills and the venue's entry points, and because `w/skills` comes first, **your skill shadows a venue skill of the same name**. That's how you override the house behaviour without forking anything.

`skillsets` and `skills` are separate declarations: a `skillsets` entry is a *directory*, a `skills` entry is exactly *one* skill (`"skills": ["v/skills/ops-tools/models"]`). The kinds don't interchange, so a directory listed under `skills` is not walked — which is why the venue's entry point is `v/skills/root` (skills) and not `v/skills` (skillsets).

Any agent can be given sources the same way:

```json
{ "operation": "v/ops/agent/update",
  "input": { "agentId": "Scribe", "config": { "skillsets": ["w/skills", "v/skills/root"] } },
  "wait": true }
```

## 3. Watch it pick one up

Give Nomad a job it can't do with read and list alone:

```json
{ "operation": "v/ops/agent/request",
  "input": {
    "agentId": "Nomad",
    "input": { "task": "Record three project entries under w/projects (Apollo, Borealis, Cygnus — each with a status and a lead), then tell me what you wrote." },
    "timeout": 60000
  },
  "wait": true }
```

Nomad has no write tool. Instead of failing, it finds `workspace` in its index and loads it:

```json
{ "name": "skill_load", "input": { "name": "workspace" } }
```

```json5
{
  loaded: true,
  skill: "workspace",
  path: "v/skills/workspace",
  tools: ["covia_read", "covia_write", "covia_list", "covia_slice", "covia_append", "covia_delete", "covia_inspect", "covia_aggregate"],
  body: "## Workspace\nYour durable, per-user data store. Paths are slash-separated...",
  note: "Skill instructions stay in context each turn (unload with context_unload). Tools are available from your next step."
}
```

Three things happened at once, and the combination is the point:

- **The instructions arrived immediately**, in the tool result — usable on this turn, not the next.
- **The tools joined the palette** from the agent's next step. It can now call `covia_write`.
- **The entry persists**, so both stay in place for the rest of the conversation.

Check the result, and then check the agent — `g/Nomad` records the skill in its loaded context exactly like any other loaded path:

```json
{ "operation": "v/ops/covia/read", "input": { "path": "w/projects" }, "wait": true }
```

:::note[Loading is not permission]

A skill can offer any operation; it can never grant the right to call one. If Nomad's [capabilities](../capabilities) don't cover `w/projects`, loading `workspace` changes nothing — the write is still denied, with the same structural error. Skills carry know-how; [capabilities](../../protocol/cogs/COG-013) carry authority.

:::

## 4. Write your own

A skill is asset metadata with a `skill` facet. The quickest form puts the body inline and writes it straight to your workspace:

```json
{ "operation": "v/ops/covia/write",
  "input": {
    "path": "w/skills/status-reports",
    "value": {
      "description": "House format for project status reports. Load before writing any report to w/reports.",
      "content": {
        "inline": "## Status reports\nOne report per project at `w/reports/<project>`.\n\nShape:\n```\n{project, status: active|on-hold|done, lead, updated, summary}\n```\n\nRules:\n- `summary` is one sentence, no more.\n- Read the project record at `w/projects/<name>` first — never invent a lead or status.\n- Overwrite in place; history lives in the job log, not in the report.\n"
      },
      "skill": {
        "tools": ["v/ops/covia/read", "v/ops/covia/write"]
      }
    }
  },
  "wait": true }
```

Three fields carry the whole thing:

| Field | What it does |
|-------|--------------|
| `description` | The index line. **What it does, and when to load it** — this is what an agent chooses on, so write it for a reader mid-task, not for a catalogue. |
| `content` | The body. `inline` for short bodies like this one; larger or shared bodies live in a stored asset (step 5) or a file binding. |
| `skill.tools` | Operations added to the palette while loaded. Full catalog paths. Curate the minimum the skill actually teaches. |

Verify it before anyone loads it:

```json
{ "operation": "v/ops/skills/read", "input": { "skill": "w/skills/status-reports" }, "wait": true }
```

That returns exactly what a loading agent will receive. Nomad's index picks it up on its **next turn** — sources are re-resolved every turn, so there's nothing to restart, redeploy, or invalidate. Edit the body and the next turn of every agent carrying it sees the new text.

:::tip[Write bodies for an LLM mid-task]

Tight and imperative. Schemas as they're used. Gotchas inline, where they bite. Aim for 1–2 KB: a loaded body costs context budget on **every turn** it stays loaded, so put long reference material in a workspace document the body points at instead.

:::

Ask Nomad for a report and watch it load `status-reports` before writing anything:

```json
{ "operation": "v/ops/agent/request",
  "input": { "agentId": "Nomad", "input": { "task": "Write a status report for Apollo." }, "timeout": 60000 },
  "wait": true }
```

## 5. Publish it

`w/skills` is private and mutable — ideal while iterating. To share a skill, store it as an immutable asset:

```json
{ "operation": "v/ops/asset/store",
  "input": {
    "metadata": {
      "name": "status-reports",
      "description": "House format for project status reports. Load before writing any report to w/reports.",
      "skill": { "tools": ["v/ops/covia/read", "v/ops/covia/write"] }
    },
    "contentText": "## Status reports\nOne report per project at `w/reports/<project>`...\n"
  },
  "wait": true }
```

```json
{ "id": "8cd17cbd4e9a...", "stored": true }
```

That hash is now the skill. Anyone can load it directly, whether or not it appears in their index:

```json
{ "name": "skill_load", "input": { "ref": "a/8cd17cbd4e9a..." } }
```

It's content-addressed, so it verifies rather than trusts — the same guarantee any [artifact](../../protocol/cogs/COG-006) carries, which is what lets a skill cross venue boundaries intact. Hand the ref to a colleague on a different venue and they load the same bytes you wrote.

Point a skills directory at it and it shows up in the index by name:

```json
{ "operation": "v/ops/covia/write",
  "input": { "path": "w/skills/status-reports", "value": "a/8cd17cbd4e9a..." },
  "wait": true }
```

A directory entry can be a full metadata map (step 4) or a string ref like this one — mix both freely in the same directory. Loading the same skill from two addresses is a no-op: skills deduplicate by content identity, not by path.

## 6. Put it down again

A loaded skill costs budget every turn, so agents should unload what they've finished with. There's no `skill_unload` — the ordinary context tool does it:

```json
{ "name": "context_unload", "input": { "path": "w/skills/status-reports" } }
```

The body, its context entries, and its tools all go from the next turn onward. Every loaded element carries its unload key in its own header — `[Skill: status-reports — w/skills/status-reports]` — which is exactly what `context_unload` takes, and the `[Skills]` index marks loaded ones with `(loaded)` so an agent never loads the same thing twice.

## Go further

- **Bundle a tool with its manual** — an asset with both an `operation` facet and a `skill` facet is a self-documenting tool: loading it injects the instructions *and* offers the operation. One asset, one identity.
- **A skill with no body** is a pure toolset — a curated tool bundle plus its index line, useful for grouping operations an agent should acquire together.
- **Bundle context too** — `skill.context` entries load alongside the body, so a skill can arrive with the reference data it needs.
- **Index without loading** — pin `{ "op": "v/ops/skills/list", "input": { "skillset": "v/skills/root" } }` into `config.context` to show an agent what exists without giving it `skill_load`.
- **Ship skills with a module** — every adapter installs its own skill, so a skill is published exactly when its adapter is active and retracted when it is disabled or unloaded. A venue module jar brings its skills with the code that implements them, and `v/adapters/<name>/skills` is a ready-made skillset for everything one adapter offers.

## Related

- [COG-18: Agent Skills](../../protocol/cogs/COG-018) — the specification
- [Tools and Context](../agents/tools-and-context) — how skills fit the per-turn context pipeline
- [Creating Agents](../agents/creating-agents) — configuration and templates
- [Capabilities](../capabilities) — the authority model skills never bypass
- [Running Covia Agents](./running-agents) — agents from first principles

Already have SKILL.md files? [Migrate an agent](../agents/migrate-an-agent) imports them and creates a native agent in one call.
