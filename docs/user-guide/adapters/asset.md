---
title: Assets
sidebar_label: Assets
---

# Asset Adapter

The asset adapter manages **immutable, content-addressed assets**: store data once, get back an ID that is the cryptographic hash of its metadata, and that ID verifies the content forever. Assets are how skills, operation definitions, documents, and artifacts travel the grid tamper-evidently.

## Operations

| Operation | Purpose |
|-----------|---------|
| `asset:store` | Store metadata (plus optional content) in your `a/` namespace |
| `asset:get` | Read asset metadata from any resolvable address |
| `asset:content` | Retrieve the binary payload (size-capped, default 1 MB) |
| `asset:list` | List your own assets, paginated, filterable by type |
| `asset:pin` | Snapshot any resolvable value — including a remote venue's — into your store |

```json
{
  "operation": "v/ops/asset/store",
  "input": {
    "metadata": { "name": "Q1 Report", "type": "document" },
    "contentText": "Revenue up 14%..."
  }
}
```

Returns `{id: "did:key:z.../a/<hash>", stored: true}`. Storing identical metadata returns the identical ID — idempotent by construction.

## Content addressing, strictly

The asset ID is the CAD3 hash of the **stored metadata**, and content bytes are bound in via `content.sha256` — so the ID commits to the payload transitively. The venue never silently rewrites caller metadata (that would change the asset's identity); the single documented write is injecting `content.sha256`, and a declared hash that mismatches the actual bytes is an error, not a correction. Content is supplied as hex (`content`) or plain text (`contentText`), never both.

## Pin: adoption with verification

`asset:pin` makes a reference durable. Pinning a remote `did:` reference fetches it, **verifies metadata and content hashes**, and copies it into your own store — the explicit act that turns "something a remote venue serves today" into "something I hold". Reads and pins accept the same universal addressing as everything else: hashes, `a/<hash>`, DID URLs, workspace paths.

## Access Control

All operations require an authenticated caller. Assets are per-user exactly like workspace paths: reads need `asset/read`, stores need `asset/store`, and a cross-user read your proofs don't cover is a **denial, never a silent miss**. The one deliberate exception: the venue's own catalog is publicly readable — operations must be discoverable.

## Related

- [Covia (Venue) Adapter](./venue-adapter) — mutable lattice state, by contrast
- [Skills](./skills) — skills as published assets
- [COG-5: Assets](../../protocol/cogs/COG-005) — the specification
