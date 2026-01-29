---
title: Getting Started
sidebar_position: 1
---

# Getting Started

The easiest way to get started with Covia is go the the [Covia App](https://app.covia.ai)

This lets you connect to venues and run test operations on the Grid. There are a number of example venues available by default for testing:
- [Test Venue](https://venue-test.covia.ai) - DID: `did:web:venue-test.covia.ai`
- [Venue One](https://venue-1.covia.ai) - DID: `did:web:venue-1.covia.ai`
- [Venue Two](https://venue-1.covia.ai) - DID: `did:web:venue-2.covia.ai`

Every publicly accessible venue will have a Decentralized ID (DID) which can be used to reference it on the grid.

## REST API

Venues expose a REST API for programmatic access. See the [API Reference](api/) for complete documentation of available endpoints:

- Asset management (create, retrieve, list)
- Operation invocation and job management
- Grid queries and venue status

## Using the SDK

The Covia SDK provides client libraries for building applications on the Grid:

- **[Java SDK](sdk/java)** - Reference implementation with full Grid access
- **[Python SDK](sdk/python)** - For data science, ML workflows, and scripting
- **[TypeScript SDK](sdk/typescript)** - For web apps and Node.js

This enables grid operations and artifacts to be accessed by simple one-liners:

```java
// Connect to a venue
Venue myVenue = Grid.connect("did:web:venue-test.covia.ai", credentials);

// Look up a remote operation
Operation myOp = myVenue.findOperation("Document Summary Service");

// Run the operation on the grid
Object result = myVenue.run("Give me a summary of the last 5 blog posts");
```

See the [SDK documentation](sdk/) for detailed guides and API references.

## MCP Integration

Covia venues support the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), enabling AI assistants to interact directly with the Grid:

- **[Venues as MCP Servers](mcp/venues-as-mcp-servers)** - Expose your operations to AI assistants
- **[Calling MCP Tools](mcp/calling-mcp-tools)** - Invoke external MCP tools via the Grid

This allows seamless integration with tools like Claude, enabling natural language interaction with Grid operations.



# Adapters

Covia provides a comprehensive set of adapters that enable seamless integration with various protocols, frameworks, and services. These adapters allow you to connect Covia with your existing infrastructure and tools.

## Available Adapters

### Protocol Adapters
- **[A2A Adapter](adapters/covia-with-a2a.md)** - Agent-to-Agent Protocol integration for multi-agent systems
- **[MCP Adapter](adapters/covia-with-mcp.md)** - Model Context Protocol integration for real-time data access

### Framework Adapters
- **[LangChain Adapter](adapters/langchain-adapter.md)** - LangChain framework integration for AI application development

### Infrastructure Adapters
- **[HTTP Adapter](adapters/http-adapter.md)** - HTTP and REST API integration
- **[Grid Adapter](adapters/grid-adapter.md)** - Distributed computing and resource management
- **[Orchestrator](adapters/orchestrator.md)** - Workflow coordination and management
- **[Venue Adapter](adapters/venue-adapter.md)** - Core service hosting and infrastructure

## Getting Started

Choose the adapter that best fits your integration needs. Each adapter provides specific capabilities and can be used independently or in combination with others to build comprehensive AI solutions.

For detailed information about each adapter, refer to the individual adapter documentation pages.
