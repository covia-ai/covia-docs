---
id: grid-adapter
title: Grid Adapter
sidebar_label: Grid
---

# Grid Adapter

The Grid adapter enables distributed operation execution across the Covia network. Operations can run locally or on remote venues — the interface is the same either way.

## Operations

### grid:run — Synchronous Execution

Execute an operation and wait for the result.

```json
{
  "operation": "grid:run",
  "input": {
    "operation": "v/ops/json/merge",
    "input": {
      "values": [{ "a": 1 }, { "b": 2 }]
    }
  }
}
```

Returns the operation's output directly.

**Remote execution** — specify a venue URL or DID:

```json
{
  "operation": "grid:run",
  "input": {
    "operation": "v/ops/test/echo",
    "input": { "message": "hello" },
    "venue": "https://other-venue.covia.ai"
  }
}
```

### grid:invoke — Asynchronous Execution

Submit an operation and return immediately with a job ID.

```json
{
  "operation": "grid:invoke",
  "input": {
    "operation": "v/ops/langchain/openai",
    "input": { "prompt": "Summarise this document..." }
  }
}
```

**Response:**

```json
{
  "id": "0x1234...",
  "status": "PENDING",
  "created": 1712930400000
}
```

### grid:jobStatus — Poll Job

Check the current status of a previously submitted job.

```json
{ "operation": "grid:jobStatus", "input": { "id": "0x1234..." } }
```

**Response:**

```json
{
  "id": "0x1234...",
  "status": "COMPLETE",
  "created": 1712930400000,
  "updated": 1712930412000,
  "output": { "response": "The document describes..." }
}
```

### grid:jobResult — Wait for Result

Block until a job completes and return its output.

```json
{ "operation": "grid:jobResult", "input": { "id": "0x1234..." } }
```

Returns the operation's output directly, or errors if the job failed.

## Operations Reference

| Operation | Input | Description |
|-----------|-------|-------------|
| `grid:run` | `operation`, `input?`, `venue?` | Execute synchronously, return result |
| `grid:invoke` | `operation`, `input?`, `venue?` | Execute asynchronously, return job ID |
| `grid:jobStatus` | `id`, `venue?` | Poll job status |
| `grid:jobResult` | `id`, `venue?` | Wait for job completion, return result |

## Operation References

The `operation` parameter accepts multiple formats:

| Format | Example | Description |
|--------|---------|-------------|
| Venue catalog path | `v/ops/json/merge` | Operation from the venue's catalog |
| User pin | `o/my-pipeline` | Named operation from your workspace |
| Asset ID | `0x7a8b9c0d...` | Content-addressed asset hash |
| DID URL | `did:web:venue.com/v/ops/test/echo` | Operation on a specific remote venue |

## Patterns

### Fire and Forget

```
grid:invoke → get job ID → continue other work → grid:jobResult when ready
```

### Fan-Out / Fan-In

Submit multiple operations in parallel, then collect results:

```
grid:invoke op-A → job-1
grid:invoke op-B → job-2
grid:invoke op-C → job-3
grid:jobResult job-1 → result-A
grid:jobResult job-2 → result-B
grid:jobResult job-3 → result-C
```

### Cross-Venue Federation

Execute an operation on a remote venue — caller identity is automatically propagated for audit and access control:

```json
{
  "operation": "grid:run",
  "input": {
    "operation": "v/ops/covia/read",
    "input": { "path": "w/shared-data" },
    "venue": "did:web:partner-venue.example.com"
  }
}
```

## Related

- [REST API](/docs/user-guide/api) — HTTP endpoints for invoking operations
- [Orchestrator](./orchestrator) — multi-step workflows using grid operations
- [COG-007: Operations](/docs/protocol/cogs/COG-007) — Operation specification
