---
title: Creating Agents
sidebar_position: 2
---

# Creating Agents

Agents are created with the `agent:create` operation. The key decision is **what to put in the config** — this determines the agent's personality, tools, capabilities, and LLM backend.

## Minimal Agent

The simplest possible agent has just an ID:

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "my-agent"
  }
}
```

This creates an agent with default settings: `llmagent:chat` transition, `langchain:openai` backend, that backend's default model, and the platform's default tool set. It will respond conversationally to any task.

## Configuration

The `config` field controls agent behaviour. All fields are optional — defaults are sensible for general-purpose agents.

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "Bob",
    "config": {
      "operation": "v/ops/goaltree/chat",
      "systemPrompt": "You are Bob, an AP Data Enricher...",
      "model": "gpt-5.4-mini",
      "llmOperation": "v/ops/langchain/openai",
      "tools": [
        "v/ops/covia/read",
        "v/ops/covia/write",
        "v/ops/covia/list"
      ],
      "defaultTools": false,
      "caps": [
        { "with": "w/vendor-records/", "can": "crud/read" },
        { "with": "w/enrichments/", "can": "crud" }
      ],
      "context": [
        { "ref": "w/docs/data-guide", "label": "AP Data Guide" }
      ],
      "outputs": {
        "complete": {
          "schema": {
            "type": "object",
            "properties": {
              "enrichedData": { "type": "object" },
              "confidence": { "type": "number" }
            },
            "required": ["enrichedData", "confidence"]
          }
        }
      }
    }
  }
}
```

### Config Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `operation` | string | `v/ops/llmagent/chat` | Level 2 transition function. Use `v/ops/goaltree/chat` for goal tree. |
| `systemPrompt` | string | Generic assistant | The system message defining the agent's role and instructions. |
| `model` | string | *backend default* | LLM model name passed to the backend. Ask `langchain:models` what a venue offers. |
| `llmOperation` | string | `v/ops/langchain/openai` | Level 3 LLM operation. See [LLM Backends](./llm-backends). |
| `tools` | array | — | Operations the agent can call. Strings or `{operation, name, description}` maps. |
| `defaultTools` | boolean | `true` | Include the platform's default tools (workspace CRUD, agent management, assets, schemas). Set `false` for explicit control. |
| `caps` | array | — | Capability restrictions. Each entry: `{with: "path/", can: "crud/read"}`. |
| `context` | array | — | Lattice paths to load into context every turn. |
| `skillsets` | array | — | Directories of skills (`w/skills`, `v/skills/root`). The usual declaration. |
| `skills` | array | — | Individual skills — one path or `a/<hash>` each, for a curated index. |

Declaring either kind injects the skills index and offers `skill_load`; declaring neither turns skills off entirely. The two kinds do not interchange — a directory listed under `skills` is not walked. See [Skills](./tools-and-context#skills).
| `outputs` | object | — | Typed output schemas for `complete` and `fail` (Goal Tree only). |
| `responseFormat` | string / object | — | `"text"`, `"json"`, or `{name, schema}` for strict structured responses. |

### Tools

The `tools` array lists operations the agent can invoke. Each entry is either:

- A **string** — an operation path like `"v/ops/covia/read"`
- A **map** — `{ "operation": "v/ops/covia/read", "name": "read_data", "description": "Read workspace data" }` for a custom name/description

When `defaultTools` is `true` (the default), the platform adds standard operations covering workspace CRUD, agent management, asset operations, and schema validation. Set `defaultTools: false` for full control over the tool palette.

### Capabilities

Capabilities restrict what paths and operations an agent can access. They follow the UCAN model:

```json
"caps": [
  { "with": "w/vendor-records/", "can": "crud/read" },
  { "with": "w/enrichments/", "can": "crud" }
]
```

The `with` field is a path prefix; `can` specifies the permission level (`crud/read`, `crud/write`, `crud`, etc.). Capabilities are disclosed to the agent in its system prompt so it knows what it can and cannot do. If a tool call is denied, the error message lists the agent's available capabilities.

### Context

The `context` array injects external data into the agent's context every turn:

```json
"context": [
  { "ref": "w/docs/data-guide", "label": "AP Data Guide" },
  { "ref": "w/vendor-records/acme", "label": "ACME Record" },
  { "op": "v/ops/covia/list", "input": { "path": "w/vendors" }, "label": "Known Vendors" }
]
```

Each entry can be:
- `ref` — a lattice path, resolved and rendered fresh each turn
- `op` — an operation to invoke, whose output is injected as context

Context entries are budget-aware — large values are automatically summarised to fit within the context window.

### Typed Outputs (Goal Tree)

When using the Goal Tree adapter, you can enforce structured output via `outputs`:

```json
"outputs": {
  "complete": {
    "schema": {
      "type": "object",
      "properties": {
        "result": { "type": "string" },
        "confidence": { "type": "number" }
      },
      "required": ["result", "confidence"],
      "additionalProperties": false
    }
  },
  "fail": {
    "schema": {
      "type": "object",
      "properties": {
        "reason": { "type": "string" },
        "details": { "type": "string" }
      },
      "required": ["reason"],
      "additionalProperties": false
    }
  }
}
```

This wraps the `complete` and `fail` harness tools with strict JSON schema enforcement via the LLM's structured output mode.

**Per-request override:** a caller can pass a `responseSchema` on [`agent:request`](./operations#agent-request) to get typed output from any agent for a single call — no `outputs` config required. It overrides the agent's default output schema for that request.

## Templates

Instead of inline config, you can reference a template:

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "reader-1",
    "config": "template:reader"
  }
}
```

A `template:<name>` reference resolves to the venue's template catalog at `v/agents/templates/<name>`.

### Standard Templates

Every venue provides these built-in templates:

| Template | Tools | Purpose |
|----------|-------|---------|
| `template:skilled` | read, list + [skills](./tools-and-context#skills) | **Recommended default** — lean base, capabilities loaded on demand |
| `template:goaltree` | Skills, no default tools | A [Goal Tree](./goal-tree) agent — `v/ops/goaltree/chat`, for goals worth decomposing |
| `template:minimal` | None | Pure reasoning, no side effects |
| `template:reader` | read, list, slice | Read-only data analysis |
| `template:worker` | CRUD operations | General data processing |
| `template:manager` | Agent ops + read/list | Agent coordination |
| `template:analyst` | CRUD + schema ops | Data analysis with validation |
| `template:full` | All defaults | Development and exploration |

Templates are ordinary lattice values under `v/agents/templates/`, so `v/ops/covia/list` on that path tells you what a given venue actually offers.

### Custom Templates

Store a config map in the workspace and reference it:

```json
// Store a template
{
  "operation": "v/ops/covia/write",
  "input": {
    "path": "w/templates/invoice-scanner",
    "value": {
      "operation": "v/ops/goaltree/chat",
      "systemPrompt": "You are an invoice scanner...",
      "model": "gpt-5.4-mini",
      "defaultTools": false,
      "outputs": { "complete": { "schema": { ... } } }
    }
  }
}

