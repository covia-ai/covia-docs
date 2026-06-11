---
title: Agent Operations
sidebar_position: 3
---

# Agent Operations

This page documents every operation available for managing agent lifecycle and interaction. All operations are invoked via the REST API (`POST /api/v1/invoke`) or as MCP tools.

Work reaches an agent through a **session** — a persistent conversation thread. `agent:request`, `agent:chat`, and `agent:message` all attach to a session (minting a new one if you don't supply a `sessionId`). See [Sessions](./sessions) for the full model.

## Running Agents

### agent:request {#agent-request}

Send a tracked task to an agent. The task is recorded as a Job. This is the primary tool for agent delegation. It is **best-effort synchronous**: it waits up to `timeout` ms for the agent to finish.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `input` | object | *required* | Task payload — the instructions/data the agent needs. Never empty. |
| `timeout` | integer (ms) | `5000` | How long to wait synchronously. `0` returns a snapshot immediately (pure async). |
| `responseSchema` | object | — | JSON Schema constraining the agent's response (server-side structured output). Overrides the agent's default output schema. |
| `sessionId` | string (hex) | — | Continue an existing session. Omit to mint a new one (returned in the response). |

```json
{
  "operation": "agent:request",
  "input": {
    "agentId": "Alice",
    "input": { "task": "What vendors are overdue?" },
    "timeout": 30000
  }
}
```

**If the agent completes within `timeout`,** the response is its structured output. **If not,** you get a snapshot to poll:

```json
{ "id": "0x1234...", "status": "STARTED", "agentId": "Alice", "sessionId": "0xabcd..." }
```

Poll for the result with `grid:jobResult` (`grid_job_result`), passing that `id` and a `timeout`. The response always carries the `sessionId` the task belonged to.

### agent:chat {#agent-chat}

Send a message and synchronously await the agent's next response on the session. The A2A `message/send` analogue — use it for conversational interactions where you want a reply.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `message` | any | *required* | Message content — string, object, or any JSON value |
| `sessionId` | string (hex) | — | Echo a previous `sessionId` to continue the conversation. Omit to start a new session. An unknown `sessionId` is rejected. |

```json
{
  "operation": "agent:chat",
  "input": { "agentId": "Alice", "message": "Summarise the vendor records" }
}
```

**Response:**

```json
{ "agentId": "Alice", "sessionId": "0xabcd...", "response": "Three vendors are overdue..." }
```

Only one chat may be in flight per session — concurrent calls on the same session are rejected.

### agent:message {#agent-message}

Send a fire-and-forget notification. The message is delivered into the session and consumed on the agent's next run — **no response is returned** and no Job is created.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `message` | string | *required* | Notification text |
| `sessionId` | string (hex) | — | Deliver into an existing session. Omit to mint a new one. |

```json
{
  "operation": "agent:message",
  "input": {
    "agentId": "Alice",
    "message": "New invoice uploaded to w/invoices/INV-2026-042"
  }
}
```

Use messages for one-way alerts where no reply is needed.

### agent:trigger

A fallback kick that nudges the agent's run loop to execute a cycle. **Not a result-getter** — it carries no payload and makes no guarantee about output. Use it after a manual state edit, for diagnostics, or to resume a stuck agent. For results, await the relevant task or chat Job instead.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `force` | boolean | `true` | `true`: run even with no outstanding work. `false`: no-op if idle (the scheduler fires deferred wakes with `force=false`). |
| `wait` | boolean / number | `true` | `true` blocks until the cycle yields/completes, `false` returns immediately, a number sets a timeout in ms. Not a result-await. |
| `sessionId` | string (hex) | — | Resolved and echoed back if supplied; trigger never creates a session. |

```json
{ "operation": "agent:trigger", "input": { "agentId": "Alice", "force": false } }
```

## Task Completion

These are framework tools an agent transition calls (typically as an LLM tool call) to finish a task. The `agentId` and `taskId` are read from the request context — the framework populates them when dispatching a task transition, so neither is a parameter. Without a task in scope the call fails.

### agent:complete-task

Marks the in-scope task complete and delivers the result to the caller. Exposed to LLMs as the tool **`agent_complete_task`**.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `result` | any | — | The successful result to deliver. Open schema — any structured value. |

### agent:fail-task

Marks the in-scope task failed. Exposed to LLMs as the tool **`agent_fail_task`**.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `error` | string | *required* | Human-readable failure reason. |

## Lifecycle Management

### agent:create

Create a new agent. See [Creating Agents](./creating-agents) for full configuration details.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `config` | object / string | — | Inline config map, or a string reference: template (`template:worker`), workspace path (`w/templates/reader`), asset ref (`a/<hash>`), DID URL, or venue operation name. |
| `state` | any | — | Initial agent state |
| `overwrite` | boolean | `false` | Replace/update an occupied slot (SLEEPING/SUSPENDED update in place; TERMINATED wipes and re-creates; RUNNING is rejected). |

### agent:update

Update agent configuration or state without recreating. `config` is shallow-merged.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `config` | object | — | Configuration fields to merge |
| `state` | any | — | State to merge or replace |

Framework-managed fields (status, tasks, timeline, sessions) are not affected.

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

Create a new agent from an existing agent's configuration and state.

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

The forked agent starts SLEEPING with fresh tasks and sessions, inheriting the source's configuration (and timeline if requested). The source agent is untouched.

**Use cases:**
- **Branching exploration** — fork with a modified system prompt to try a different approach
- **Scaling** — fork a configured agent to handle parallel workloads
- **Recovery snapshots** — fork before risky operations with `includeTimeline: true`

### agent:suspend

Manually pause an agent. Prevents future runs; any in-flight run completes first.

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

By default the agent is marked TERMINATED — preserving its audit trail. Use `remove: true` to delete the record entirely.

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
  "config": { "operation": "v/ops/goaltree/chat", "model": "gpt-5.4-mini" },
  "tasks": 2,
  "timelineLength": 15,
  "error": null
}
```

### agent:list

List all agents owned by the caller.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeTerminated` | boolean | `false` | Include terminated agents |

