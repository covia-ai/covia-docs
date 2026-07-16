---
sidebar_position: 3
---

# Calling MCP Tools via the Grid

The MCP adapter enables you to invoke tools from any MCP server as Grid operations. This provides unique advantages over direct MCP integration:

- **Orchestration**: Combine MCP tools with other Grid operations in workflows
- **Audit Trail**: All tool invocations are recorded as Jobs in your venue
- **Authentication Management**: Handle API keys and tokens centrally
- **Federation**: Access MCP tools across different venues

## Built-in MCP Operations

Every Covia venue includes two built-in MCP operations:

### `mcp:tools:list` - List Available Tools

Discover tools available on an MCP server:

```json
{
  "operation": "v/ops/mcp/tools-list",
  "input": {
    "server": "https://some-mcp-server.example.com"
  }
}
```

**Response:**
```json
{
  "tools": [
    {
      "name": "search",
      "description": "Search for information",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        }
      }
    },
    {
      "name": "fetch",
      "description": "Fetch a URL",
      "inputSchema": {
        "type": "object",
        "properties": {
          "url": { "type": "string" }
        }
      }
    }
  ],
  "total": 2
}
```

### `mcp:tools:call` - Invoke a Tool

Call a specific tool on an MCP server:

```json
{
  "operation": "v/ops/mcp/tools-call",
  "input": {
    "server": "https://some-mcp-server.example.com",
    "toolName": "search",
    "arguments": {
      "query": "latest AI news"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Here are the latest AI news articles..."
    }
  ]
}
```

## Bridging MCP Tools into the Catalog

One-off `tools-call` invocations work well inside orchestrations, but the
adapter can also **bridge** remote tools into your operation catalog, where
they become ordinary operations: invocable by path, subject to capability
grants and gates, recorded as jobs, validated against their schema, and
usable in agent tool palettes.

The tool is the entity — the server is just where it lives.

### Curating individual tools

`v/ops/mcp/add-tool` bridges ONE tool at a catalog path you choose:

```json
{
  "operation": "v/ops/mcp/add-tool",
  "input": {
    "server": "https://mcp.arxiv.example",
    "tool": "search_papers",
    "path": "o/research/search_papers"
  }
}
```

