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
  "operation": "mcp:tools:list",
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
  "operation": "mcp:tools:call",
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

## Server Identification

You can identify MCP servers using either URLs or DIDs:

### By URL

```json
{
  "server": "https://venue-test.covia.ai/mcp"
}
```

### By DID

```json
{
  "server": "did:web:venue-test.covia.ai"
}
```

When using a DID, the venue resolves it to find the MCP endpoint from the DID document's service entries.

## Authentication

### Passing Tokens

If the MCP server requires authentication, include a token:

```json
{
  "operation": "mcp:tools:call",
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

### Using Venue Credentials

For frequently-used MCP servers, configure credentials in your venue:

```json
{
  "mcp": {
    "servers": {
      "protected-server": {
        "url": "https://protected-server.example.com",
        "token": "configured-api-key"
      }
    }
  }
}
```

Then reference by name:

```json
{
  "operation": "mcp:tools:call",
  "input": {
    "server": "protected-server",
    "toolName": "private-search",
    "arguments": { "query": "data" }
  }
}
```

## Orchestrating MCP Tools

Combine MCP tool calls with other operations in orchestrations:

```json
{
  "name": "Search and Summarize",
  "operation": {
    "adapter": "orchestrator",
    "steps": [
      {
        "op": "mcp:tools:call",
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
        "op": "langchain:summarize",
        "name": "Summarize Results",
        "input": {
          "text": [0, "content", 0, "text"]
        }
      }
    ],
    "result": {
      "summary": [1, "summary"],
      "sources": [0, "content"]
    }
  }
}
```

## Calling Other Venues

Use MCP to call tools on other Covia venues:

```json
{
  "operation": "mcp:tools:call",
  "input": {
    "server": "did:web:venue-2.covia.ai",
    "toolName": "analyze-sentiment",
    "arguments": {
      "text": "This product is amazing!"
    }
  }
}
```

This enables federated workflows where operations are distributed across multiple venues.

## Error Handling

MCP errors are returned in the job output:

```json
{
  "status": "failed",
  "error": "MCP error: Tool not found: unknown-tool"
}
```

Common error scenarios:
- **Connection errors**: Server unreachable or timeout
- **Authentication errors**: Invalid or missing token
- **Tool not found**: Requested tool doesn't exist on the server
- **Invalid arguments**: Arguments don't match the tool's schema

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
        "op": "mcp:tools:call",
        "input": {
          "server": "did:web:search.example.com",
          "toolName": "web-search",
          "arguments": { "query": ["input", "topic"], "limit": 5 }
        }
      },
      {
        "name": "Fetch First Result",
        "op": "mcp:tools:call",
        "input": {
          "server": "did:web:fetch.example.com",
          "toolName": "fetch-url",
          "arguments": { "url": [0, "results", 0, "url"] }
        }
      },
      {
        "name": "Summarize",
        "op": "langchain:summarize",
        "input": { "text": [1, "content"] }
      }
    ],
    "result": {
      "summary": [2, "summary"],
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
