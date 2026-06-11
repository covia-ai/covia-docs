---
id: overview
title: Overview
sidebar_label: Overview
sidebar_position: 1
---

# Covia

> **The universal federated grid for AI.**
> Covia lets AI models, agents, and data collaborate across organisational boundaries, clouds, and jurisdictions — with governance built in and without centralising control.

## What is Covia?

Covia is an open-source runtime for **federated AI orchestration**. You run a **venue** — a node on the grid that hosts *operations* (executable, self-describing capabilities), runs *agents*, and keeps an immutable, auditable record of every job. Venues federate: a workflow on one venue can invoke an operation on a partner's venue, in another cloud or jurisdiction, while the data stays where it is governed and only results cross the boundary.

It is built on the [Convex](https://docs.convex.world/docs/overview/lattice) lattice platform for decentralised, cryptographically verifiable state — and it speaks the protocols the AI ecosystem already uses: **REST**, **MCP**, **A2A**, and **DID**. If you think of HTTP as the protocol that made documents interoperable, Covia is the layer that makes **AI capability** interoperable, verifiable, and governable across trust boundaries.

## See it work — right now

Every venue exposes the same API. Call a live one — no install, no signup:

```bash
curl -X POST https://venue-test.covia.ai/api/v1/invoke \
  -H "Content-Type: application/json" \
  -d '{
        "operation": "v/ops/schema/infer",
        "input": { "value": { "name": "Ada", "age": 36 } },
        "wait": true
      }'
```

What comes back is not just a result — it's a **job record**: who invoked what, when, with what outcome, persisted on the venue's lattice. That audit-grade system of record is the point.

Three minutes more gets you a venue of your own:

```bash
docker run -p 8080:8080 ghcr.io/covia-ai/covia:latest
```

→ **[Quick Start](../user-guide/quick-start)** — zero to your first operation in TypeScript or Python.

## Why federation?

AI capability is unevenly distributed by nature: the best model sits in one cloud, the data that makes it valuable belongs to another organisation, and the domain expertise lives in a third. Today there are two ways to combine them — **centralise** (hand your data and agency to someone else's platform) or **integrate** (build N² brittle point-to-point connections). Neither survives contact with real governance: regulated data can't leave, audit trails can't be reconstructed from glue code, and every new partner restarts the integration project.

Covia's bet is that the missing piece is **infrastructure, not another framework**: a common runtime where any AI capability can be published, discovered, invoked, and audited across organisational boundaries — with control retained, always, by the party that owns each resource.

## How it works — and what's different

| | |
|---|---|
| **Sovereign by construction** | Each [venue](./venues) is operated independently with its own identity (DID), [authentication](../operator-guide/auth), and policy. Federation never requires surrendering control of data or infrastructure. |
| **Self-describing operations** | Every capability carries JSON Schema in/out and is discoverable — by developers *and* by agents. One integration surface for humans and machines. |
| **Audit-grade execution** | Every invocation is a [job](../user-guide/api/) with an immutable, queryable record. Compliance is a property of the runtime, not an afterthought. |
| **Verifiable state** | Assets are content-addressed; venue state lives on a [CRDT lattice](https://docs.convex.world/docs/overview/lattice) that merges deterministically — no central coordinator, no consensus bottleneck. |
| **Capability security** | Authorisation follows the [UCAN model](../user-guide/capabilities): signed, attenuable grants enforced on every call. Agents run under least privilege by default. |
| **Protocol-native** | A venue is an [MCP server](../user-guide/mcp/) and an [A2A agent](../user-guide/adapters/covia-with-a2a) out of the box. Covia meets the ecosystem where it already is, rather than asking it to move. |

## What you can build

- **Cross-organisational AI workflows** — [orchestrate](../user-guide/adapters/orchestrator) multi-step pipelines that span venues, where each party's data stays under its own governance and only results travel.
- **Governed agent teams** — persistent, tool-using [agents](../user-guide/agents/) with scoped capabilities and a complete audit trail, like the [AP invoice pipeline](../user-guide/agents/creating-agents#ap-demo-example) where three agents scan, enrich, and approve under least privilege.
- **One capability, every protocol** — publish an operation once and it is callable via REST, as an MCP tool from any AI assistant, and as an A2A task from any agent framework.
- **Sovereign data services** — user-signed, portable file systems ([DLFS](../user-guide/adapters/dlfs)) and per-user encrypted secrets, hosted on infrastructure you control.

## Where the project is

Covia is **open source (EPL-2.0)** and built in the open — and we are deliberately honest about maturity, because trust is the product:

- The **engine is solid**: a clean adapter architecture (~20 adapters), a multi-protocol surface, and over 1,000 automated tests.
- **SDKs are published** for [TypeScript](https://www.npmjs.com/package/@covia/covia-sdk) (npm) and [Python](https://pypi.org/project/covia/) (PyPI); a Java client builds from source.
- **Live venues** run today — the examples above hit one.
- The platform is **pre-1.0 and moving fast**; APIs may change. Development happens in the open on [GitHub](https://github.com/covia-ai/covia).
- The protocol is being standardised in the open as [COGs](../protocol/cogs-overview) — draft specifications open to community review.

## Start here

**Building something?**
[Quick Start](../user-guide/quick-start) · [SDKs](../user-guide/sdk/) · [Agents](../user-guide/agents/) · [Adapters](../user-guide/adapters/)

**Running infrastructure?**
[Run a venue](../operator-guide/venue-start) · [Authentication](../operator-guide/auth) · [Persistence](../operator-guide/persistence)

**Evaluating the vision?**
[Whitepaper](../protocol/whitepaper) · [Protocol specifications](../protocol/cogs-overview) · [The Grid](./grid) · [Venues](./venues)

**Joining the community?**
[GitHub](https://github.com/covia-ai/covia) · [Discord](https://discord.gg/fywdrKd8QT) · [Discussions](https://github.com/orgs/covia-ai/discussions) · [Contribute](./contribute)
