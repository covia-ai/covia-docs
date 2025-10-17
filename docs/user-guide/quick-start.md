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

## Using the SDK

We're building the Covia SDK for developers in the form of open source libraries for multiple language ecosystems, starting with:
- TypeScript / JavaScript
- Python
- Java
- Rust

This enables grid operations and artifacts to be accessed by simple one-liners, e.g.

```java
// Connect to a find
Venue myVenue = Grid.connect("did:web:venue-test.covia.ai", credentials);

// Look up a remote operation
Operation myOp = myVenue.findOperation("Document Summary Service");

// Run the operation on the grid
Object result = myVenue.run("Give me a summary of the last 5 blog posts");
```

Say goodbye to complex glue code! The SDK is coming soon, so stay connected to see updates!



# Adapters

Covia provides a comprehensive set of adapters that enable seamless integration with various protocols, frameworks, and services. These adapters allow you to connect Covia with your existing infrastructure and tools.

## Available Adapters

### Protocol Adapters
- **[A2A Adapter](adapters/covia-with-a2a)** - Agent-to-Agent Protocol integration for multi-agent systems
- **[MCP Adapter](adapters/covia-with-mcp)** - Model Context Protocol integration for real-time data access

### Framework Adapters
- **[LangChain Adapter](adapters/langchain-adapter)** - LangChain framework integration for AI application development

### Infrastructure Adapters
- **[HTTP Adapter](adapters/http-adapter)** - HTTP and REST API integration
- **[Grid Adapter](adapters/grid-adapter)** - Distributed computing and resource management
- **[Orchestrator](adapters/orchestrator)** - Workflow coordination and management
- **[Venue Adapter](adapters/venue-adapter)** - Core service hosting and infrastructure

## Getting Started

Choose the adapter that best fits your integration needs. Each adapter provides specific capabilities and can be used independently or in combination with others to build comprehensive AI solutions.

For detailed information about each adapter, refer to the individual adapter documentation pages.
