---
title: Agent Operations
sidebar_position: 3
---

# Agent Operations

This page documents every operation available for managing agent lifecycle and interaction. All operations are invoked via the REST API (`POST /api/v1/invoke`) or as MCP tools.

Work reaches an agent through a **session** — a persistent conversation thread. `agent:request`, `agent:chat`, and `agent:message` all attach to a session (minting a new one if you don't supply a `sessionId`). See [Sessions](./sessions) for the full model.

## Running Agents

### agent:request {/* #agent-request */}

Send a tracked task to an agent. The task is recorded as a Job. This is the primary tool for agent delegation. It is **best-effort synchronous**: it waits up to `timeout` ms for the agent to finish.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `input` | object | *required* | Task payload — the instructions/data the agent needs. Never empty. |
| `timeout` | integer (ms) | `5000` | How long to wait synchronously. `0` returns a snapshot immediately (pure async). |
| `responseSchema` | object | — | JSON Schema for the task result. Shown to the agent as the target shape, and **advisory unless `strict` is set**. Overrides the agent's config-level `responseFormat` for this task. |
| `strict` | boolean | `false` | Enforce `responseSchema` at completion. A `complete_task` result that doesn't conform is rejected back to the agent with the validation diagnostics, and the agent corrects it or fails the task. |
| `sessionId` | string (hex) | — | Continue an existing session. Omit to mint a new one (returned in the response). |
| `outputPath` | string | — | A mutable lattice path for structural result handoff (`w/pipeline/run1/chapter1`, `t/stage1`, or an authorised DID-URL path). On successful completion the framework writes the worker's full result there — so a pipeline stage can hand off without the caller relaying the payload. |
| `loads` | object | — | Context to pre-load for a **new** session — the session tier of the [scope chain](./tools-and-context#the-scope-chain), as a map of lattice path to `{budget}` bytes. Valid only when this call creates the session; an error if the session already exists. |

```json
{
  "operation": "v/ops/agent/request",
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

### agent:chat {/* #agent-chat */}

Send a message and synchronously await the agent's next response on the session. The A2A `SendMessage` analogue — use it for conversational interactions where you want a reply.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `message` | any | *required* | Message content — string, object, or any JSON value |
| `sessionId` | string (hex) | — | Echo a previous `sessionId` to continue the conversation. Omit to start a new session. An unknown `sessionId` is rejected. |
| `loads` | object | — | Context to pre-load for a **new** session — a map of lattice path to `{budget}` bytes. Valid only when this call creates the session. |

```json
{
  "operation": "v/ops/agent/chat",
  "input": { "agentId": "Alice", "message": "Summarise the vendor records" }
}
```

**Response:**

```json
{ "agentId": "Alice", "sessionId": "0xabcd...", "response": "Three vendors are overdue..." }
```

Only one chat may be in flight per session — concurrent calls on the same session are rejected.

### agent:message {/* #agent-message */}

Send a fire-and-forget notification. The message is delivered into the session and consumed on the agent's next run — **no agent response is returned** (the call acknowledges with `{ "delivered": true }`) and no Job is created.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier |
| `message` | string | *required* | Notification text |
| `sessionId` | string (hex) | — | Deliver into an existing session. Omit to mint a new one. |

```json
{
  "operation": "v/ops/agent/message",
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
{ "operation": "v/ops/agent/trigger", "input": { "agentId": "Alice", "force": false } }
```

## Task Completion

These are framework tools an agent transition calls (typically as an LLM tool call) to finish a task. The `agentId` and `taskId` are read from the request context — the framework populates them when dispatching a task transition, so neither is a parameter. Without a task in scope the call fails.

### agent:complete-task

Marks the in-scope task complete and delivers the result to the caller. Exposed to LLMs as the harness tool **`complete_task`**.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `result` | any | — | The successful result to deliver. Open schema — any structured value. |

### agent:fail-task

Marks the in-scope task failed. Exposed to LLMs as the harness tool **`fail_task`**.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `error` | string | *required* | Human-readable failure reason. |

## Lifecycle Management

### agent:create

Create a new agent. See [Creating Agents](./creating-agents) for full configuration details.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agentId` | string | *required* | Agent identifier. **Must be unused** — an existing agent is an error. |
| `config` | object / string / array | — | One config layer, or an **ordered array** of layers. A layer is an inline map or a string reference: template (`template:worker`), workspace path (`w/templates/reader`), asset ref (`a/<hash>`), or DID URL. Later layers override earlier ones — nested maps merge recursively, arrays replace. A resolved composition may carry `state`, used as the agent's initial state. |
| `definition` | object | — | The agent definition, where it is supplied directly rather than composed from config layers. |

Omit `config` entirely for the recommended `skilled` default. Pass `config: {}` only when you deliberately want a minimal configuration.

```json
// Layers merge left to right
{ "operation": "v/ops/agent/create",
  "input": {
    "agentId": "Alice",
    "config": ["template:worker", "w/agent-config/providers/anthropic", { "model": "claude-sonnet-5" }]
  }
}
```

:::caution No `overwrite`
`agent:create` no longer accepts `overwrite` — a request carrying it **fails**. To change an existing agent use `agent:update` (history-preserving); to replace one, call `agent:delete` with `remove: true` and then create it again. The same applies to `agent:fork`.
:::

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
  "operation": "v/ops/agent/update",
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
  "operation": "v/ops/agent/fork",
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

### agent:context {/* #agent-context */}

Assemble the exact context an agent would send to its model **for one hypothetical call**, without calling the model. You describe the call; the venue runs the same Spec through the same assembler a live transition uses, so what you see matches what the model would get by construction rather than by two code paths agreeing.

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string *(required)* | Agent to inspect |
| `message` | string or object | A hypothetical inbox message — a string, or `{message, caller?}`. Renders as the current input, with venue attribution when the caller isn't the agent's own principal. |
| `messages` | array | Several inbox messages, same forms |
| `pending` | array | Job results arriving this cycle, as `{jobId, status, output}` |
| `task` | any | A task input — rendered as the outstanding task (LLM Agent) or the goal (Goal Tree), with the task tools offered |
| `sessionId` | string (hex) | Render against a real session's conversation, exactly as a live transition on it would see |

The response is the Level 3 input — `model`, `messages`, `tools`, `cacheMarks` — plus assembly diagnostics:

| Field | Meaning |
|-------|---------|
| `budget` | `{bytes, used, remaining}` — the model's declared context budget and what this call spends of it |
| `marks` | Message counts at each band boundary: `head`, `live`, `conversation`, `toolLoop` |
| `labels` | The label dialect in force (see [Tools and Context](./tools-and-context#context-assembly)) |
| `sessionTokens` | Measured usage, when the session has any |

With nothing to act on, the context shows the empty-state signal a wake-up would see.

```json
{
  "operation": "v/ops/agent/context",
  "input": { "agentId": "Alice", "message": "which vendors are overdue?" }
}
```

### agent:step {/* #agent-step */}

Step an agent's harness through **one iteration** on a reply you supply — no model call. Describe the call exactly as for `agent:context`, and add `assistant`: the reply the model would have given, as a string or `{content?, toolCalls?: [{id?, name, arguments?}]}`.

The tool calls are dispatched the way a live cycle dispatches them — same routes, same capability checks, same authority — so **the tools' side effects are real**. Their results are rendered, and you get back the prompt the next inference would receive.

The agent itself is untouched: nothing persists to its session, timeline or tasks. `complete_task` / `fail_task` (LLM Agent) and `complete` / `fail` (Goal Tree) are validated as live but reported as a terminal outcome rather than resolving anything, and Goal Tree's `subgoal` is not run — it would start a child frame and call the model.

| Field returned | Meaning |
|----------------|---------|
| `assistant` | The reply as it would be recorded |
| `turns` | What this iteration appends to the conversation |
| `calls` | `[{id, name, arguments, result, isError?, ms}]` |
| `terminal` | `{status: "complete" or "failed", value}` when a control tool was called |
| `done` / `response` | Whether the cycle ends here, and with what |
| `next` | The following prompt, as `agent:context` reports it |

Together these two make an agent testable without spending an inference: `agent:context` shows what the model would see, `agent:step` shows what the harness would do with a given reply.

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
  "operation": "v/ops/covia/read",
  "input": { "path": "g/Alice/timeline" }
}
```

### Timeline Entries

Each run appends a timeline entry recording **every inference of the cycle** — the standing `context` and `tools` once, then per inference what was newly `sent`, the `reply` verbatim (or `error`), and the tool `calls` it requested with their results and timings:

```json
{
  "start": 1782864000000,
  "end": 1782864012000,
  "op": "v/ops/goaltree/chat",
  "sessionId": "0xabcd...",
  "tasks": [{ "task": "Summarise vendor records" }],
  "inferences": [
    {
      "ts": 1782864000100, "ms": 4200,
      "op": "v/ops/langchain/anthropic", "model": "claude-sonnet-5",
      "sent": [],
      "reply": { "toolCalls": [{ "name": "covia_list", "arguments": { "path": "w/vendors" } }] },
      "calls": [{ "id": "c1", "name": "covia_list", "result": {}, "ms": 12 }]
    }
  ],
  "result": { "answer": "Three vendors..." }
}
```

`sent` carries the messages added since the previous inference — the standing head and live surface are recorded once, on the inference that first sent them. A `subgoal` call carries its child frame's record (`frame`) in the same shape, so popped subgoals keep their history, and a cycle whose transition throws still writes its entry with the inferences that ran.

This is the audit trail: what the model was actually shown, what it actually said, and what actually ran as a result.

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
- [COG-11: Agent Lifecycle](/docs/protocol/cogs/COG-011) — Protocol specification for agents
