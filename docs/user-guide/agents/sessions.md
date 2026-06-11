---
title: Sessions
sidebar_position: 2.5
---

# Sessions

A **session** is a persistent conversation thread inside an agent. Every piece of inbound work — a task, a chat, or a notification — attaches to a session, and an agent can hold many sessions at once, each with its own conversation and scratch space. Sessions are how a single agent keeps several independent conversations straight.

## The model

Each session lives in the agent record at `g/<agentId>/sessions/<sessionId>`, where `sessionId` is a venue-minted hex identifier. A session holds:

| Field | Contents |
|-------|----------|
| `frames` | The conversation. For a plain LLM Agent this is a single root frame; for a [Goal Tree](./goal-tree) agent it's a stack of frames. The root conversation is at `frames/0/conversation`. |
| `pending` | The session's intake queue — messages delivered but not yet consumed by a run. |
| `c` | Session-scoped scratch workspace (addressed as `c/...` from within a transition). |
| `meta` | `{ parties, created, turns }` — the caller DIDs on the session, when it was created, and a turn counter. |

## Getting a session id

You never create a session explicitly. The first time you send work without a `sessionId`, the venue mints one and returns it:

```json
// Request → response carries the sessionId that was minted
{ "operation": "agent:chat", "input": { "agentId": "Alice", "message": "Hello" } }
```

```json
{ "agentId": "Alice", "sessionId": "0xabcd...", "response": "Hi — how can I help?" }
```

Echo that `sessionId` on the next call to continue the same conversation:

```json
{
  "operation": "agent:chat",
  "input": { "agentId": "Alice", "sessionId": "0xabcd...", "message": "What did I just say?" }
}
```

Omit `sessionId` to start a fresh thread. An **unknown** `sessionId` is rejected — omit it to start a new session rather than inventing one.

## Three ways to send work

All three intake operations attach to a session (minting one if you don't supply an id). They differ in what they create and whether you get a reply:

| Operation | Creates | You get back | Use for |
|-----------|---------|--------------|---------|
| [`agent:request`](./operations#agent-request) | A **task Job** | The agent's structured response (within `timeout`), else a snapshot to poll | Tracked delegation — formal requests needing a result |
| [`agent:chat`](./operations#agent-chat) | A **chat Job** | The agent's next response on the session | Conversational, back-and-forth interaction |
| [`agent:message`](./operations#agent-message) | _(nothing — no Job)_ | Just `{ delivered: true }` | Fire-and-forget, one-way notifications |

- A **task Job** stays open until the transition calls `agent_complete_task` / `agent_fail_task` (or hits its output schema). It survives restarts and is polled with `grid:jobResult`.
- A **chat Job** completes implicitly with the agent's next turn output on that session. Only one chat may be in flight per session at a time.
- A **message** is appended to the session's `pending` queue and consumed on the next run — there's no Job and no reply.

## The run loop

Each agent runs on a single virtual thread, one cycle at a time. When work is waiting, the loop:

1. **Picks one session** — at most one session with pending work is processed per cycle.
2. **Invokes the transition** — the Level 2 adapter (LLM Agent or Goal Tree) receives that session (its conversation, pending messages, and metadata) plus the agent config.
3. **Merges the result** — new conversation turns are written back to the session, the messages it presented are drained from `pending`, the timeline gets an entry, and any task/chat Jobs are completed.
4. **Loops** — repeats until no session has pending work and no task is outstanding.

Messages that arrive *during* a transition are preserved for the next cycle — only the messages presented to that cycle are drained. This keeps intake lossless under concurrency.

## Scheduled wakes

A session (or task) can carry a `wakeTime`. The venue [scheduler](../adapters/scheduler) arms a single wake per agent at the earliest pending `wakeTime` and fires `agent:trigger` (with `force: false`) when it's due — so an agent can sleep until it has work or until a deferred time arrives, without polling. Wake times are stored on the lattice, so they survive a restart: the venue re-arms every agent's wake from the lattice on boot.

## Inspecting sessions

Sessions are plain lattice data — read them directly with the `covia` adapter:

```json
// List an agent's sessions
{ "operation": "covia:list", "input": { "path": "g/Alice/sessions" } }

// Read one session's metadata
{ "operation": "covia:read", "input": { "path": "g/Alice/sessions/0xabcd.../meta" } }

// Read the most recent conversation turns
{ "operation": "covia:slice", "input": { "path": "g/Alice/sessions/0xabcd.../frames/0/conversation", "limit": 20 } }
```

`agent:context` is the higher-level equivalent — it shows the exact LLM input the agent would assemble for a session. See [Agent Operations](./operations#agent-context).

## Related

- [Agent Operations](./operations) — `agent:request`, `agent:chat`, `agent:message`, and the rest
- [LLM Agent](./llm-agent) — the flat per-session conversation model
- [Goal Tree](./goal-tree) — the frame-stack conversation model
- [Scheduler](../adapters/scheduler) — deferred wakes and agent scheduling
