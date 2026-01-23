---
sidebar_position: 1
---

# Covia SDK Overview

The Covia SDK provides client libraries for building applications on the Grid. SDKs are available for multiple languages, enabling developers to:

- Connect to venues and discover assets
- Invoke operations and monitor jobs
- Upload and download artifacts
- Build AI-powered applications

## Available SDKs

| Language | Package | Status |
| -------- | ------- | ------ |
| [Java](./java) | `covia-core` | Available |
| [Python](./python) | `covia` | Coming Soon |
| [TypeScript](./typescript) | `@covia/sdk` | Coming Soon |

## Core Concepts

All SDKs share the same conceptual model:

### Venue

A `Venue` represents a connection to a Grid node. It's your entry point for all Grid interactions.

### Asset

An `Asset` represents a resource on the Grid - either an artifact (data) or an operation (compute). Assets are identified by their content-addressable Asset ID.

### Job

A `Job` tracks the execution of an operation. Jobs are asynchronous and can be polled or monitored for completion.

## Quick Example

Here's a simple example showing the common pattern across all SDKs:

```java
// Java
Venue venue = Grid.connect("did:web:venue-test.covia.ai");
Asset op = venue.getAsset("0x7a8b9c0d...");
Job job = op.invoke(Map.of("query", "hello world")).get();
Object result = job.getOutput();
```

```python
# Python (coming soon)
venue = covia.connect("did:web:venue-test.covia.ai")
op = venue.get_asset("0x7a8b9c0d...")
job = await op.invoke({"query": "hello world"})
result = job.output
```

```typescript
// TypeScript (coming soon)
const venue = await Covia.connect("did:web:venue-test.covia.ai");
const op = await venue.getAsset("0x7a8b9c0d...");
const job = await op.invoke({ query: "hello world" });
const result = job.output;
```

## Choosing an SDK

- **Java**: Best for enterprise applications, JVM-based systems, and when you need the full reference implementation
- **Python**: Ideal for data science, ML pipelines, and scripting
- **TypeScript**: Perfect for web applications, Node.js backends, and full-stack development

## Direct API Access

If an SDK isn't available for your language, you can use the [REST API](../api) directly. The API is simple and well-documented, making it straightforward to build your own client.
