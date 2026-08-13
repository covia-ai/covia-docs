---
title: Adapters
sidebar_label: Overview
sidebar_position: 0
---

# Adapters

Adapters are how a venue gets its capabilities. Each adapter contributes a family of **operations** (self-describing, invocable units with JSON Schema inputs and outputs) that any client, agent, or orchestration can call. Out of the box a venue ships with nearly thirty adapters spanning LLMs, agents, human oversight, files, lattice state, governance, and federation; operators add more as [venue modules](./jvm#venue-modules).

## AI and agents

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [LangChain](./langchain-adapter) | `langchain:*` | Call LLMs: OpenAI, Anthropic, Ollama, xAI, and OpenAI-compatible endpoints |
| [Skills](./skills) | `v/ops/skills` | Skill discovery and retrieval; every venue ships a skill library |
| [User Memory](./memory) | `v/ops/memory` | Durable per-user memory that agents recall every turn and edit by number |
| [Human-in-the-Loop](./hitl) | `hitl:*` | Park a job for human approval, choices, or capability grants |

Agent execution (`agent:*`, `llmagent:*`, `goaltree:*`) is documented under [Agents](../agents/).

## Federation and connectivity

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [Grid](./grid-adapter) | `grid:*` | Invoke operations on local or remote venues (federation) |
| [Orchestrator](./orchestrator) | *(adapter, not ops)* | Multi-step DAG workflows, defined as operation assets and run via `grid:run` |
| [MCP](./covia-with-mcp) | `mcp:*` | Call external MCP servers; bridge their tools into the catalog |
| [A2A](./covia-with-a2a) | `a2a:*` | Call remote A2A agents; serve A2A inbound |
| [HTTP](./http-adapter) | `http:*` | SSRF-protected outbound HTTP requests |
| [Convex](./convex) | `convex:*` | Query and transact against the Convex lattice network |

## State and data

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [Covia (Venue)](./venue-adapter) | `covia:*` | CRUD over the venue's lattice state |
| [Assets](./asset) | `asset:*` | Immutable, content-addressed asset store: store, read, list, pin |
| [Secrets](./secret) | `secret:*` | Per-user encrypted secret store; `s/NAME` references |
| [File](./file) | `file:*` | Root-jailed local filesystem access |
| [DLFS](./dlfs) | `dlfs:*` | Decentralised, user-signed file system (WebDAV) |
| [Vault](./vault) | `vault:*` | Simplified, fixed-drive file access |
| [Archive](./archive) | `archive:*` | Zip handling: jailed, zip-slip-proof, bomb-guarded |
| [JSON](./json) | `json:*` | Pure JSON data manipulation (merge, select, …) |
| [Schema](./schema) | `schema:*` | JSON Schema validate, infer, coerce (pure and sub-millisecond) |
| [Scheduler](./scheduler) | `scheduler:*` | Run operations later; deferred and agent wakes |

## Identity and governance

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [UCAN](./ucan) | `ucan:*` | Issue and verify capability tokens: authority as an inspectable artifact |
| [Auth](./auth) | `auth:*` | Caller identity diagnostics (`whoami`) |
| [Users](./user) | `user:*` | Administrative user registration and authenticator key management |

## Extensibility

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [JVM](./jvm) | `jvm:*` | In-process utility ops, plus the venue-module mechanism for arbitrary JVM code |
| [SQL](./sql) *(module)* | `sql:*` | Governed SQL over any JDBC database, delegable per database |
| [Python](./python) *(module)* | `python:*` | Operator-configured Python operations, in-process via FFM |

SQL and Python are optional [venue modules](./jvm#venue-modules): separate artifacts on Maven Central (`ai.covia:covia-sql`, `ai.covia:covia-python-adapter`), loaded by config.

## How operations are named and invoked

Operations are written as `adapter:op` (e.g. `grid:run`) or as a venue catalog path (`v/ops/grid/run`). Invoke them over [REST](../api/) (`POST /api/v1/invoke`), through an [SDK](../sdk/), as [MCP](../mcp/) tools, or as agent tools. Because every operation is self-describing, both humans and agents can discover and call them.
