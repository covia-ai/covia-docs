---
id: covia-with-mcp
title: Covia with MCP
sidebar_label: MCP
---

# MCP Adapter

Covia is natively integrated with the [Model Context Protocol Protocol (MCP)](https://modelcontextprotocol.io/) to enhance your AI applications with real-time data and context.

## Overview

The Model Context Protocol (MCP) is a standard for connecting AI models to external data sources and tools. Covia's integration with MCP allows you to:

- Access real-time data from various sources
- Provide contextual information to AI models
- Enable dynamic data retrieval during conversations
- Maintain secure and controlled data access

## MCP Server Capabilities

Every venue on the Covia grid is **automatically** functional as an MCP server. So you don't need to do anything special to tap into MCP capabilities: just run your venue and connect with standard MCP tools.

To enable the MCP server, simple include an `"mcp"` property in your venue configuration, e.g.:

```json
{
  "name":"My Venue",
  ...
  "mcp":{
    "enabled":true
  }
}
```

## MCP Grid operations

The MCP adapter lets you utilise MCP servers and tools as grid operations. Compared to integrating with an MCP server directly, this gives a number of unique advantages:
- Plug-and-play orchestration with other grid operations and services
- Having a system of record / audit trail maintained within your own venue
- Handling authentication / API keys in a controlled manner
