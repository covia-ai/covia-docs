---
title: Convex
sidebar_label: Convex
---

# Convex Adapter

The Convex adapter connects a venue to the [Convex network](https://docs.convex.world/) — the decentralised lattice technology Covia itself is built on. `convex:query` runs read-only Convex Lisp against a peer; `convex:transact` submits signed transactions. Agents and workflows get verifiable, decentralised state and settlement as ordinary grid operations.

## Operations

### convex:query — Read

```json
{
  "operation": "v/ops/convex/query",
  "input": {
    "peer": "peer.convex.live:18888",
    "address": "#13",
    "source": "(* 2 3)"
  }
}
```

Returns the Convex result as `{result, value}` — here `{"result": "6", "value": 6}`. `peer` is optional (the shipped operation defaults to the public `peer.convex.live` peer); `address` is optional for queries.

### convex:transact — Write

Submits a signed transaction: `address` (origin account), `source` (Convex Lisp), and `seed` (the Ed25519 signing seed) are required. The seed is marked secret in the schema — prefer a [secret reference](./secret) over a literal wherever one is accepted.

CVM-level errors (an undefined symbol, a bad signature) come back as a **completed** job with `errorCode` set — the network answered; the answer was an error. Connection and input failures fail the job. A 60-second backstop ensures an unresponsive peer can never park a job forever.

## Related

- [The Grid](/docs/overview/grid) — how Covia uses lattice technology itself
- [Secrets](./secret) — keeping signing seeds out of inputs
