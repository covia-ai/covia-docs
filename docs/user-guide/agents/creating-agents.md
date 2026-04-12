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
  "operation": "agent:create",
  "input": {
    "agentId": "my-agent"
  }
}
```

This creates an agent with default settings: `llmagent:chat` transition, `langchain:openai` backend, `gpt-4o` model, and the platform's default tool set. It will respond conversationally to any task.

## Configuration

The `config` field controls agent behaviour. All fields are optional — defaults are sensible for general-purpose agents.

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "Bob",
    "config": {
      "operation": "v/ops/goaltree/chat",
      "systemPrompt": "You are Bob, an AP Data Enricher...",
      "model": "gpt-4o-mini",
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
| `model` | string | `gpt-4o` | LLM model name passed to the backend. |
| `llmOperation` | string | `v/ops/langchain/openai` | Level 3 LLM operation. See [LLM Backends](./llm-backends). |
| `tools` | array | — | Operations the agent can call. Strings or `{operation, name, description}` maps. |
| `defaultTools` | boolean | `true` | Include the platform's default tools (workspace CRUD, agent management, assets, schemas). Set `false` for explicit control. |
| `caps` | array | — | Capability restrictions. Each entry: `{with: "path/", can: "crud/read"}`. |
| `context` | array | — | Lattice paths to load into context every turn. |
| `outputs` | object | — | Typed output schemas for `complete` and `fail` (Goal Tree only). |
| `responseFormat` | object | — | JSON Schema for structured responses. |

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

## Templates

Instead of inline config, you can reference a template:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "reader-1",
    "config": "template:reader"
  }
}
```

### Standard Templates

Every venue provides these built-in templates:

| Template | Tools | Purpose |
|----------|-------|---------|
| `template:minimal` | None | Pure reasoning, no side effects |
| `template:reader` | read, list, slice | Read-only data analysis |
| `template:worker` | CRUD operations | General data processing |
| `template:manager` | Agent ops + read/list | Agent coordination |
| `template:analyst` | CRUD + schema ops | Data analysis with validation |
| `template:full` | All defaults | Development and exploration |

### Custom Templates

Store a config map in the workspace and reference it:

```json
// Store a template
{
  "operation": "covia:write",
  "input": {
    "path": "w/templates/invoice-scanner",
    "value": {
      "operation": "v/ops/goaltree/chat",
      "systemPrompt": "You are an invoice scanner...",
      "model": "gpt-4o-mini",
      "defaultTools": false,
      "outputs": { "complete": { "schema": { ... } } }
    }
  }
}

// Create agent from template
{
  "operation": "agent:create",
  "input": {
    "agentId": "scanner-1",
    "config": "w/templates/invoice-scanner"
  }
}
```

Templates can also be stored as assets (immutable, versioned) or referenced by DID URL for cross-venue use.

## Initial State

An agent can be created with pre-populated state by including a `state` field at the top level:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "Alice",
    "config": { "operation": "v/ops/goaltree/chat" },
    "state": {
      "config": {
        "model": "gpt-4o-mini",
        "systemPrompt": "You are Alice...",
        "tools": ["v/ops/covia/read"]
      }
    }
  }
}
```

The `state` is opaque to the framework — its structure depends on the Level 2 adapter. For both `llmagent:chat` and `goaltree:chat`, the state includes a `config` sub-map with LLM settings.

## Idempotent Creation

By default, `agent:create` is idempotent. If an agent with the given ID already exists:
- The call succeeds (no error)
- The existing agent is unchanged
- The response indicates `created: false`

To replace an existing agent, use `overwrite: true`:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "Alice",
    "overwrite": true,
    "config": { "systemPrompt": "Updated instructions..." }
  }
}
```

This updates the config in place for SLEEPING or SUSPENDED agents. For TERMINATED agents, it revives the agent with fresh state.

## AP Demo Example

The AP Invoice Audit Trail demo creates a team of specialised agents:

```json
// Alice: Invoice Scanner (minimal tools, structured output)
{
  "agentId": "Alice",
  "config": { "operation": "v/ops/goaltree/chat" },
  "state": { "config": {
    "model": "gpt-4o-mini",
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
    "model": "gpt-4.1-mini",
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
    "model": "gpt-4o",
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
- [LLM Backends](./llm-backends) — configuring OpenAI, Anthropic, Ollama
