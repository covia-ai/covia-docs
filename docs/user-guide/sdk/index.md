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
| [Java](./java) | [`ai.covia:covia-core`](https://central.sonatype.com/artifact/ai.covia/covia-core) | [covia-ai/covia](https://github.com/covia-ai/covia) | Available |
| [Python](./python) | `covia` | [covia-ai/covia-sdk-py](https://github.com/covia-ai/covia-sdk-py) | Available |
| [TypeScript](./typescript) | `@covia/covia-sdk` | [covia-ai/covia-sdk](https://github.com/covia-ai/covia-sdk) | Available |
| [Rust](./rust) | — | — | Planned |

Every SDK speaks the same [REST API](../api), so anything one SDK can do, all of them can — but they don't all wrap it the same way, and they are versioned independently of the venue. The table below is the map.

## Cross-SDK parity

The SDKs were written for their own ecosystems, so the same operation has a different **shape** in each. Where a cell says *(REST)*, the SDK has no dedicated wrapper and you call the operation through `invoke` / `run` like any other.

| Concern | Java | Python | TypeScript |
| ------- | ---- | ------ | ---------- |
| Surface style | Flat methods on `Venue` | Flat methods, plus manager **properties** | Manager **properties** throughout |
| Connect | `Grid.connect(conn)` | `Grid.connect(url)` (also a context manager) | `await Grid.connect(url)` |
| Invoke → job | `venue.invoke(op, input)` → `CompletableFuture<Job>` | `venue.invoke(op, input)` → `Job` | `venue.operations.invoke(op, input)` |
| Invoke → result | `venue.run(op, input)` | `venue.run(op, input)` | `venue.operations.run(op, input)` |
| Await a job | `venue.awaitJobResult(id)` | `job.wait(timeout=…)` / `job.result(timeout=…)` | `job.wait()` / `job.result()` |
| Terminal check | `Status` constants | `job.is_finished` (snake_case) | `job.isFinished` (camelCase) |
| Status type | `covia.grid.Status` constants | `JobStatus` enum | `RunStatus` enum, exported as `JobStatus` too |
| Job control | `venue.cancelJob` / `pauseJob` / `resumeJob` / `deleteJob` / `listJobs` | `job.cancel()`, `venue.jobs` | `venue.jobs` |
| Assets | `venue.getAsset` / `registerAsset` / `putAssetContent` | `venue.assets` | `venue.assets` |
| Agents | *(REST)* | `venue.agents` | `venue.agents` |
| Secrets | *(REST)* | `venue.secrets` | `venue.secrets` |
| Workspace | *(REST)* | `venue.workspace` | `venue.workspace` |
| UCAN | `covia.grid.ucan` | `venue.ucan` | `venue.ucan` |
| Skills | *(REST)* | *(REST)* | `venue.skills` |
| Memory | *(REST)* | *(REST)* | `venue.memory` |
| Adapters | *(REST)* | *(REST)* | `venue.adapters` |
| Async model | `CompletableFuture` everywhere | Sync by default; `covia.async_api` mirrors it | `Promise` everywhere |

**Job status is one vocabulary across all three**, defined by the venue and mirrored by each SDK:

`PENDING` → `STARTED` → `COMPLETE` | `FAILED` | `CANCELLED` | `REJECTED` | `TIMEOUT`

plus the interactive states `PAUSED`, `INPUT_REQUIRED` and `AUTH_REQUIRED`. TypeScript names the enum `RunStatus` and exports `JobStatus` as an alias for parity with Python.

:::tip Naming follows the host language
`is_finished` in Python and `isFinished` in TypeScript are the same property — each SDK uses its own ecosystem's casing rather than a single cross-language spelling. Expect the same for every multi-word name.
:::

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
Venue venue = Grid.connect("did:web:venue-3.covia.ai");
Object result = venue.run("v/ops/schema/infer", Map.of("value", Map.of("name", "Ada")));
```

```python
# Python
from covia import Grid

with Grid.connect("did:web:venue-3.covia.ai") as venue:
    result = venue.run("v/ops/schema/infer", {"value": {"name": "Ada"}})
```

```typescript
// TypeScript
const venue = await Grid.connect("did:web:venue-3.covia.ai");
const result = await venue.operations.run("v/ops/schema/infer", { value: { name: "Ada" } });
```

```rust
// Rust (planned)
let venue = Grid::connect("did:web:venue-3.covia.ai").await?;
let result = venue.run("v/ops/schema/infer", json!({"value": {"name": "Ada"}})).await?;
```

## Choosing an SDK

- **Java**: Reference implementation. Best for enterprise applications, JVM-based systems, and when you need the full feature set
- **Python**: Ideal for data science, ML pipelines, scripting, and rapid prototyping. Full sync and async support
- **TypeScript**: Perfect for web applications, Node.js backends, and full-stack development
- **Rust**: For performance-critical systems, embedded applications, and when you need zero-overhead abstractions

## Direct API Access

If an SDK isn't available for your language, you can use the [REST API](../api) directly. The API is simple and well-documented, making it straightforward to build your own client.
