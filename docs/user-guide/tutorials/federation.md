---
title: Federate Two Venues
sidebar_position: 3
---

# Federate Two Venues

This is the demo that makes Covia *Covia*: two independent venues — separate identities, separate data, separate audit trails — collaborating on a task where **the data never leaves its home venue and only results cross the boundary**. You'll run both on your laptop in about ten minutes, then federate with a real venue in the cloud.

**You'll need:** Java 21+ and the `covia.jar` from the [latest release](https://github.com/covia-ai/covia/releases/tag/latest-snapshot) (or build from source). No API keys.

## 1. Start two venues

One process can host multiple venues. Save this as `two-venues.json`:

```json
{
  "venues": [
    { "name": "Venue A", "hostname": "localhost", "port": 8080, "mcp": {} },
    { "name": "Venue B", "hostname": "localhost", "port": 8081, "mcp": {} }
  ]
}
```

```bash
java -jar covia.jar two-venues.json
```

Confirm they're two distinct identities:

```bash
curl -s http://localhost:8080/api/v1/status   # "Venue A", did:key:z6Mkg...
curl -s http://localhost:8081/api/v1/status   # "Venue B", did:key:z6Mks...
```

> Two Docker containers work too — but note that from inside a container, `localhost` is the container itself; put both on a Docker network or use `host.docker.internal`. The single-process config keeps the tutorial friction-free.

## 2. Your first federated call

The [Grid adapter](../adapters/grid-adapter)'s `grid:run` executes an operation and waits for the result. Add a `venue` and the execution happens **there**. From Venue A, run an operation on Venue B:

```json
POST http://localhost:8080/api/v1/invoke
{
  "operation": "v/ops/grid/run",
  "input": {
    "operation": "v/ops/schema/infer",
    "input": { "value": { "name": "Ada", "age": 36 } },
    "venue": "http://localhost:8081"
  },
  "wait": true
}
```

```json
{ "status": "COMPLETE",
  "output": { "schema": { "type": "object", "required": ["age", "name"],
              "properties": { "age": { "type": "integer" }, "name": { "type": "string" } } } }
}
```

Venue A created a job, dispatched the call across the venue boundary, Venue B executed it, and only the result came back. The calling interface is identical to a local invocation — federation is not a special case.

## 3. The data stays put

Now the part that matters for governance. Give Venue B some data that *lives on B*:

```json
POST http://localhost:8081/api/v1/invoke
{
  "operation": "v/ops/covia/write",
  "input": { "path": "w/inventory/widgets",
             "value": { "sku": "W-100", "stock": 42, "location": "Warehouse B" } },
  "wait": true
}
```

From **Venue A**, query it across the boundary:

```json
POST http://localhost:8080/api/v1/invoke
{
  "operation": "v/ops/grid/run",
  "input": {
    "operation": "v/ops/covia/read",
    "input": { "path": "w/inventory/widgets" },
    "venue": "http://localhost:8081"
  },
  "wait": true
}
```

```json
{ "status": "COMPLETE",
  "output": { "value": { "location": "Warehouse B", "sku": "W-100", "stock": 42 }, "exists": true } }
```

The inventory record never moved. Venue A asked a question; Venue B answered it on its own infrastructure, under its own policy. In production, that boundary is governed: B decides who may call ([authentication](../../operator-guide/auth)) and what they may touch ([capabilities](../capabilities)).

## 4. Two sovereign audit trails

Each venue keeps **its own** record of what happened:

```bash
curl -s http://localhost:8081/api/v1/jobs    # B's log: the writes and the federated reads it executed
curl -s http://localhost:8080/api/v1/jobs    # A's log: the grid:run jobs it dispatched
```

Neither side depends on the other for its audit trail — compliance evidence exists on both sides of every cross-boundary call.

## 5. Federate with the cloud

Nothing about this is localhost-specific. Point your laptop venue at a live public venue — by URL or by **DID**:

```json
POST http://localhost:8080/api/v1/invoke
{
  "operation": "v/ops/grid/run",
  "input": {
    "operation": "v/ops/schema/infer",
    "input": { "value": { "city": "London" } },
    "venue": "did:web:venue-3.covia.ai"
  },
  "wait": true
}
```

```json
{ "status": "COMPLETE", "output": { "schema": { "type": "object", "..." : "..." } } }
```

Your laptop just dispatched work to a venue on AWS, addressed by its decentralised identifier — the DID resolved via `/.well-known/did.json` to the venue's API endpoint. That's the grid: any venue, anywhere, one calling convention.

## 6. Long-running work across venues

`grid:run` blocks for the result. For long operations, use the async pair — submit, then poll:

```json
{ "operation": "v/ops/grid/invoke",
  "input": { "operation": "v/ops/schema/infer", "input": { "value": {} }, "venue": "http://localhost:8081" } }
```

returns a job id immediately; collect it later with:

```json
{ "operation": "v/ops/grid/job-result", "input": { "id": "0x1234...", "venue": "http://localhost:8081" } }
```

## Go further

- **Multi-venue orchestrations** — [orchestrator](../adapters/orchestrator) steps each take their own `venue`, so one declarative workflow can fan out across the grid and compose the results.
- **Federated agents** — an [agent](../agents/) on one venue can hold `v/ops/grid/run` as a tool and delegate work to partner venues, under its own [capabilities](../capabilities).
- **Other protocols cross boundaries too** — venues federate over [A2A](../adapters/covia-with-a2a) (agent-to-agent tasks) and [MCP](../mcp/calling-mcp-tools) (remote tool calls), not just `grid:*`.

## Related

- [Grid Adapter](../adapters/grid-adapter) — the full `grid:*` reference
- [The Grid](../../overview/grid) — the conceptual model
- [Operator: Authentication](../../operator-guide/auth) — governing who may call your venue
