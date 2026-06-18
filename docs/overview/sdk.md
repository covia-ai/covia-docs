---
sidebar_position: 4
---

# SDK

Covia ships client SDKs so you can connect to a venue, invoke operations, manage jobs and assets, and drive agents from your own code. Every SDK can connect by URL, DNS name, or DID and supports Ed25519 keypair and bearer authentication.

| Language | Package | Status |
|----------|---------|--------|
| TypeScript / JavaScript | [`@covia/covia-sdk`](https://www.npmjs.com/package/@covia/covia-sdk) | Published |
| Python | [`covia`](https://pypi.org/project/covia/) | Published |
| Java | `ai.covia:covia-core` | Build from source |
| Rust | — | Planned |

A minimal example (TypeScript):

```typescript
import { Grid } from "@covia/covia-sdk";

const venue = await Grid.connect("https://venue-3.covia.ai");
const result = await venue.operations.run("v/ops/schema/infer", {
  value: { name: "Ada", age: 36 },
});
venue.close();
```

No SDK for your language? Every venue exposes the same [REST API](../user-guide/api/), so you can call it directly with any HTTP client.

## Compatibility

Each artifact versions independently; the platform version names the product generation. Current pairings:

| Platform (venue) | TypeScript SDK | Python SDK |
|------------------|---------------|------------|
| 0.1.0 | ≥ 1.5.0 | ≥ 0.2.0 |
| 0.2.0 | ≥ 1.5.0 | ≥ 0.2.0 |

Older SDK versions generally keep working against newer venues (the REST surface is additive pre-1.0), but new operations and fields need the SDK version shown. This table gains a row per platform release.

## Where to go next

- [SDK reference](../user-guide/sdk/) — full surface for each language (operations, jobs, assets, agents, secrets, UCAN)
- [Quick Start](../user-guide/quick-start) — zero to your first operation
- [REST API](../user-guide/api/) — the underlying HTTP interface