### agent:context {#agent-context}

Inspect the exact LLM context an agent would receive — the complete Level 3 input as assembled by the context builder. Requires the agent's transition adapter to support inspection (the built-in adapters do).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `task` | any | — | Optional task to simulate as a goal (shows first-iteration context) |

The response is the L3 input as JSON — system prompt, context entries with byte sizes, tool definitions, and conversation. Invaluable for debugging agent behaviour.

## Deep Inspection via Lattice

For detailed debugging beyond `agent:info`, read the agent's lattice state directly with `covia:read` / `covia:list` / `covia:slice`:

| Path | Contents |
|------|----------|
| `g/<agentId>/sessions` | Index of sessions (keyed by session id) |
| `g/<agentId>/sessions/<sid>/meta` | Session metadata — `{parties, created, turns}` |
| `g/<agentId>/sessions/<sid>/frames/0/conversation` | The session's conversation turns |
| `g/<agentId>/sessions/<sid>/pending` | Pending (not-yet-consumed) messages for the session |
| `g/<agentId>/tasks` | Pending task Job IDs |
| `g/<agentId>/timeline` | Complete audit trail (append-only) |

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
  "tasks": [{ "task": "Summarise vendor records" }],
  "messages": [],
  "result": { "answer": "Three vendors..." },
  "taskResults": { "0x1234": { "status": "COMPLETE", "output": { } } }
}
```

## Error Handling and Recovery

When an agent transition fails:

1. The error is recorded in `agent.error`
2. Status transitions to **SUSPENDED**
3. Tasks, sessions, and pending messages are preserved
4. The timeline is **not** updated (no entry for failed runs)

**To recover:**

1. Inspect the error: `agent:info agentId: "Alice"`
2. Fix the root cause (missing tool, bad credentials, capability issue)
3. Resume: `agent:resume agentId: "Alice"`
4. The agent returns to SLEEPING and processes pending work

## Related

- [Sessions](./sessions) — the session model and run loop
- [Creating Agents](./creating-agents) — configuration and templates
- [Tools and Context](./tools-and-context) — how tools and context are assembled
- [COG-004: Agents](/docs/protocol/cogs/COG-004) — Protocol specification
