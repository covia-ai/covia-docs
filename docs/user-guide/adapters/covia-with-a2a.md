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

## Outbound: calling remote A2A agents — bring your own agent

The A2A adapter turns a remote A2A agent into grid operations. **Import the agent once** — that fetches its card and stores it as an asset, with its credential configured a single time — then task it by the binding the import creates.

| Operation | Input | Returns |
|-----------|-------|---------|
| `a2a:import-agent` | `name`, `url` (or `coviaAgent`), `auth?` | Writes an immutable `type:a2a-agent` asset, bound at `w/a2a/agents/<name>` |
| `a2a:agent-card` | `agent` | The imported card snapshot |
| `a2a:send` | `agent`, `message`, `taskId?` | The remote Task (final, or current on interrupt) |
| `a2a:get-task` | `agent`, `id` | The remote Task's current state |
| `a2a:cancel` | `agent`, `id` | The cancelled Task |

```json
{
  "operation": "a2a:import-agent",
  "input": {
    "name": "partner-bot",
    "url": "https://agent.example.com",
    "auth": { "scheme": "bearer", "secret": "s/PARTNER_KEY" }
  }
}
```

Then send to the binding — the message carries no credentials:

```json
{
  "operation": "a2a:send",
  "input": {
    "agent": "w/a2a/agents/partner-bot",
    "message": { "role": "user", "parts": [{ "type": "text", "text": "Summarise Q1 revenue" }] }
  }
}
```

Pass a `taskId` to continue an existing remote Task. Low-level `a2a/raw/*` operations take a `url` and credentials inline for one-off diagnostics; they are deliberately not agent tools. A step-by-step walkthrough — including Agentforce, Lyzr and Hermes — is in [Bring your own agent](../agents/bring-your-own-agent).

### Job-per-Task mirroring

`a2a:send` creates a **local Job that mirrors the remote Task**. If the remote Task is already terminal, the local Job completes immediately with its result. If it's still running, the adapter polls the remote agent (`GetTask` every ~500 ms, up to a 30-minute lifetime) and propagates state to the local Job; cancelling the local Job sends a best-effort `CancelTask` to the remote. An interrupted remote Task (`input-required` / `auth-required`) surfaces that state on the local Job so the caller can respond.

### Authentication

Outbound auth belongs to the **imported agent**, configured once and attached on every call — never supplied per request. `auth.secret` must be a **caller-owned `s/NAME` reference**; literal credentials are rejected. Use `auth: {scheme: "<card scheme>", secret: "s/NAME"}` for the API-key or HTTP-Bearer scheme the agent card declares, or `auth: {kind: "bearer", secret: "s/NAME"}` when a bearer is required even to fetch a private card. Only standard A2A HTTP auth is sent; Covia UCAN proofs are **not** forwarded outbound, so cross-organisation authorisation on an outbound call rests on the remote's own auth, not on Covia capabilities.

Inbound, the venue's agent card does not yet advertise A2A `securitySchemes`; inbound auth is handled at the transport/middleware layer (see the [operator auth guide](../../operator-guide/auth)).

## Related

- [Bring your own agent](../agents/bring-your-own-agent) — the task guide for importing an external agent
- [A2A protocol specification](https://a2a-protocol.org/latest/specification/)
- [MCP](./covia-with-mcp) — the other side of the interop story
- [Agent Operations](../agents/operations) — `agent:chat` is the inbound `SendMessage` analogue
- [Grid Adapter](./grid-adapter) — federating operations across venues
