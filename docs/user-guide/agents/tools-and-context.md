---
title: Tools and Context
sidebar_position: 6
---

# Tools and Context

Every agent turn, the context builder assembles the complete input for the LLM — system prompt, tools, loaded context, and conversation history. Understanding this pipeline helps you configure agents effectively and debug unexpected behaviour.

## Context Assembly Pipeline

Each turn, the context is rebuilt fresh (never frozen from the first turn):

1. **System prompt** — from `config.systemPrompt`, plus capability disclosure and lattice namespace reference
2. **Config tools** — resolved from `config.tools` array
3. **Default tools** — 19 standard operations (when `defaultTools: true`)
4. **Context entries** — from `config.context` array, resolved and rendered
5. **Loaded paths** — from `context_load` calls, rendered at assigned budgets
6. **Pending results** — completions of outbound jobs the agent is waiting on
7. **Inbox messages** — ephemeral notifications
8. **Transcript** — conversation history (LLM Agent) or current frame (Goal Tree)

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

### Runtime Discovery

Agents using the Goal Tree adapter can call the `more_tools` harness tool to discover additional operations available on the venue beyond their configured set. This enables agents to adapt to their environment without needing every tool pre-configured.

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

### Dynamic Context (tools)

During execution, agents can manage their own loaded context:

```json
// Load a path (persists across turns)
{ "name": "context_load", "input": { "path": "w/reports/Q1", "label": "Q1 Report", "budget": 5000 } }

// Unload when no longer needed
{ "name": "context_unload", "input": { "path": "w/reports/Q1" } }
```

Loaded paths persist in `state.loads` and are re-rendered fresh each turn.

### One-Shot Reads

For data needed once, agents can call `covia:read` directly — this returns the value in the tool result without persisting it in the context across turns.

## Context Budgets

Each context entry has a byte budget. The context builder uses budget-aware rendering:

- **High budget** — full detail, all fields and nested structures
- **Low budget** — summarised, key fields only
- **Compacted segments** (Goal Tree) — summaries at low budget, full turns at high budget

Default total context budget is ~180,000 bytes (~45,000 tokens).

The Goal Tree adapter manages budget pressure automatically:
- At 70% capacity: suggests compaction
- At 90% capacity: warns compaction is required
- Beyond 90%: truncates oldest live turns

## Capabilities

Capabilities restrict what paths and operations an agent can access:

```json
"caps": [
  { "with": "w/vendor-records/", "can": "crud/read" },
  { "with": "w/enrichments/", "can": "crud" }
]
```

### Disclosure

Capabilities are included in the agent's system prompt so the LLM knows what it can and cannot do. This eliminates trial-and-error discovery.

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

Agents interact with data via lattice paths. The system prompt includes a reference to available namespaces:

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

## Inbound Channels

Agents receive work through three channels:

| Channel | Persistence | Tracking | Use for |
|---------|-------------|----------|---------|
| **Tasks** (via `agent:request`) | Persistent — survive restarts | Each is a Job with status | Formal requests requiring a response |
| **Messages** (via `agent:message`) | Ephemeral — consumed on next run | Recorded in timeline | One-way notifications |
| **Pending results** | Persistent | Linked to outbound Job IDs | Completions of work the agent delegated |

Tasks persist until completed or rejected. Messages are drained after processing. Pending results wake the agent automatically when the outbound job completes.

## Related

- [Creating Agents](./creating-agents) — configuration reference
- [LLM Agent](./llm-agent) — simple conversational model
- [Goal Tree](./goal-tree) — hierarchical goal decomposition
- [LLM Backends](./llm-backends) — configuring the Level 3 provider
