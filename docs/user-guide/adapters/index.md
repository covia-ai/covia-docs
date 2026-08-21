---
title: Adapters
sidebar_label: Overview
sidebar_position: 0
---

# Adapters

Adapters are how a venue gets its capabilities. Each adapter contributes a family of **operations** — self-describing, invocable units with JSON Schema inputs and outputs — that any client, agent, or orchestration can call. Out of the box a venue ships with nearly thirty adapters spanning LLMs, agents, human oversight, files, lattice state, governance, and federation; operators add more as [venue modules](./jvm#venue-modules).

## AI and agents

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [LangChain](./langchain-adapter) | `langchain:*` | Call LLMs — OpenAI, Anthropic, Ollama, xAI, and OpenAI-compatible endpoints |
| [Skills](./skills) | `skills:list`, `skills:read` | Skill discovery and retrieval; every venue ships a skill library |
| [User Memory](./memory) | `v/ops/memory` | Durable per-user memory that agents recall every turn and edit by number |
| [Human-in-the-Loop](./hitl) | `hitl:*` | Park a job for human approval, choices, or capability grants |

Agent execution (`agent:*`, `llmagent:*`, `goaltree:*`) is documented under [Agents](../agents/).

## Messaging and chat front doors

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [Telegram](./telegram) *(module)* | `telegram:*` | Telegram bots as a venue front door; agents that send Telegram messages |
| [Discord](./discord) *(module)* | `discord:*` | Discord bots — DMs and mentions routed to agents or operations |

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
| [Assets](./asset) | `asset:*` | Immutable, content-addressed asset store — store, read, list, pin |
| [Secrets](./secret) | `secret:*` | Per-user encrypted secret store; `s/NAME` references |
| [File](./file) | `file:*` | Root-jailed local filesystem access |
| [DLFS](./dlfs) | `dlfs:*` | Decentralised, user-signed file system (WebDAV) |
| [Vault](./vault) | `vault:*` | Simplified, fixed-drive file access |
| [Archive](./archive) | `archive:*` | Zip handling — jailed, zip-slip-proof, bomb-guarded |
| [JSON](./json) | `json:*` | Pure JSON data manipulation (merge, select, …) |
| [Schema](./schema) | `schema:*` | JSON Schema validate, infer, coerce — pure and sub-millisecond |
| [Scheduler](./scheduler) | `scheduler:*` | Run operations later; deferred and agent wakes |

## Identity and governance

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [UCAN](./ucan) | `ucan:*` | Issue and verify capability tokens — authority as an inspectable artifact |
| [Auth](./auth) | `auth:*` | Caller identity diagnostics (`whoami`) |
| [Users](./user) | `user:*` | Administrative user registration and authenticator key management |

## Extensibility

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [JVM](./jvm) | `jvm:*` | In-process utility ops, plus the venue-module mechanism for arbitrary JVM code |
| [SQL](./sql) *(module)* | `sql:*` | Governed SQL over any JDBC database, delegable per database |
| [Python](./python) *(module)* | `python:*` | Operator-configured Python operations, in-process via FFM |
| [Claude Code](./claudecode) *(module)* | `claudecode:*` | Drive the Claude Code CLI in venue-authorised project directories |

SQL, Python, Telegram, Discord and Claude Code are optional [venue modules](./jvm#venue-modules) — separate artifacts (`ai.covia:covia-sql`, `ai.covia:covia-python-adapter`, `ai.covia:covia-telegram`, `ai.covia:covia-discord`, `ai.covia:covia-claude-code`), shipped as module jars with each release and loaded by config or at runtime.

## How operations are named and invoked

Operations are written as `adapter:op` (e.g. `grid:run`) or as a venue catalog path (`v/ops/grid/run`). Invoke them over [REST](../api/) (`POST /api/v1/invoke`), through an [SDK](../sdk/), as [MCP](../mcp/) tools, or as agent tools. Because every operation is self-describing, both humans and agents can discover and call them.

## Runtime lifecycle

Adapters and modules can be changed on a **running** venue, without a restart:

| Operation | Purpose |
|-----------|---------|
| `v/ops/venue/adapters` | Full registry view — active and disabled adapters (kernel flag, owning module, operations) plus loaded modules |
| `v/ops/venue/adapter/enable` / `v/ops/venue/adapter/disable` | Retract or restore a non-kernel adapter's catalog, introspection and dispatch |
| `v/ops/venue/adapter/configure` | Apply a new effective configuration — the same shape as the `adapters.<name>` config block, replacing it unless `merge: true` |
| `v/ops/venue/module/load` / `v/ops/venue/module/unload` | Load or unload a module jar |

These are **venue-owned**: they authorise only for direct execution as the venue identity, or a venue-rooted delegation over `<venue DID>/adapters` with `adapter/manage`. An ordinary authenticated user cannot switch adapters off or load code, whatever their own namespace scope.

Module loading is additionally gated by the operator's `dynamicModules` policy — off by default; when enabled, the module must be a jar name inside the staging directory `dynamicModules.dir` unless `dynamicModules.anyPath` widens it, and an optional `sha256` pins the jar's content.

**Runtime changes are not persisted.** After a restart the venue config is authoritative again — the config file remains the record of what a venue is.

## What an adapter publishes about itself

Each adapter owns a subtree at `v/adapters/<name>/`, published when it becomes active and retracted when it is disabled or unloaded:

| Path | Contents |
|------|----------|
| `v/adapters/<name>/info` | Facts the adapter publishes about itself — also merged into `v/info/adapters/<name>` |
| `v/adapters/<name>/config` | Only what the adapter explicitly allow-lists as public — nothing by default |
| `v/adapters/<name>/ops/` | Its operations, mirrored from the canonical catalog (same values, equally invocable) |
| `v/adapters/<name>/skills/` | Its [skills](./skills) — so a skill is published exactly when its adapter is active |
| `v/adapters/<name>/templates/` | Its agent templates |

This is why discovery answers are always true of the venue you are actually talking to: a disabled adapter's operations, skills and templates disappear with it, and `v/adapters/<name>/skills` is itself a ready-made skillset for everything one adapter offers.
