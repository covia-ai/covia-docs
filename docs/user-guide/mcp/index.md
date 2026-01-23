---
sidebar_position: 1
---

# MCP Integration Overview

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard for connecting AI models to external data sources and tools. Covia provides deep integration with MCP, enabling two powerful use cases:

1. **Venues as MCP Servers** - Every Covia venue can act as an MCP server, exposing its operations as tools that AI assistants can use
2. **MCP Tools via the Grid** - Call any MCP server's tools as Grid operations, enabling orchestration, auditing, and federated access

## Why MCP + Covia?

### For AI Application Developers

- **Instant Tool Access**: Connect your AI assistant to any Covia venue and immediately access all its operations as tools
- **Standardised Interface**: Use the same MCP protocol regardless of which venue provides the functionality
- **Discovery**: Browse available tools through MCP's standard discovery mechanisms

### For Operation Providers

- **Zero Configuration**: Operations you create are automatically available as MCP tools
- **Consistent Experience**: Your operations work with any MCP-compatible AI assistant
- **Secure Access**: Leverage Covia's authentication and authorization for tool access

### For Enterprise

- **Audit Trail**: All tool invocations go through the Grid, providing a complete audit log
- **Governance**: Apply consistent policies across all AI tool usage
- **Orchestration**: Combine MCP tools with other Grid operations in workflows

## Quick Start

### Connect AI Assistant to a Venue

Add this to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "covia-venue": {
      "url": "https://venue-test.covia.ai/mcp"
    }
  }
}
```

Your AI assistant can now use all operations on that venue as tools.

### Call MCP Tools via the Grid

Use the Grid to invoke any MCP server's tools:

```json
{
  "operation": "mcp:toolCall",
  "input": {
    "server": "https://some-mcp-server.example.com",
    "toolName": "search",
    "arguments": {
      "query": "hello world"
    }
  }
}
```

## Documentation

- [Venues as MCP Servers](./venues-as-mcp-servers) - How to expose your venue's operations via MCP
- [Calling MCP Tools](./calling-mcp-tools) - How to invoke external MCP tools through the Grid
