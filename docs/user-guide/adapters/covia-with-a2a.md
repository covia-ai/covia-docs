---
id: covia-with-a2a
title: Covia with A2A
sidebar_label: A2A
---

# A2A (Agent-to-Agent)

The agent ecosystem is plural — many frameworks, many vendors — and your agents shouldn't be strangers to any of it. Covia speaks the [Agent-to-Agent protocol (A2A)](https://a2a-protocol.org/) **both ways**. A venue is a spec-conformant A2A v1.0 server — any A2A client can send it messages and track tasks — and the A2A adapter lets your operations and agents **call** remote A2A agents as grid operations. A2A maps cleanly onto Covia's own model: an A2A *Task* is a Covia *Job*, and an A2A *Message* is a turn in a conversation.

## Inbound: a venue as an A2A server

A venue configured with an `a2a` block (see the [Configuration Reference](../../operator-guide/configuration)) exposes an A2A endpoint and an agent card:

| Endpoint | Purpose |
|----------|---------|
| `POST /a2a` | A2A JSON-RPC 2.0 |
| `GET /.well-known/agent-card.json` | Agent card (discovery) |

Responses use `Content-Type: application/a2a+json`. The implemented methods are:

| Method | Support |
|--------|---------|
| `SendMessage` | ✅ Send a message; returns a Task |
| `GetTask` | ✅ Fetch a Task's current state |
| `CancelTask` | ✅ Cancel a Task |
| `SendStreamingMessage` | ✅ Send and stream updates over SSE |
| `SubscribeToTask` | ✅ Subscribe to an existing Task over SSE |
| Push-notification config, `ListTasks`, extended card | Not implemented — return an `UnsupportedOperation` error |

### Agent card

`GET /.well-known/agent-card.json` returns the venue's card — `name`, `description`, `version`, `provider`, `capabilities` (the venue advertises `streaming: true` — gating the streaming methods — and state-transition history), a single JSON-RPC interface at `{baseUrl}/a2a` (protocol version `1.0`), and default input/output modes (`text/plain`, `application/json`). The `name`, `description`, provider, and version come from the venue's agent-info configuration.

### How inbound messages map

- A `SendMessage` with **no** `taskId` starts fresh: the venue invokes its configured default chat operation, creating a **new Job**, and returns a Task whose `id` is the Job id (hex).
- A `SendMessage` **with** a `taskId` is a continuation: the message is appended to that Job's history and delivered to the running transition.
- Task state mirrors Job status — `PENDING→submitted`, `STARTED→working`, `COMPLETE→completed`, `FAILED→failed`, `CANCELLED→canceled`, plus `input-required` / `auth-required`. When a Job reaches a terminal state its output is surfaced as the Task's artifact.

Inbound callers are identified by the venue's [auth middleware](../../operator-guide/auth); Job ownership is enforced, so a caller only sees its own tasks.

### Streaming

`SendStreamingMessage` and `SubscribeToTask` open a Server-Sent Events stream (`text/event-stream`). Each event is a JSON-RPC envelope carrying a Task snapshot or a status-update; the stream sends a final update marked `final: true` when the Task reaches a terminal state, then closes.

## Outbound: calling remote A2A agents

The A2A adapter turns a remote A2A agent into grid operations. You **import the agent once**, and then address it by reference — not by URL on every call. That is what lets authentication be configured once and never travel in a call's input.

### Import an agent

```json
{
  "operation": "v/ops/a2a/import-agent",
  "input": {
    "name": "research-bot",
    "url": "https://agent.example.com",
    "auth": { "kind": "bearer", "secret": "s/RESEARCH_BOT_TOKEN" }
  }
}
```

This fetches the agent's card and stores it as an **immutable agent Asset**, with a mutable binding at `w/a2a/agents/<name>` (`name` matches `[a-z0-9-]{1,64}`). A Covia agent on another venue is imported the same way, with `coviaAgent` (`g/<agentId>` or `<ownerDID>/g/<agentId>`) plus `venue` instead of `url`.

`auth` is a **stored** binding, never a literal credential: `{scheme: "<Agent Card scheme name>", secret: "s/NAME"}` for a scheme the card declares, or `{kind: "bearer", secret: "s/NAME"}` for plain Bearer.

### Call it

| Operation | Input | Returns |
|-----------|-------|---------|
| `a2a:agent-card` | `agent` | The immutable Agent Card snapshot from the imported asset |
| `a2a:send` | `agent`, `message`, `taskId?` | The remote Task (final, or current on interrupt) |
| `a2a:get-task` | `agent`, `id` | The remote Task's current state |
| `a2a:cancel` | `agent`, `id` | The cancelled Task |

`agent` is the imported reference — normally `w/a2a/agents/<name>`, or its immutable `a/<hash>` id when you want to pin the exact card you imported.

```json
{
  "operation": "v/ops/a2a/send",
  "input": {
    "agent": "w/a2a/agents/research-bot",
    "message": { "role": "user", "parts": [{ "type": "text", "text": "Summarise Q1 revenue" }] }
  }
}
```

Pass a `taskId` to continue an existing remote Task instead of starting a new one.

### Calling a URL directly

`a2a:raw/agent-card`, `a2a:raw/send`, `a2a:raw/get-task` and `a2a:raw/cancel` take a `url` and per-call `bearerToken` or `bearerSecret` instead of an imported reference.

These are a **diagnostic escape hatch** — useful for probing an endpoint before importing it, and not the normal path. A per-call credential is one that has to be passed around, which is exactly what importing avoids.

### Job-per-Task mirroring

`a2a:send` creates a **local Job that mirrors the remote Task**. If the remote Task is already terminal, the local Job completes immediately with its result. If it's still running, the adapter polls the remote agent (`GetTask` every ~500 ms, up to a 30-minute lifetime) and propagates state to the local Job; cancelling the local Job sends a best-effort `CancelTask` to the remote. An interrupted remote Task (`input-required` / `auth-required`) surfaces that state on the local Job so the caller can respond.

### Authentication

**Inbound:** the venue's agent card does not yet advertise A2A `securitySchemes`; authentication is handled at the transport/middleware layer (see the [operator auth guide](../../operator-guide/auth)).

**Outbound:** credentials are bound at import time — `auth` on `a2a:import-agent`, always as an `s/NAME` [secret](./secret) reference — and applied to every call made through that agent reference. A credential is therefore configured once, stored encrypted, and never appears in a job's input. The `raw/*` operations take a per-call `bearerToken` or `bearerSecret`, which is one reason to prefer importing.

## Related

- [A2A protocol specification](https://a2a-protocol.org/latest/specification/)
- [MCP](./covia-with-mcp) — the other side of the interop story
- [Agent Operations](../agents/operations) — `agent:chat` is the inbound `SendMessage` analogue
- [Grid Adapter](./grid-adapter) — federating operations across venues