// Create agent from template
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "scanner-1",
    "config": "w/templates/invoice-scanner"
  }
}
```

A `config` string reference can be any of:

- a **template** name — `template:worker` (resolves to `v/agents/templates/worker`)
- a **workspace path** — `w/templates/invoice-scanner`
- an **asset reference** — `a/<hash>` (immutable, content-addressed)
- a **DID URL** — for a template hosted on another venue (cross-venue use)
- a **venue operation name**

Explicit fields you pass alongside the reference are merged on top of the resolved config.

## Initial State

An agent can be created with pre-populated state by putting `state` **inside a config layer** — a resolved config composition may carry it, and it is then used as the agent's initial state. (`state` is a top-level field of `agent:update`, not of `agent:create`.)

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "Alice",
    "config": {
      "operation": "v/ops/goaltree/chat",
      "state": {
        "config": {
          "model": "gpt-5.4-mini",
          "systemPrompt": "You are Alice...",
          "tools": ["v/ops/covia/read"]
        }
      }
    }
  }
}
```

To set state on an agent that already exists, `agent:update` takes `state` at the top level.

The `state` is opaque to the framework — its structure depends on the Level 2 adapter. For both `llmagent:chat` and `goaltree:chat`, the state includes a `config` sub-map with LLM settings.

## Creating over an existing agent

`agent:create` requires an **unused** name. If an agent with that id already exists the call **fails** — it is not idempotent, and it does not silently leave the existing agent in place:

```
Agent already exists: Alice; update it, or delete it with remove=true before creating it again
```

There is no `overwrite` flag; a request carrying one fails with a message saying so. The two ways forward are deliberate, because they differ in what happens to the agent's history:

**Change it in place** — `agent:update` merges config or state and preserves the agent's sessions, tasks and timeline. This is what you almost always want:

```json
{
  "operation": "v/ops/agent/update",
  "input": {
    "agentId": "Alice",
    "config": { "systemPrompt": "Updated instructions..." }
  }
}
```

**Replace it outright** — `agent:delete` with `remove: true` frees the name, discarding the record, after which `agent:create` succeeds again. Deleting without `remove` leaves the agent TERMINATED: the audit record survives and the name stays taken.

Making the destructive path explicit is the point. An `overwrite` flag quietly decided, on the caller's behalf, whether a running agent's history was worth keeping.

## AP Demo Example

The AP Invoice Audit Trail demo creates a team of specialised agents:

```json
// Alice: Invoice Scanner (minimal tools, structured output)
{
  "agentId": "Alice",
  "config": { "operation": "v/ops/goaltree/chat" },
  "state": { "config": {
    "model": "gpt-5.4-mini",
    "defaultTools": false,
    "systemPrompt": "You are Alice, an AP Invoice Scanner...",
    "outputs": { "complete": { "schema": { ... } } }
  }}
}

// Bob: Data Enricher (workspace access, vendor lookup)
{
  "agentId": "Bob",
  "config": { "operation": "v/ops/goaltree/chat" },
  "state": { "config": {
    "model": "gpt-5.4-mini",
    "tools": ["v/ops/covia/read", "v/ops/covia/write", "v/ops/covia/list"],
    "caps": [
      { "with": "w/vendor-records/", "can": "crud/read" },
      { "with": "w/enrichments/", "can": "crud" }
    ],
    "context": [
      { "ref": "w/docs/data-guide", "label": "AP Data Guide" }
    ],
    "outputs": { "complete": { "schema": { ... } } }
  }}
}

// Carol: Payment Approver (read all, write decisions)
{
  "agentId": "Carol",
  "config": { "operation": "v/ops/goaltree/chat" },
  "state": { "config": {
    "model": "gpt-5.4-mini",
    "tools": ["v/ops/covia/read", "v/ops/covia/write", "v/ops/covia/list"],
    "caps": [
      { "with": "w/", "can": "crud/read" },
      { "with": "w/decisions/", "can": "crud" }
    ],
    "outputs": { "complete": { "schema": { ... } } }
  }}
}
```

Each agent has the minimum tools and capabilities needed for its role — following the principle of least privilege.

## Related

- [Agent Operations](./operations) — full lifecycle reference (trigger, request, fork, etc.)
- [Tools and Context](./tools-and-context) — tool resolution, context loading, budgets
- [LLM Backends](./llm-backends) — configuring OpenAI, Anthropic, Ollama, xAI
- [Capabilities](../capabilities) — the UCAN capability model behind the `caps` field
