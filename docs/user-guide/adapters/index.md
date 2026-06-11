---
title: Adapters
sidebar_label: Overview
sidebar_position: 0
---

# Adapters

Adapters are how a venue gets its capabilities. Each adapter contributes a family of **operations** — self-describing, invocable units with JSON Schema inputs and outputs — that any client, agent, or orchestration can call. Out of the box a venue ships with adapters spanning LLMs, HTTP, files, lattice state, federation, and more; operators can add their own.

## Available adapters

| Adapter | Operations | What it does |
|---------|-----------|--------------|
| [LangChain](./langchain-adapter) | `langchain:*` | Call LLMs — OpenAI, Anthropic, Ollama, xAI, and OpenAI-compatible endpoints |
| [Grid](./grid-adapter) | `grid:*` | Invoke operations on local or remote venues (federation) |
| [Orchestrator](./orchestrator) | `orchestrator:*` | Multi-step DAG workflows with dependencies |
| [MCP](./covia-with-mcp) | `mcp:*` | Call external MCP servers as grid operations |
| [A2A](./covia-with-a2a) | `a2a:*` | Call remote A2A agents; serve A2A inbound |
| [HTTP](./http-adapter) | `http:*` | SSRF-protected outbound HTTP requests |
| [File](./file) | `file:*` | Root-jailed local filesystem access |
| [DLFS](./dlfs) | `dlfs:*` | Decentralised, user-signed file system (WebDAV) |
| [Vault](./vault) | `vault:*` | Simplified, fixed-drive file access |
| [Scheduler](./scheduler) | `scheduler:*` | Run operations later; deferred and agent wakes |
| [Covia (Venue)](./venue-adapter) | `covia:*` | CRUD over the venue's lattice state |
| [JSON](./json) | `json:*` | Pure JSON data manipulation (merge, select, …) |

Agent execution (`agent:*`, `llmagent:*`, `goaltree:*`) is documented under [Agents](../agents/).

## How operations are named and invoked

Operations are written as `adapter:op` (e.g. `grid:run`) or as a venue catalog path (`v/ops/grid/run`). Invoke them over [REST](../api/) (`POST /api/v1/invoke`), through an [SDK](../sdk/), as [MCP](../mcp/) tools, or as agent tools. Because every operation is self-describing, both humans and agents can discover and call them.
