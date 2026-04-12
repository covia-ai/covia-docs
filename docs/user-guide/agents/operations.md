---
title: Agent Operations
sidebar_position: 3
---

# Agent Operations

This page documents every operation available for managing agent lifecycle and interaction. All operations are invoked via the REST API (`POST /api/v1/invoke`) or as MCP tools.

## Running Agents

### agent:trigger

Force the agent's transition loop to run, even with no pending work.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `wait` | boolean / number | `true` | Wait for completion. `true` blocks, `false` returns immediately, number sets timeout in ms. |

```json
{ "operation": "agent:trigger", "input": { "agentId": "Alice", "wait": true } }
```

When no work is pending, the agent receives a clear signal and can choose to act proactively or report idle.

### agent:request

Send a persistent task to the agent. Each task is tracked as a Job.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `input` | any | *required* | Task data (passed to the agent as a goal) |
| `wait` | boolean / number | `false` | Wait for result. `true` blocks, number sets timeout in ms. |

```json
{
  "operation": "agent:request",
  "input": {
    "agentId": "Alice",
    "input": { "question": "What vendors are overdue?" },
    "wait": true
  }
}
```

**Response** includes the Job ID, status, and output (when waited):

```json
{
  "jobId": "0x1234...",
  "status": "COMPLETE",
  "output": { "answer": "Three vendors are overdue..." }
}
```

Async mode (`wait: false`) returns immediately with the Job ID in PENDING state. Poll the job or use SSE to track completion.

### agent:message

Send a fire-and-forget notification. Messages are ephemeral — consumed on the next run and recorded in the timeline, but not tracked as jobs.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `message` | string | *required* | Notification text |

```json
{
  "operation": "agent:message",
  "input": {
    "agentId": "Alice",
    "message": "New invoice uploaded to w/invoices/INV-2026-042"
  }
}
```

Use messages for one-way alerts where no response is needed.

## Lifecycle Management

### agent:create

Create a new agent. See [Creating Agents](./creating-agents) for full configuration details.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `config` | object / string | — | Inline config map, template name, workspace path, or asset reference |
| `state` | any | — | Initial agent state |
| `overwrite` | boolean | `false` | Replace existing agent |

### agent:update

Update agent configuration or state without recreating.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `config` | object | — | New configuration (merged) |
| `state` | any | — | New state |

Only `config` and `state` can be updated. Framework-managed fields (status, tasks, timeline) are not affected.

```json
{
  "operation": "agent:update",
  "input": {
    "agentId": "Alice",
    "config": { "systemPrompt": "Updated instructions..." }
  }
}
```

### agent:fork

Create a new agent from an existing agent's complete state — including conversation history.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sourceId` | string | *required* | Source agent to fork from |
| `agentId` | string | *required* | New agent identifier |
| `config` | object / string | — | Config override (merged on top of source) |
| `includeTimeline` | boolean | `false` | Copy the source's timeline |

```json
{
  "operation": "agent:fork",
  "input": {
    "sourceId": "Alice",
    "agentId": "Alice-v2",
    "config": { "systemPrompt": "Try a different approach..." }
  }
}
```

The forked agent starts SLEEPING with empty tasks, pending jobs, and inbox — but inherits the source's conversation history and configuration.

**Use cases:**
- **Branching exploration** — fork with a modified system prompt to try a different approach from the same context
- **Scaling** — fork a trained agent to handle parallel workloads
- **Recovery snapshots** — fork before risky operations with `includeTimeline: true`

### agent:suspend

Manually pause an agent. Prevents future runs; any in-flight run completes before suspension takes effect.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |

### agent:resume

Resume a suspended agent. Clears the error and returns to SLEEPING.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `autoWake` | boolean | `true` | If there is pending work, start the agent immediately |

### agent:delete

Terminate an agent.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `remove` | boolean | `false` | Permanently delete the record (frees the name) |

By default, the agent is marked TERMINATED — preserving its audit trail. Use `remove: true` to delete the record entirely.

### agent:cancelTask

Remove a pending task from an agent's queue.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `taskId` | string | *required* | Task Job ID (hex) |

## Inspection

### agent:info

Get a lightweight summary of an agent.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |

**Response:**

```json
{
  "agentId": "Alice",
  "status": "SLEEPING",
  "config": { "operation": "v/ops/goaltree/chat", "model": "gpt-4o" },
  "taskCount": 2,
  "timelineLength": 15,
  "error": null
}
```

### agent:list

List all agents owned by the caller.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeTerminated` | boolean | `false` | Include terminated agents |

### agent:context

Inspect the exact LLM context an agent would receive — the complete Level 3 input as assembled by the context builder.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `task` | any | — | Optional task to simulate (shows first-iteration context) |

**Response** includes the system prompt, context entries with byte sizes, tool definitions, and message history. Invaluable for debugging agent behaviour.

```json
{
  "operation": "agent:context",
  "input": {
    "agentId": "Bob",
    "task": { "invoice": "INV-2026-042" }
  }
}
```

## Deep Inspection via Lattice

For detailed debugging beyond `agent:info`, read the agent's lattice state directly:

| Path | Contents |
|------|----------|
| `g/<agentId>/state/config` | Full agent configuration |
| `g/<agentId>/state/history` | Conversation history |
| `g/<agentId>/timeline` | Complete audit trail (append-only) |
| `g/<agentId>/inbox` | Pending messages |
| `g/<agentId>/tasks` | Pending task Job IDs |

```json
{
  "operation": "covia:read",
  "input": { "path": "g/Alice/timeline" }
}
```

### Timeline Entries

Each successful run appends a timeline entry:

```json
{
  "start": 1712930400000,
  "end": 1712930412000,
  "op": "v/ops/goaltree/chat",
  "tasks": [{ "question": "Summarise vendor records" }],
  "messages": [],
  "result": { "answer": "Three vendors..." },
  "taskResults": { "0x1234": { "status": "COMPLETE", "output": { ... } } }
}
```

## Error Handling and Recovery

When an agent transition fails:

1. The error is recorded in `agent.error`
2. Status transitions to **SUSPENDED**
3. Tasks, inbox, and pending jobs are preserved
4. The timeline is **not** updated (no entry for failed runs)

**To recover:**

1. Inspect the error: `agent:info agentId: "Alice"`
2. Fix the root cause (missing tool, bad credentials, capability issue)
3. Resume: `agent:resume agentId: "Alice"`
4. The agent returns to SLEEPING and processes pending work

## Related

- [Creating Agents](./creating-agents) — configuration and templates
- [Tools and Context](./tools-and-context) — how tools and context are assembled
- [COG-004: Agents](/docs/protocol/cogs/COG-004) — Protocol specification
