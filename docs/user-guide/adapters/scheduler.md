---
id: scheduler
title: Scheduler Adapter
sidebar_label: Scheduler
---

# Scheduler Adapter

The Scheduler adapter runs an operation **later** — at an absolute time or after a delay. It's how a venue defers work: a reminder, a periodic sweep, or an agent that should wake at a set time. Scheduled invocations run with the **authority of whoever scheduled them**, captured at schedule time and replayed unchanged when they fire.

## Operations

| Operation | Purpose |
|-----------|---------|
| `scheduler:schedule` | Schedule an operation to run at a future time |
| `scheduler:list` | List your pending scheduled events |
| `scheduler:trigger` | Fire a scheduled event now |
| `scheduler:cancel` | Cancel a scheduled event |

## Scheduling

Give `scheduler:schedule` the operation to invoke, its input, and *when* — either `time` (absolute, milliseconds since the epoch) or `after` (milliseconds from now):

```json
{
  "operation": "v/ops/scheduler/schedule",
  "input": {
    "operation": "v/ops/agent/message",
    "input": { "agentId": "Alice", "message": "Daily summary due" },
    "after": 3600000
  }
}
```

It returns a `handle` (an opaque token) and the resolved `time`:

```json
{ "handle": "0x4f3a...", "time": 1749650400000 }
```

Keep the `handle` — you use it to cancel or trigger the event.

## Listing, triggering, cancelling

```json
{ "operation": "v/ops/scheduler/list" }
```

`scheduler:list` returns your pending events as `{ handle, op, time }`, soonest first. It is **scoped to the caller** — you only see events you scheduled.

```json
{ "operation": "v/ops/scheduler/trigger", "input": { "handle": "0x4f3a..." } }   // fire now → { triggered, result }
{ "operation": "v/ops/scheduler/cancel",  "input": { "handle": "0x4f3a..." } }   // → { cancelled: true|false }
```

## Captured authority — no escalation

When you schedule an event, the venue records your caller DID together with the UCAN **proofs and capabilities** present on the request. When the event fires, it runs under *exactly* that captured authority — not the venue's ambient authority and not a refreshed set of permissions.

This means a scheduled invocation can never do more than you could do at the moment you scheduled it. If your capabilities wouldn't allow the operation now, the deferred run won't be allowed either. Scheduling requires an authenticated caller.

## Durability

Scheduled events are stored on the lattice, so they survive a venue restart. On boot the venue re-arms its in-memory timer from the persisted schedule, and any events whose time has already passed fire immediately as a catch-up.

## Waking agents

Agent scheduling is built on this adapter. A [session](../agents/sessions) or task can carry a `wakeTime`; the venue derives a single wake per agent at the earliest pending time and schedules an `agent:trigger` (with `force: false`) to fire then. Because the wake times live on the lattice, the venue rebuilds every agent's wake from state on startup — a crash can't lose a pending wake. You normally don't call the scheduler directly for this; set the wake time and the framework arms it.

## Related

- [Sessions](../agents/sessions) — how agent wakes use the scheduler
- [Capabilities](../capabilities) — the authority captured and replayed at fire time
- [Grid Adapter](./grid-adapter) — invoking operations across venues
