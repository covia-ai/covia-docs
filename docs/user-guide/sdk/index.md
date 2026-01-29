---
sidebar_position: 1
---

# Covia SDK Overview

The Covia SDK provides client libraries for building applications on the Grid. SDKs are available for multiple languages, enabling developers to:

- Connect to venues and discover assets
- Invoke operations and monitor jobs
- Upload and download artifacts
- Build AI-powered applications

SDKs are available for major language ecosystems.

| Language | Package | GitHub | Status |
| -------- | ------- | ------ | ------ |
| [Java](./java) | `covia-core` | [covia-ai/covia](https://github.com/covia-ai/covia) | Available |
| [Python](./python) | `covia` | [covia-ai/covia-sdk-py](https://github.com/covia-ai/covia-sdk-py) | Available |
| [TypeScript](./typescript) | `@covia/sdk` | [covia-ai/covia-sdk-ts](https://github.com/covia-ai/covia-sdk-ts) | Coming Soon |
| [Rust](./rust) | `covia` | [covia-ai/covia-sdk-rs](https://github.com/covia-ai/covia-sdk-rs) | Planned |

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
Venue venue = Grid.connect("did:web:venue.covia.ai");
Object result = venue.run("my-operation", Map.of("query", "hello world"));
```

```python
# Python
from covia import Grid

with Grid.connect("did:web:venue.covia.ai") as venue:
    result = venue.run("my-operation", {"query": "hello world"})
```

```typescript
// TypeScript (coming soon)
const venue = await Covia.connect("did:web:venue.covia.ai");
const result = await venue.run("my-operation", { query: "hello world" });
```

```rust
// Rust (planned)
let venue = Grid::connect("did:web:venue.covia.ai").await?;
let result = venue.run("my-operation", json!({"query": "hello world"})).await?;
```

## Choosing an SDK

- **Java**: Reference implementation. Best for enterprise applications, JVM-based systems, and when you need the full feature set
- **Python**: Ideal for data science, ML pipelines, scripting, and rapid prototyping. Full sync and async support
- **TypeScript**: Perfect for web applications, Node.js backends, and full-stack development
- **Rust**: For performance-critical systems, embedded applications, and when you need zero-overhead abstractions

## Direct API Access

If an SDK isn't available for your language, you can use the [REST API](../api) directly. The API is simple and well-documented, making it straightforward to build your own client.
