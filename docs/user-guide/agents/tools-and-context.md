---
title: Tools and Context
sidebar_position: 6
---

# Tools and Context

Everything an agent knows on any given turn is assembled fresh: its identity, its tools, what it has loaded, the conversation so far, and whatever just arrived. Understanding that assembly is how you configure agents deliberately and debug them when they surprise you.

## Context Assembly

One assembler serves every runtime. It is a pure function — a **Spec** in, a **prompt** out — so the same Spec always yields the same prompt. That is what makes [`agent:context`](./operations#agent-context) inspection exact rather than approximate: it builds the same Spec and calls the same assembler a live inference does.

Three words are used precisely:

- **Inference** — one call to an LLM operation.
- **Cycle** — one transition: from an input (or a wake-up with none) through the tool loop to the final reply. One or more inferences.
- **Turn** — one message in the conversation.

**The unit of assembly is one inference, not one cycle.** Inside a tool loop the whole prompt is rebuilt before every call, so a tool's write to a loaded path is visible on the very next inference.

### Bands

Sections are ordered by **how often their bytes change** — stable first, volatile last. Providers cache on a prefix, so anything that changes invalidates everything after it; ordering by change frequency makes cache efficiency a property of the sequence rather than of someone remembering to be careful.

| Band | Changes when | Cache consequence |
|------|--------------|-------------------|
| **Fixed head** | Configuration changes | Identical across cycles — the cacheable prefix |
| **Live surface** | The working set changes, or the data it reflects changes | Stable while loads and their sources are stable |
| **Conversation** | A turn is added | Append-only within a cycle |
| **Volatile tail** | Every inference, or daily | Never cached; invalidates only itself |

Band boundaries are cache boundaries. On a provider that caches an explicitly marked prefix, the tool definitions, the system slot, the conversation as it stood when the cycle began, and the tool loop so far each carry a mark; the tail never does.

### The sequence

| # | Section | Band | Role | Contents |
|---|---------|------|------|----------|
| 0 | Tool definitions | fixed head | — | The palette: harness, configured, then loads-contributed tools. A parameter, not a message — every provider puts it first |
| 1 | Identity prompt | fixed head | `system` | `config.systemPrompt` or a default identity, plus one line of session identity |
| 2 | Capability notice | fixed head | `system` | Declared `config.caps` — **only for an agent that has tools** |
| 3 | Pinned context | live surface | `system` | `config.context` entries — operator-owned; the agent cannot drop them |
| 4 | Skills index | live surface | `system` | One line per discoverable skill |
| 5 | Loaded elements | live surface | `system` | Every effective load, each carrying its unload key |
| 6 | Conversation | conversation | `user`/`assistant`/`tool` | The rendered frame(s) |
| 7 | Pending results | conversation | `user` | Job results that arrived for this cycle |
| 8 | Current input | conversation | `user` | The message(s) driving this cycle |
| 9 | Tool-loop messages | conversation | `assistant`/`tool` | Turns accumulated within this cycle |
| 10 | Budget warning | volatile tail | `system` | **Only** when the budget is under pressure |
| 11 | Current date | volatile tail | `system` | One line; changes daily |
| 12 | Unavailable tools | volatile tail | `system` | Configured tools that did not resolve this cycle |
| 13 | Outstanding task | volatile tail | `user` | What the agent must complete or fail — the last thing before the reply |

When there is neither input nor pending results, an **empty-state signal** takes slot 8, so a woken agent can act on its role or report idle.

Two design points worth knowing when you configure an agent:

- **The head is kept lean.** It is cached, but providers without caching pay for it on every inference. So the lattice namespace reference is a *skill* (`v/skills/data/lattice`) rather than a permanent section, and the capability notice renders only for an agent that actually has tools — an agent that can do nothing has no bounds worth stating.
- **Warnings are never conversation.** The budget warning, the date, and the unavailable-tools notice describe *this* inference. They live in the tail, render once, and vanish when the condition does — a warning written into the conversation would be re-read forever as though still true.

### Roles and the provider edge

Roles are semantic. `system` is what the venue, operator or runtime says; `user` is what has happened or must be acted on; `assistant` and `tool` are the agent's own turns and their results. Nothing in assembly depends on the provider.

Providers differ, though, and those differences are declared as **data on the model's operation asset** (the `model` facet) rather than branched on by provider name. The Level 3 adapter applies them at the edge — and never reorders, drops, or adds content:

| Declared | What the edge does |
|----------|--------------------|
| `systemMessages: "multiple"` | Passes system messages through where they were placed |
| `systemMessages: "single"` | Delivers the leading system run as the provider's system parameter; a *later* system message becomes a `[system: …]` user message, in place |
| `systemMessages: "none"` | As `"single"`, with the leading run folded into the first user message |
| `cachePrefix` | Turns the band marks into the provider's cache controls |
| `labels` | Chooses the label dialect (below) |

### Element labels

Every element the assembler renders is labelled, in one of three dialects chosen by the model's declared `labels` option:

| Element | `bracket` (default) | `xml` | `header` |
|---------|---------------------|-------|----------|
| Skills index | `[Skills]` | `<skills>` | `## Skills` |
| Loaded skill | `[Skill: <name> — <path>]` | `<skill name=… path=…>` | `## Skill: <name> — <path>` |
| Context entry | `[Context: <label>]` | `<context label=…>` | `## Context: <label>` |
| Unavailable entry | `[Context: <label> — unavailable: <reason>]` | `<context … unavailable=…/>` | `## Context: … — unavailable: …` |
| Compacted segment | `[Compacted: <N> turns]` | `<compacted turns=…>` | `## Compacted: <N> turns` |
| Budget warning | `[Context budget] …` | `<context-budget>` | `## Context budget` |

`bracket` is cheap in tokens and never collides with markdown inside a body. `xml` marks where an element *ends* as well as where it begins, which matters when a long body is followed by another element. `header` suits models whose guidance favours markdown sections. The dialect is applied at render time, so nothing persisted carries one — an agent can change model without its history changing.

## Tool Resolution

Tools in the `config.tools` array are resolved to grid operations at runtime:

```json
"tools": [
  "v/ops/covia/read",
  "v/ops/covia/write",
  { "operation": "v/ops/http/get", "name": "fetch_url", "description": "Fetch a web page" }
]
```

**String entries** resolve directly to an operation in the venue's catalog. The tool name presented to the LLM is derived from the operation path (e.g., `v/ops/covia/read` becomes `covia_read`).

**Map entries** allow you to customise the tool name and description shown to the LLM, while still pointing to the same underlying operation.

The palette merges harness tools, configured tools and loads-contributed tools, **in that order** — a name already fixed by the harness or by config is never shadowed by a skill you load.

### Tool Naming

Tool names follow a consistent **snake_case** convention. Venue operations are written as `adapter:op` or as a lattice path (`v/ops/covia/read`); when presented to an LLM the colons and slashes become underscores (`covia_read`, `agent_request`). The framework maps the snake_case name back to the operation when dispatching the call.

The built-in **harness tools** are already snake_case: `complete_task`, `fail_task`, `context_load`, `context_unload`, `skill_load` (LLM Agent), plus `subgoal`, `complete`, `fail`, `compact`, `more_tools` (Goal Tree).

`complete_task` / `fail_task` are offered **only while a task is outstanding** — one task boundary, the same on both runtimes.

### Runtime Discovery

Agents using the Goal Tree adapter can call the `more_tools` harness tool to discover additional operations available on the venue beyond their configured set. This enables agents to adapt to their environment without needing every tool pre-configured.

Resolution is live, so a configured tool that fails to resolve this cycle is reported in the tail rather than silently missing — and a fixed path or a restored grant makes it available on the next cycle with no recreate.

## Context Loading

Agents can load lattice data into their persistent context in two ways:

### Static Context (config)

Paths listed in `config.context` are loaded every turn:

```json
"context": [
  { "ref": "w/docs/policy", "label": "Company Policy" },
  { "ref": "w/vendor-records/acme", "label": "ACME Vendor Record" },
  { "op": "v/ops/covia/list", "input": { "path": "w/vendors" }, "label": "Known Vendors" }
]
```

- `ref` entries resolve a lattice path and render the value
- `op` entries invoke an operation and inject the output

An **op entry runs fresh on every inference**, under the caller's identity — so an assemble op must be read-only. A write-on-assemble fires every inference.

### Dynamic Context (tools)

During execution, agents can manage their own loaded context:

```json
// Load a path (persists across turns)
{ "name": "context_load", "input": { "path": "w/reports/Q1", "label": "Q1 Report", "budget": 5000 } }

// Unload when no longer needed
{ "name": "context_unload", "input": { "path": "w/reports/Q1" } }
```

Loaded paths persist across turns and are re-read from the lattice on every inference — never frozen at load time.

### Resolution outcomes

The contract every entry obeys, in either role:

| Outcome | Behaviour |
|---------|-----------|
| Absent, empty, or returns null | **Skipped** quietly — context is supplementary |
| Resolution **errors** | A visible `[… — unavailable: <reason>]` element, so the model can adapt |
| `required: true` and fails | **Throws** — fails the cycle |
| Malformed `context` value | **Throws** — a configuration error to fix, not mask |

Failures are visible, never silent: a load that stops resolving renders as unavailable rather than vanishing, because a missing element changes behaviour too much to hide.

### One-Shot Reads

For data needed once, agents can call `covia:read` directly — this returns the value in the tool result without persisting it in the context across turns.

### The scope chain

Loads live in tiers, outer to inner:

```
agent (config.loads) → session (sessions.<sid>.loads) → frame (frame.loads, Goal Tree)
```

Assembly is a union down the chain, and inner shadows outer on a path collision. Unloading an outer-tier path writes a **tombstone** at the innermost tier — masking it from there inward while leaving the outer entry untouched. A Goal Tree subgoal inherits configured context but starts with its own empty agent-managed set, so it curates loads for its sub-task without polluting its parent or siblings.

## Skills

Where `config.context` pins knowledge the agent always needs, **skills** are the on-demand complement: named bundles of instructions, context, and tools that the agent loads mid-task.

Two **declared kinds**, never inferred from what a reference happens to resolve to:

```json
"skillsets": ["w/skills", "v/skills/root"],
"skills": ["v/skills/ops-tools/models", "a/8cd17cbd…"]
```

- **`config.skillsets`** — each ref is a *directory* of skills. This is what the standard templates declare.
- **`config.skills`** — each ref is exactly *one* skill: a stable path or an asset ref. This is how a role-specific template curates a compact index.

A skillset ref declared under `skills` is not walked as a directory — the kinds do not interchange. Resolution is skills before skillsets, each in declaration order, with name collisions resolved first-wins, so an explicitly named skill always beats a same-named member of a skillset.

Declaring either kind does two things: it injects a compact index into every turn, and it offers the agent the `skill_load` tool. An agent declaring neither behaves exactly as if skills did not exist.

### The index

```
[Skills]
Named skill packs you can load with skill_load({name: "..."}).
- workspace — Read and write your durable lattice workspace
- code-review — Review code against the house style (loaded)
```

One line per skill, with `(loaded)` against those already in context, resolved fresh each turn. It is rendered by the same function [`skills:list`](../adapters/skills) uses, so the injected index and the operation's output cannot drift.

### Loading

```json
// The agent acquires a capability it wasn't configured with
{ "name": "skill_load", "input": { "name": "workspace" } }

// ...and puts it down when finished
{ "name": "context_unload", "input": { "path": "v/skills/data/workspace" } }
```

Loading a skill injects its body, loads its bundled context entries, and adds its tools to the palette — all as one entry in the same loads tier `context_load` uses, so budgets, eviction and `context_unload` apply unchanged. Each loaded element carries its **unload key in its own header** (`[Skill: workspace — v/skills/data/workspace]`), because `context_unload` takes a path while a skill is otherwise only ever named.

Bodies re-resolve each turn, so editing a skill takes effect on the next turn of every agent carrying it. A `name` that matches nothing fails with a message naming the skills that *are* available, so an agent can correct itself rather than guess again.

### Skills reveal skills

A loaded skill may contribute further sources of both kinds, through `skill.skills` and `skill.skillsets` — the skill equivalent of `skill.tools`. Children are **discovered, not auto-loaded**: loading `workspace` makes the skills under `v/skills/data` addressable and lists them in the next index, and `skill_load` reports `revealed` — the skills that load newly made discoverable — so a reader is told what it gained instead of diffing two indexes.

The resolver never walks an unloaded subtree, so cycles are inert and a broad hierarchy does not flood the prompt. That is what keeps the shipped venue library at an eight-line always-on index with every skill one load away.

Loading grants no authority: a skill's tools are still capability-checked at invocation, exactly as before it was loaded.

Anyone can browse the same skills without an agent, with [`skills:list` and `skills:read`](../adapters/skills). See the [Teach an Agent a New Skill](../tutorials/skills) tutorial and [COG-18](../../protocol/cogs/COG-018).

## Context Budgets

**There is one budget: the model's declared context size.** It is `model.budget.bytes` on the LLM operation asset, resolved for the agent's model — the size of a context is a fact about the model, declared beside the model, not a venue-wide constant. It bounds the *input*, counted as UTF-8 bytes of every message's content plus the tool definitions, which are charged first. The reply is bounded separately by `maxTokens`.

How it is spent:

- The **fixed head** and the **live surface** are what they are. Loads are never evicted — the agent put them there and only the agent takes them out.
- The **conversation** is the elastic band. It receives the remaining allowance.
- The **tail** is small, charged like everything else, and never cached.

What the budget does, and nothing else:

| Position | Behaviour |
|----------|-----------|
| any | Per-entry render sizing — a structured entry is capped at a twentieth of what remains when it renders |
| ≥ 70% | The tail carries one `[Context budget]` line saying the budget is filling, and that every element's header is its unload key |
| ≥ 90% | The line says compaction is required before further work; the Goal Tree harness offers `compact` |
| over | The prompt is sent anyway; if the provider rejects it, the cycle fails with the size and the remedy |

**Never silent.** Byte accounting is not a token bound across providers, so the runtime never removes context on its own authority.

The conversation band has exactly two sanctioned rewrites, both deliberate trades of cache for context size:

- **Scratch elision** (the default; `renderHistory: "full"` opts out) — a completed cycle renders as its user input and final assistant reply, its tool calls and their results dropped together.
- **Compaction** — a range of turns collapses into a `[Compacted: N turns]` segment whose summary *the agent wrote*, because only the agent knows what mattered.

## Capabilities

Capabilities restrict what paths and operations an agent can access:

```json
"caps": [
  { "with": "w/vendor-records/", "can": "crud/read" },
  { "with": "w/enrichments/", "can": "crud" }
]
```

### Disclosure

For an agent that has tools, its declared capabilities are stated in the fixed head, so the LLM knows what it can and cannot do before it hits a bound. This saves the cycle an agent otherwise spends discovering its limits by tripping over them, and the confusing denial that follows. An agent with no tools gets no notice — there is nothing the bounds would inform.

### Enforcement

When a tool call is denied due to insufficient capabilities, the error message:
- Explains which capability was required
- Lists the agent's available capabilities
- States that retrying will not help

This helps the LLM adjust its approach rather than retrying the same denied action.

### Capability Levels

| Level | Includes |
|-------|----------|
| `crud/read` | Read operations only |
| `crud/write` | Write operations only |
| `crud` | Full CRUD (read, write, delete, append) |

The `with` field is a path prefix — `"w/vendor-records/"` grants access to everything under that path.

## Lattice Namespaces

Agents interact with data via lattice paths:

| Prefix | Description |
|--------|-------------|
| `w/` | User workspace — persistent data managed on the user's behalf |
| `o/` | Operation pins — named operations saved for reuse |
| `n/` | Agent-private notes — persists across transitions, private to this agent |
| `t/` | Temporary scratch space — cleaned up when the job ends |
| `g/` | Agent records — state, timelines, config for all agents |
| `s/` | Secrets — API keys and credentials |
| `j/` | Job records — status and results of past work |
| `a/` | Assets — immutable content-addressed artefacts |
| `v/ops/` | Venue operations catalog — shared, read-only |

Deep path navigation is supported: `w/records/123/name`, `g/agent/timeline/0/end`.

This reference is itself a **skill** — `v/skills/data/lattice`, mirrored into `v/skills/root` — rather than a permanent section of every system prompt. Not every agent has tools, and not every agent with tools touches the lattice, so the templates for those that do pin it through `config.loads`, and any other agent can discover and load it.

## Inbound Channels

Agents receive work through three channels. Tasks, chats, and messages all attach to a [session](./sessions) — the persistent conversation thread the run loop processes one at a time.

| Channel | Persistence | Tracking | Use for |
|---------|-------------|----------|---------|
| **Tasks** (via `agent:request`) | Persistent — survive restarts | Each is a Job with status | Formal requests requiring a response |
| **Chats** (via `agent:chat`) | Per-session | A chat Job awaiting the next reply | Conversational, back-and-forth interaction |
| **Messages** (via `agent:message`) | Queued on the session, consumed on next run | Recorded in the timeline | One-way notifications |
| **Pending results** | Persistent | Linked to outbound Job IDs | Completions of work the agent delegated |

Tasks persist until completed or failed. Messages are drained after processing. Pending results wake the agent automatically when the outbound job completes.

## Inspecting the real thing

You never have to reason about assembly from this page alone. [`agent:context`](./operations#agent-context) returns the exact prompt an agent would receive for a call you describe, with its budget and band marks; [`agent:step`](./operations#agent-step) runs one harness iteration on a reply you supply, dispatching the tool calls for real, and hands back the next prompt.

## Related

- [Creating Agents](./creating-agents) — configuration reference
- [Teach an Agent a New Skill](../tutorials/skills) — skills end to end
- [Skills Adapter](../adapters/skills) — the read surface and the venue library
- [LLM Agent](./llm-agent) — simple conversational model
- [Goal Tree](./goal-tree) — hierarchical goal decomposition
- [LLM Backends](./llm-backends) — configuring the Level 3 provider
