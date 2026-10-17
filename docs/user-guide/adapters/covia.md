---
title: Covia Venue
sidebar_label: Covia Venue
description: The generic lattice interface for the venue. Read, write, list, slice and inspect any path in the authenticated caller's namespace with capability checks at the point of action.
---

# Covia Venue Adapter

Every agent eventually needs to read and write arbitrary data in its namespace: scratch workspace, agent state, cached results, cross-user references. The `covia` adapter is the generic lattice interface for exactly that. Nine operations navigate the authenticated caller's namespace by JSON-friendly paths like `w/my-notes` or `g/my-agent/state`, with capability checks at the point of action and no need to understand the underlying CVM key types.

## Operations

| Operation | Purpose |
|-----------|---------|
| `covia:read` | Read a value at any lattice path. Returns `{exists, value}` |
| `covia:write` | Write a value under the caller's writable namespace (`w/` or `o/`) |
| `covia:delete` | Remove a value at a writable path |
| `covia:list` | List immediate children of a path (keys only) |
| `covia:inspect` | Budget-controlled summary of a large value (prefer over `read` for unknown-sized data) |
| `covia:slice` | Paginate a vector or map |
| `covia:copy` | Copy a value from one path to another |
| `covia:append` | Append to a vector at a writable path |
| `covia:aggregate` | Compute a reduction over a path's children |

```json
{
  "operation": "v/ops/covia/read",
  "input": {
    "path": "w/my-notes/2026-q1"
  }
}
```

Returns `{exists: true, value: {...}}`, or `{exists: false, value: null}` if nothing is stored there. A stored `null` counts as present; use `exists` to disambiguate.

## Paths, not keys

JSON callers reference lattice content by paths like `w/foo/bar`, not by the internal CVM key types each lattice level uses. The adapter resolves each segment to the canonical key for that level (`KeyedLattice` keywords, `IndexLattice` blobs, string-keyed maps, etc.) so callers never need to construct typed keys. In the reverse direction, listings convert CVM keys back to JSON-friendly form.

The addressable namespaces for the authenticated caller:

| Namespace | Content | Who writes |
|-----------|---------|------------|
| `g/` | Agent records | Framework (via `agent:*`) |
| `w/` | User workspace | User (via `covia:write`) |
| `o/` | Operation metadata | User |
| `s/` | Encrypted secrets | User (via `secret:*`) |
| `j/` | Job records | Framework |
| `h/` | HITL inbox | Framework |
| `a/` | Content-addressed assets | User (via `asset:*`) |

A cross-user path works the same way: `did:key:z6Mk…/w/shared/report` reads from another user's shared workspace, subject to their capability grants.

## Read vs. inspect vs. slice

For data of unknown size, prefer `covia:inspect`: it returns a budget-controlled summary rather than failing when the value exceeds `maxSize`. For paginated access to a large collection, use `covia:slice`. `covia:read` is the direct path when you know the data fits.

## Access Control

Reads require `crud/read` on the resolved path; writes require `crud/write` on a writable root (`w/` or `o/` by default). Cross-user reads require the target user to have granted a readable capability to the caller's DID. See [UCAN](./ucan) for the authority model.

## Related

- [UCAN Adapter](./ucan): capability model that gates every read and write
- [Asset Adapter](./asset): content-addressed storage in the `a/` namespace
- [Secret Adapter](./secret): encrypted values in the `s/` namespace
- [Agents on the Grid](../agents/): how agents use these primitives at runtime
