---
id: orchestrator
title: Orchestrator
sidebar_label: Orchestrator
---

# Orchestrator

The Orchestrator executes multi-step workflows as directed acyclic graphs (DAGs). Steps run in parallel where possible, with automatic dependency resolution and result composition.

## How It Works

An orchestration is a sequence of steps. Each step invokes a grid operation and can reference outputs from earlier steps. Independent steps run in parallel; dependent steps wait for their inputs.

```
Step 0: Extract invoice data     ─┐
Step 1: Look up vendor           ─┤── (parallel, no dependencies)
Step 2: Validate (needs 0 + 1)   ─┘── (waits for both)
Step 3: Approve (needs 2)        ──── (sequential)
```

## Defining an Orchestration

Orchestrations are defined as operation assets with an `orchestrator` adapter:

```json
{
  "name": "Invoice Pipeline",
  "operation": {
    "adapter": "orchestrator",
    "steps": [
      {
        "op": "v/ops/agent/request",
        "input": {
          "agentId": ["const", "Alice"],
          "input": ["input", "invoice"],
          "wait": ["const", true]
        }
      },
      {
        "op": "v/ops/agent/request",
        "input": {
          "agentId": ["const", "Bob"],
          "input": [0, "output"],
          "wait": ["const", true]
        }
      },
      {
        "op": "v/ops/agent/request",
        "input": {
          "agentId": ["const", "Carol"],
          "input": [1, "output"],
          "wait": ["const", true]
        }
      }
    ],
    "result": {
      "scanned": [0, "output"],
      "enriched": [1, "output"],
      "decision": [2, "output"]
    }
  }
}
```

## Input Resolution

Step inputs are built using a resolution syntax that references the orchestration input, constants, or outputs from earlier steps:

| Syntax | Meaning | Example |
|--------|---------|---------|
| `["input", "key"]` | Extract from orchestration input | `["input", "invoice"]` |
| `["const", value]` | Constant value | `["const", true]` |
| `[N, "field"]` | Output from step N | `[0, "output"]` |
| `["concat", parts...]` | String concatenation | `["concat", "prefix-", ["input", "id"]]` |

Resolution is recursive — maps and arrays within step inputs are resolved recursively.

**Dependency rule:** Step N can only reference steps 0 to N-1. This enforces a DAG structure with no circular dependencies.

## Execution

1. Steps with no dependencies start immediately (in parallel, using virtual threads)
2. As each step completes, dependent steps become ready and start
3. When all steps complete, the `result` expression is resolved and returned
4. If a step fails and `strict` mode is on, the orchestration fails immediately

## Step Structure

```json
{
  "op": "v/ops/agent/request",
  "input": { ... },
  "venue": "https://remote-venue.example.com",
  "strict": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `op` | string | Yes | Operation to invoke |
| `input` | object | No | Input with resolution expressions |
| `venue` | string | No | Remote venue URL or DID (omit for local) |
| `strict` | boolean | No | Validate output against operation schema |

## Result Composition

The `result` field defines what the orchestration returns, using the same resolution syntax:

```json
"result": {
  "scanned": [0, "output"],
  "enriched": [1, "output"],
  "decision": [2, "output"],
  "timestamp": ["const", "2026-04-12"]
}
```

## Error Handling

- If `strict: true` on a step, its output is validated against the operation's schema — violations fail the orchestration immediately
- If a step's operation fails, all steps depending on it also fail
- Independent steps continue running even if a sibling fails (unless global strict mode is set)

## Patterns

### Agent Pipeline

Chain agents where each processes the previous one's output:

```json
"steps": [
  { "op": "v/ops/agent/request", "input": { "agentId": ["const", "Scanner"], "input": ["input"], "wait": ["const", true] } },
  { "op": "v/ops/agent/request", "input": { "agentId": ["const", "Enricher"], "input": [0, "output"], "wait": ["const", true] } },
  { "op": "v/ops/agent/request", "input": { "agentId": ["const", "Approver"], "input": [1, "output"], "wait": ["const", true] } }
]
```

### Parallel Fan-Out

Independent steps run concurrently:

```json
"steps": [
  { "op": "v/ops/http/get", "input": { "url": ["const", "https://api-a.example.com/data"] } },
  { "op": "v/ops/http/get", "input": { "url": ["const", "https://api-b.example.com/data"] } },
  { "op": "v/ops/json/merge", "input": { "values": [[0, "body"], [1, "body"]] } }
]
```

Steps 0 and 1 run in parallel; step 2 waits for both.

### Cross-Venue Federation

Route individual steps to remote venues:

```json
"steps": [
  { "op": "v/ops/covia/read", "input": { "path": ["const", "w/data"] } },
  { "op": "v/ops/covia/read", "input": { "path": ["const", "w/data"] }, "venue": "did:web:partner.example.com" },
  { "op": "v/ops/json/merge", "input": { "values": [[0, "value"], [1, "value"]] } }
]
```

## Related

- [Grid Adapter](./grid-adapter) — individual operation invocation
- [JSON Adapter](./json) — data manipulation primitives for result composition
- [Agents](/docs/user-guide/agents/) — agent-based step execution
- [COG-012: Orchestrations](/docs/protocol/cogs/COG-012) — Protocol specification
