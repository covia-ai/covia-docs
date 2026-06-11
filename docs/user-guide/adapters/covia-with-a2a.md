---
id: covia-with-a2a
title: Covia with A2A
sidebar_label: A2A
---

# A2A (Agent-to-Agent)

Covia speaks the [Agent-to-Agent protocol (A2A)](https://a2a-protocol.org/) **both ways**. A venue is a spec-conformant A2A v1.0 server — any A2A client can send it messages and track tasks — and the A2A adapter lets your operations and agents **call** remote A2A agents as grid operations. A2A maps cleanly onto Covia's own model: an A2A *Task* is a Covia *Job*, and an A2A *Message* is a turn in a conversation.

## Inbound: a venue as an A2A server

Every venue exposes an A2A endpoint and an agent card:

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

`GET /.well-known/agent-card.json` returns the venue's card — `name`, `description`, `version`, `provider`, `capabilities` (the server advertises `sendMessage`), a single JSON-RPC interface at `{baseUrl}/a2a` (protocol version `1.0`), and default input/output modes (`text/plain`, `application/json`). The `name`, `description`, provider, and version come from the venue's agent-info configuration.

### How inbound messages map

- A `SendMessage` with **no** `taskId` starts fresh: the venue invokes its configured default chat operation, creating a **new Job**, and returns a Task whose `id` is the Job id (hex).
- A `SendMessage` **with** a `taskId` is a continuation: the message is appended to that Job's history and delivered to the running transition.
- Task state mirrors Job status — `PENDING→submitted`, `STARTED→working`, `COMPLETE→completed`, `FAILED→failed`, `CANCELLED→canceled`, plus `input-required` / `auth-required`. When a Job reaches a terminal state its output is surfaced as the Task's artifact.

Inbound callers are identified by the venue's [auth middleware](../../operator-guide/auth); Job ownership is enforced, so a caller only sees its own tasks.

### Streaming

`SendStreamingMessage` and `SubscribeToTask` open a Server-Sent Events stream (`text/event-stream`). Each event is a JSON-RPC envelope carrying a Task snapshot or a status-update; the stream sends a final update marked `final: true` when the Task reaches a terminal state, then closes.

## Outbound: calling remote A2A agents

The A2A adapter turns a remote A2A agent into grid operations. Address the remote agent by its base `url`; the adapter appends `/.well-known/agent-card.json` and `/a2a` as needed.

| Operation | Input | Returns |
|-----------|-------|---------|
| `a2a:getAgentCard` | `url` | The remote agent's card |
| `a2a:send` | `url`, `message`, `taskId?` | The remote Task (final, or current on interrupt) |
| `a2a:getTask` | `url`, `id` | The remote Task's current state |
| `a2a:cancel` | `url`, `id` | The cancelled Task |

```json
{
  "operation": "a2a:send",
  "input": {
    "url": "https://agent.example.com",
    "message": { "role": "user", "parts": [{ "type": "text", "text": "Summarise Q1 revenue" }] }
  }
}
```

Pass a `taskId` to continue an existing remote Task instead of starting a new one.

### Job-per-Task mirroring

`a2a:send` creates a **local Job that mirrors the remote Task**. If the remote Task is already terminal, the local Job completes immediately with its result. If it's still running, the adapter polls the remote agent (`GetTask` every ~500 ms, up to a 30-minute lifetime) and propagates state to the local Job; cancelling the local Job sends a best-effort `CancelTask` to the remote. An interrupted remote Task (`input-required` / `auth-required`) surfaces that state on the local Job so the caller can respond.

### Authentication

The venue's agent card does not yet advertise an A2A `securityScheme`; inbound auth is handled at the transport/middleware layer (see the [operator auth guide](../../operator-guide/auth)). The outbound adapter currently calls remote agents without attaching credentials — for authenticated remotes, place the venue behind an appropriately configured gateway.

## Related

- [A2A protocol specification](https://a2a-protocol.org/latest/specification/)
- [MCP](./covia-with-mcp) — the other side of the interop story
- [Agent Operations](../agents/operations) — `agent:chat` is the inbound `SendMessage` analogue
- [Grid Adapter](./grid-adapter) — federating operations across venues
