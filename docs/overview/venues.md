---
sidebar_position: 3
---

# Venues

A **venue** is a single node on the [Grid](./grid) — a self-contained server that hosts operations, runs agents, and persists state. It has a DID identity, a content-addressed asset store, and a job engine, and it exposes the same capabilities over REST, MCP, A2A, and DID. Run one with a single command; see the [operator guide](../operator-guide/venue-start).

## What a venue hosts

- **Operations** — self-describing, invocable capabilities provided by pluggable [adapters](../user-guide/adapters/) (LLMs, HTTP, files, orchestration, cross-venue federation, and more).
- **Agents** — persistent, stateful actors that hold [sessions](../user-guide/agents/sessions), call tools, and produce auditable results.
- **Assets** — immutable, content-addressed artifacts and data.
- **Jobs** — the execution record for every invocation, poll-able and streamable over SSE.

## Governance is per-venue

Each venue operator decides their own policy. A venue controls its own [authentication](../operator-guide/auth) (public, OAuth, bearer/UCAN tokens), enforces [capabilities](../user-guide/capabilities) on every request, and keeps its data where it is governed — other venues see only the results of operations they're permitted to invoke. This is what lets venues federate across organisational and jurisdictional boundaries without centralising control.

## Where to go next

- [Run a venue](../operator-guide/venue-start) — get one running locally or in a container
- [Adapters](../user-guide/adapters/) — what a venue can do out of the box
- [Agents](../user-guide/agents/) — build stateful, tool-using agents
- [Grid](./grid) — how venues federate
