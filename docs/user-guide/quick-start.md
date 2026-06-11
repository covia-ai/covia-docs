---
title: Getting Started
sidebar_position: 1
---

# Getting Started

The fastest way to try Covia is against a **hosted venue** — no install required. Every venue exposes the same REST API and SDK surface, so anything you do here works the same on a venue you run yourself.

There are public example venues you can use right now, deployed automatically from the latest development build:

- [venue-3.covia.ai](https://venue-3.covia.ai) (AWS) — `did:web:venue-3.covia.ai`
- [venue-4.covia.ai](https://venue-4.covia.ai) (Azure) — `did:web:venue-4.covia.ai`

Prefer a UI? The [Covia App](https://app.covia.ai) lets you connect to venues and run operations interactively.

## 1. Call a live venue (no install)

List the operations a venue offers, then invoke one and wait for the result. `v/ops/schema/infer` derives a JSON Schema from an example value:

```bash
curl https://venue-3.covia.ai/api/v1/operations

curl -X POST https://venue-3.covia.ai/api/v1/invoke \
  -H "Content-Type: application/json" \
  -d '{
        "operation": "v/ops/schema/infer",
        "input": { "value": { "name": "Ada", "age": 36 } },
        "wait": true
      }'
```

The venue returns a job record whose `output` carries the result.

## 2. From your code

### TypeScript

```bash
npm install @covia/covia-sdk
```

```typescript
import { Grid } from "@covia/covia-sdk";

const venue = await Grid.connect("https://venue-3.covia.ai");
const result = await venue.operations.run("v/ops/schema/infer", {
  value: { name: "Ada", age: 36 },
});
console.log(result); // { schema: { type: "object", ... } }
venue.close();
```

### Python

```bash
pip install covia
```

```python
from covia import Grid

venue = Grid.connect("https://venue-3.covia.ai")
result = venue.run("v/ops/schema/infer", {"value": {"name": "Ada", "age": 36}})
print(result)  # {'schema': {'type': 'object', ...}}
```

A Java SDK (`ai.covia:covia-core`) is also available — see the [SDK reference](sdk/) for the full surface in every language.

## 3. Run your own venue

To control local resources, install custom adapters, or hold your own data, run a venue yourself — it's a single self-contained server:

```bash
docker run -p 8080:8080 ghcr.io/covia-ai/covia:latest
```

Point the examples above at `http://localhost:8080`. See the [Operator Guide](../operator-guide/venue-start) for configuration, persistence, and authentication.

## What's next

- [Tutorials](tutorials/) — guided builds: [give Claude your own tools in 5 minutes](tutorials/claude-mcp), [run an agent against your workspace](tutorials/running-agents)
- [REST API](api/) — the full HTTP surface (assets, operations, jobs, SSE)
- [SDK reference](sdk/) — TypeScript, Python, and Java clients
- [Agents](agents/) — build persistent, tool-using agents
- [Adapters](adapters/) — LLMs, HTTP, files, orchestration, federation, and more
- [MCP integration](mcp/) — use a venue as an MCP server, or call MCP tools from the Grid
- [Capabilities](capabilities) — the UCAN authorisation model