The bridged asset is **self-contained** (server, tool name, auth reference,
and the tool's own input schema all live in the asset) — there is no
registry entry to manage. That makes **groups just catalog paths**: curate
`o/research/search_papers`, `o/research/github_search` and
`o/research/fetch_page` from three different servers, each with its own
auth, and hand the group to an agent as its tool set.

Paths under your own `o/` namespace need nothing extra; venue-wide paths
(`v/ops/...`) require the `mcp/manage` ability. Remove a curated tool with
`covia:delete` on its path — nothing resurrects it.

Optional inputs:

- `name` / `description` — display overrides. They are yours: refresh never
  touches them.
- `auth` — a secret reference for the server (see
  [Authentication for bridged servers](#authentication-for-bridged-servers)).
- `default` — argument defaults (below).

If the tool name doesn't exist on the server, the error lists the server's
available tools so you (or an agent) can self-correct in one step.

### Purpose-shaping with argument defaults

`default` fills in arguments the caller omits, turning a generic tool into a
purpose-shaped one:

```json
{
  "operation": "v/ops/mcp/add-tool",
  "input": {
    "server": "https://mcp.github.example",
    "tool": "create_issue",
    "path": "o/covia/report_bug",
    "auth": "s/GITHUB_MCP_TOKEN",
    "default": { "owner": "covia-ai", "repo": "covia" }
  }
}
```

Callers (and agents) now see a tool that needs only `title` and `body` —
the defaulted keys leave the schema's `required` list. Defaults may be any
value type, and a caller-supplied value always wins: this is
purpose-shaping, **not** access control. When an argument value must be
enforced, use a capability gate instead. The mechanism is generic
(`operation.default` works on any operation — see
[COG-7: Operations](/docs/protocol/cogs/COG-007)); `add-tool` just stores it
for you.

### Mirroring a whole server

`v/ops/mcp/add-server` bridges ALL of a server's tools in one call:

```json
{
  "operation": "v/ops/mcp/add-server",
  "input": {
    "name": "github",
    "url": "https://mcp.github.example",
    "auth": "s/GITHUB_MCP_TOKEN"
  }
}
```

Tools materialise under `o/mcp/github/` (your namespace) by default, or
under the shared `v/ops/mcp/github/` with `scope: "venue"` (requires the
`mcp/manage` ability). A registry entry records the server for
refresh/remove bookkeeping. `v/ops/mcp/remove-server` deletes the mirrored
subtree and registry entry.

Server URLs pass the same SSRF validation (and operator allow/block lists)
as the HTTP adapter — bridging a server can never reach anything a direct
call couldn't.

### Keeping bridged tools fresh

`v/ops/mcp/refresh` re-syncs against the live server, in one of two modes —
provide exactly one of `name` or `path`:

- **Mirror** (`{"name": "github"}`): full reconciliation — new tools added,
  changed schemas rewritten, vanished tools **deleted**. The subtree mirrors
  the server.
- **Curated** (`{"path": "o/research"}`): walks the bridged ops under the
  path (one op or a whole group, across servers), updates input/output
  schemas and annotations in place. Your `name`/`description` overrides and
  `default` values are untouched, and a tool the server no longer offers is
  **reported in `missing`, never deleted** — you picked it, removal is your
  call. Per-server failures are isolated in `errors`; other servers in the
  group still refresh.

### Authentication for bridged servers

The `auth` input should be a **secret reference**, resolved at call time and
never persisted raw:

- `s/GITHUB_MCP_TOKEN` — a secret in your own store (stored qualified to
  your DID), set via `v/ops/secret/set`
- `did:key:.../s/GITHUB_MCP_TOKEN` — an explicitly DID-qualified reference
  (the venue's or your own)

A literal token works but warns — the bridged asset persists on the
lattice, so raw credentials belong in the secret store.

### Bridged tool errors

Bridged calls fail with LLM-diagnosable messages at the point of use:

- A remote tool-level error (`isError` in the MCP result) fails the job
  with the remote error text — a model can read it and self-correct.
- Transport failures name the tool, the server and the root cause, with a
  remedy: `MCP tool 'search_papers' on server https://... failed:
  Connection refused — check the server is reachable, or re-sync the
  bridged tool with v/ops/mcp/refresh`.

## Server Identification

You can identify MCP servers using either URLs or DIDs:

### By URL

```json
{
  "server": "https://venue-3.covia.ai/mcp"
}
```

### By DID

```json
{
  "server": "did:web:venue-3.covia.ai"
}
```

When using a DID, the venue resolves it to find the MCP endpoint from the DID document's service entries.

## Authentication

### Passing Tokens

If the MCP server requires authentication, include a token:

```json
{
  "operation": "v/ops/mcp/tools-call",
  "input": {
    "server": "https://protected-server.example.com",
    "toolName": "private-search",
    "token": "your-api-key",
    "arguments": {
      "query": "confidential data"
    }
  }
}
```

The token is passed as a Bearer token in the request to the MCP server.

### Using Venue Configuration

For frequently-used MCP servers, declare them in the venue configuration —
they are bridged into the catalog at boot (venue scope):

```json
{
  "mcp": {
    "servers": {
      "protected-server": {
        "url": "https://protected-server.example.com",
        "auth": "s/PROTECTED_SERVER_TOKEN"
      }
    }
  }
}
```

Each server's tools materialise as operations under
`v/ops/mcp/protected-server/`, invocable by path like any other operation —
no `server` or `token` inputs needed. Seeding is best-effort: a server that
is down at boot logs a warning and the last-known catalog persists (run
`v/ops/mcp/refresh` when it is reachable). See
[Bridging](#bridging-mcp-tools-into-the-catalog) above.

## Orchestrating MCP Tools

Combine MCP tool calls with other operations in orchestrations:

```json
{
  "name": "Search and Summarize",
  "operation": {
    "adapter": "orchestrator",
    "steps": [
      {
        "op": "v/ops/mcp/tools-call",
        "name": "Web Search",
        "input": {
          "server": "did:web:search-venue.example.com",
          "toolName": "web-search",
          "arguments": {
            "query": ["input", "topic"]
          }
        }
      },
      {
        "op": "v/ops/langchain/openai",
        "name": "Summarize Results",
        "input": {
          "prompt": ["concat", "Summarise the following search results:\n", [0, "content", 0, "text"]]
        }
      }
    ],
    "result": {
      "summary": [1, "content"],
      "sources": [0, "content"]
    }
  }
}
```

## Calling Other Venues

Use MCP to call tools on other Covia venues:

```json
{
  "operation": "v/ops/mcp/tools-call",
  "input": {
    "server": "did:web:venue-4.covia.ai",
    "toolName": "analyze-sentiment",
    "arguments": {
      "text": "This product is amazing!"
    }
  }
}
```

This enables federated workflows where operations are distributed across multiple venues.

## Error Handling

MCP failures fail the job with a diagnosable message:

```json
{
  "status": "FAILED",
  "error": "MCP tool 'search' on server https://... failed: Connection refused — check the server is reachable, or re-sync the bridged tool with v/ops/mcp/refresh"
}
```

Common error scenarios:
- **Connection errors**: the message names the tool, server and root cause
- **Authentication errors**: invalid or missing token / unresolvable secret reference (fail-closed — a missing secret never silently connects unauthenticated)
- **Tool not found**: the requested tool doesn't exist on the server
- **Tool-level errors**: a remote tool that reports `isError` fails the job with the remote error text — never a "successful" result carrying an error payload
- **Invalid arguments**: arguments don't match the tool's schema

## Caching and Performance

MCP tool calls are not cached by default since tool results may change. For cacheable operations, consider:

1. Wrapping MCP calls in an operation that handles caching
2. Using the Grid's artifact system to store results

## Security Considerations

### Token Handling

- Never include tokens in client-side code
- Use venue-side credential configuration for sensitive tokens
- Rotate tokens regularly

### Server Validation

- Verify MCP server identity before sending sensitive data
- Use HTTPS for all MCP communications
- Consider IP allowlisting for production deployments

### Audit and Compliance

All MCP tool invocations create Jobs in your venue, providing:
- Complete audit trail of tool usage
- Ability to track which tools are being used
- Input/output logging for compliance

## Example: Multi-Tool Workflow

This example shows a complete workflow using multiple MCP tools:

```json
{
  "name": "Research Assistant",
  "description": "Search, fetch, and summarize information on a topic",
  "operation": {
    "adapter": "orchestrator",
    "input": {
      "type": "object",
      "properties": {
        "topic": { "type": "string", "description": "Research topic" }
      },
      "required": ["topic"]
    },
    "steps": [
      {
        "name": "Search",
        "op": "v/ops/mcp/tools-call",
        "input": {
          "server": "did:web:search.example.com",
          "toolName": "web-search",
          "arguments": { "query": ["input", "topic"], "limit": 5 }
        }
      },
      {
        "name": "Fetch First Result",
        "op": "v/ops/mcp/tools-call",
        "input": {
          "server": "did:web:fetch.example.com",
          "toolName": "fetch-url",
          "arguments": { "url": [0, "results", 0, "url"] }
        }
      },
      {
        "name": "Summarize",
        "op": "v/ops/langchain/openai",
        "input": { "prompt": ["concat", "Summarise this page:\n", [1, "content"]] }
      }
    ],
    "result": {
      "summary": [2, "content"],
      "source_url": [0, "results", 0, "url"],
      "all_results": [0, "results"]
    }
  }
}
```

## Related Documentation

- [Venues as MCP Servers](./venues-as-mcp-servers) - Exposing your operations via MCP
- [Orchestrator Adapter](../adapters/orchestrator) - Building multi-step workflows
- [COG-7: Operations](/docs/protocol/cogs/COG-007) - Operation specification
