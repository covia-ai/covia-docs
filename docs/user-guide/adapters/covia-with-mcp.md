---
id: covia-with-mcp
title: Covia with MCP
sidebar_label: MCP
---

# MCP Adapter

The MCP adapter lets a venue **call external [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers as grid operations** — discovering their tools and invoking them like any other operation.

> Looking for the other direction — exposing *your* venue's operations to an AI assistant as MCP tools? A venue is automatically an MCP server. See [Venues as MCP Servers](../mcp/venues-as-mcp-servers).

## Operations

| Operation | Catalog path | Purpose |
|-----------|--------------|---------|
| `mcp:tools:list` | `v/ops/mcp/tools-list` | List the tools a remote MCP server offers |
| `mcp:tools:call` | `v/ops/mcp/tools-call` | Invoke a tool on a remote MCP server |
| `mcp:tool:add` | `v/ops/mcp/add-tool` | Curate a single remote tool as a catalog operation at a path you choose |
| `mcp:server:add` | `v/ops/mcp/add-server` | Mirror **all** of a server's tools into the catalog |
| `mcp:server:remove` | `v/ops/mcp/remove-server` | Remove a mirrored server's tools and registry entry |
| `mcp:server:refresh` | `v/ops/mcp/refresh` | Re-sync bridged tools against the live server (mirror or curated mode) |

A server is addressed by URL or by DID (resolved from the DID document's service entries). See [Calling MCP Tools](../mcp/calling-mcp-tools) for worked examples, authentication options, and orchestration patterns.

## Bridging: remote tools as catalog operations

Beyond one-off calls, the adapter can **bridge** remote MCP tools into the
operation catalog, where they behave exactly like native operations —
capability grants, gates, job records, schema validation, and agent tool
palettes all apply. Curate individual tools from different servers into
groups at catalog paths of your choosing, or mirror a whole server. See
[Calling MCP Tools § Bridging](../mcp/calling-mcp-tools#bridging-mcp-tools-into-the-catalog)
for the full guide.

## Why go through the Grid?

Calling an MCP server *through* a venue, rather than wiring it into your client directly, gives you:

- **Plug-and-play orchestration** — compose MCP tools with other grid operations, agents, and [orchestrations](./orchestrator).
- **A system of record** — every call is a [Job](../api/) with an auditable record on your venue.
- **Controlled credentials** — API keys live in the venue's [secret store](./secret), not in the client.

## Related

- [Calling MCP Tools](../mcp/calling-mcp-tools) — detailed reference for `mcp:tools:list` / `mcp:tools:call`
- [Venues as MCP Servers](../mcp/venues-as-mcp-servers) — the inbound side (your venue as an MCP server)
- [MCP Integration](../mcp/) — the full MCP section
- [Orchestrator](./orchestrator) — composing MCP tools into workflows
