---
sidebar_position: 2
---

# Venues as MCP Servers

Every Covia venue can function as an MCP (Model Context Protocol) server, automatically exposing its operations as tools that AI assistants can use.

## Enabling MCP

The MCP endpoint registers when an `mcp` block is present in the venue configuration; the built-in default configuration (and the published Docker image) includes one, so a stock venue serves MCP out of the box. To configure it explicitly:

```json
{
  "name": "My Venue",
  "mcp": {
    "enabled": true
  }
}
```

## MCP Endpoint

The MCP endpoint is available at `/mcp` on your venue:

```
https://your-venue.example.com/mcp
```

This endpoint implements the MCP **Streamable HTTP** transport: JSON-RPC over `POST /mcp`, an optional SSE stream via `GET /mcp` for server-to-client notifications, and `DELETE /mcp` to close a session (see the [REST API reference](../api/#mcp-endpoints)).

## Connecting AI Assistants

### Claude (claude.ai and Claude Desktop)

Remote venues are added as **custom connectors**: go to **Settings → Connectors → Add custom connector** and paste your venue's `/mcp` URL. Custom connectors require a public HTTPS endpoint; a `http://localhost:8080/mcp` venue won't work here. See the [Claude tutorial](../tutorials/claude-mcp) for a full walkthrough.

### Claude Code

```bash
claude mcp add --transport http my-venue https://your-venue.example.com/mcp
```

For a venue that requires authentication, add a bearer token header:

```bash
claude mcp add --transport http my-venue https://your-venue.example.com/mcp \
  --header "Authorization: Bearer your-api-key"
```

### Clients using a generic MCP config file

```json
{
  "mcpServers": {
    "my-venue": {
      "url": "https://your-venue.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

(The `headers` block is only needed when the venue requires authentication.)

### Other MCP Clients

Any MCP client that supports the Streamable HTTP transport can connect. Consult your client's documentation for configuration details.

## How Operations Become Tools

Covia automatically converts operations to MCP tools. Tool names are derived from operation names by replacing colons and slashes with underscores:

| Operation | MCP Tool Name |
|-----------|---------------|
| `covia:read` | `covia_read` |
| `agent:create` | `agent_create` |
| `mcp:tools:call` | `mcp_tools_call` |

Operations are discovered dynamically from the venue's adapter registries: any operation with a valid input schema is automatically exposed as an MCP tool.

### Operation Metadata

```json
{
  "name": "Web Search",
  "description": "Search the web for information",
  "operation": {
    "adapter": "http",
    "input": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        },
        "limit": {
          "type": "integer",
          "description": "Maximum results",
          "default": 10
        }
      },
      "required": ["query"]
    }
  }
}
```

### Resulting MCP Tool

```json
{
  "name": "web_search",
  "description": "Search the web for information",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum results",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

The AI assistant sees this tool and can invoke it naturally during conversation.

## Tool Discovery

MCP clients can discover available tools using the `tools/list` method. This returns all operations on the venue that are suitable for use as tools.

### Filtering Tools

You can control which operations appear as MCP tools using the `operation.info` metadata:

```json
{
  "name": "Internal Operation",
  "operation": {
    "adapter": "http",
    "info": {
      "mcp": false
    }
  }
}
```

Operations with `"mcp": false` will not appear in the MCP tools list.

### Featured Tools

Mark important tools to appear prominently:

```json
{
  "name": "Primary Search",
  "operation": {
    "adapter": "http",
    "info": {
      "featured": true,
      "category": "search"
    }
  }
}
```

## Tool Execution

When an AI assistant invokes a tool:

1. **MCP Request**: The assistant sends a `tools/call` request
2. **Job Creation**: The venue creates a Job to track execution
3. **Operation Execution**: The operation runs with the provided arguments
4. **Response**: Results are returned to the assistant

### Example Flow

```
AI Assistant                    Covia Venue
     |                               |
     |--- tools/list --------------->|
     |<-- [web_search, ...] ---------|
     |                               |
     |--- tools/call(web_search) --->|
     |         {query: "AI news"}    |
     |                               |
     |<-- {results: [...]} ----------|
```

## Error Handling

Errors are returned using MCP's standard error format:

```json
{
  "error": {
    "code": -32000,
    "message": "Operation failed: Connection timeout"
  }
}
```

The venue maps operation failures to appropriate MCP error codes.

## Security Considerations

### Authentication

MCP requests are subject to the same authentication requirements as REST API requests. Configure authentication using API keys or other supported methods.

### Rate Limiting

Tool invocations count toward your venue's rate limits. Configure appropriate limits to prevent abuse.

### Sensitive Operations

Review which operations should be exposed via MCP. Use the `"mcp": false` flag to hide internal or sensitive operations.

## Best Practices

### Tool Design

- **Clear Names**: Name operations so the derived tool reads as an action: `search:documents` becomes `search_documents`, which beats `doc_srch`
- **Helpful Descriptions**: Write descriptions that help AI understand when to use the tool
- **Typed Parameters**: Use JSON Schema to fully describe parameters with types and descriptions

### Schema Quality

- **Required Fields**: Mark truly required parameters as required
- **Defaults**: Provide sensible defaults where appropriate
- **Examples**: Include examples in descriptions to guide AI usage

### Testing

Test your operations with AI assistants before deployment:

1. Connect to your venue via MCP
2. Ask the AI to discover and use your tools
3. Verify the AI correctly understands when and how to use each tool

## Related Documentation

- [COG-7: Operations](/docs/protocol/cogs/COG-007) - Operation specification
- [Calling MCP Tools](./calling-mcp-tools) - Invoking external MCP tools
- [API Reference](../api) - REST API documentation
