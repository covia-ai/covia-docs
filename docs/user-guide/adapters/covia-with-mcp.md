---
id: covia-with-mcp
title: Covia with MCP
sidebar_label: MCP
---

# MCP Adapter

The MCP adapter lets a venue **call external [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers as grid operations** — discovering their tools and invoking them like any other operation.

> Looking for the other direction — exposing *your* venue's operations to an AI assistant as MCP tools? A venue is automatically an MCP server. See [Venues as MCP Servers](../mcp/venues-as-mcp-servers).

## Operations

| Operation | Purpose |
|-----------|---------|
| `mcp:tools:list` | List the tools a remote MCP server offers |
| `mcp:tools:call` | Invoke a tool on a remote MCP server |

A server is addressed by URL or by DID (resolved from the DID document's service entries). See [Calling MCP Tools](../mcp/calling-mcp-tools) for the full input/output reference, authentication options, and orchestration patterns.

## Why go through the Grid?

Calling an MCP server *through* a venue, rather than wiring it into your client directly, gives you:

- **Plug-and-play orchestration** — compose MCP tools with other grid operations, agents, and [orchestrations](./orchestrator).
- **A system of record** — every call is a [Job](../api/) with an auditable record on your venue.
- **Controlled credentials** — API keys live in the venue's [secret store](../capabilities), not in the client.

## Related

- [Calling MCP Tools](../mcp/calling-mcp-tools) — detailed reference for `mcp:tools:list` / `mcp:tools:call`
- [Venues as MCP Servers](../mcp/venues-as-mcp-servers) — the inbound side (your venue as an MCP server)
- [MCP Integration](../mcp/) — the full MCP section
- [Orchestrator](./orchestrator) — composing MCP tools into workflows
