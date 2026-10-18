---
title: Covia Venue
sidebar_label: Covia Venue
description: The generic lattice interface for the venue. Read, write, list, slice, copy, and inspect any path in the authenticated caller's namespace with capability checks at the point of action.
---

# Covia Venue Adapter

Everything on a venue (agent memory, workflow state, shared records, the operation catalog itself) ultimately lives as lattice state, and this is the adapter that reads and writes it. The `covia` adapter is the generic lattice interface for the venue: nine operations that navigate the authenticated caller's namespace by JSON-friendly paths like `w/my-notes` or `g/my-agent/state`, with capability checks at the point of action and no need to understand the underlying CVM key types.

## Operations

| Operation | Input | Writable paths | Purpose |
|-----------|-------|----------------|---------|
| `covia:read` | `path`, `maxSize?` | All | Read a value. Returns `{exists, value}` |
| `covia:write` | `path`, `value` | `w/`, `o/` | Store a value (creates intermediate maps) |
| `covia:delete` | `path` | `w/`, `o/` | Remove a value (idempotent) |
| `covia:append` | `path`, `value` | `w/`, `o/` | Append to a vector |
| `covia:copy` | `from`, `to` | `w/`, `o/` | Copy a value from one path to another |
| `covia:list` | `path`, `limit?`, `offset?` | All | List keys with pagination |
| `covia:slice` | `path`, `limit?`, `offset?` | All | Paginate collection elements |
| `covia:inspect` | `paths`, `budget?` | All | Compact budget-controlled preview |
| `covia:aggregate` | `path` | All | Compute a reduction over a path's children |

### covia:read · read a value

```json
{ "operation": "v/ops/covia/read", "input": { "path": "w/my-vendors/acme" } }
```

Returns `{"exists": true, "value": {"name": "Acme Corp", "status": "active"}}`, or `{"exists": false, "value": null}` if nothing is stored there. A stored `null` counts as present; use `exists` to disambiguate. Deep paths navigate into nested maps and vectors (`w/my-records/acme/contact/email`).

### covia:write · store a value

```json
{
  "operation": "v/ops/covia/write",
  "input": {
    "path": "w/my-vendors/acme",
    "value": { "name": "Acme Corp", "status": "active" }
  }
}
```

Creates intermediate maps for deep paths. Only `w/` (workspace) and `o/` (operation pins) are writable through this adapter.

### covia:delete · remove a value

```json
{ "operation": "v/ops/covia/delete", "input": { "path": "w/my-vendors/acme" } }
```

Idempotent: deleting a non-existent path succeeds.

### covia:append · add to a vector

```json
{
  "operation": "v/ops/covia/append",
  "input": { "path": "w/my-events", "value": { "type": "invoice_received" } }
}
```

Creates the vector if it doesn't exist. Useful for event logs and audit trails.

### covia:list · list keys

```json
{ "operation": "v/ops/covia/list", "input": { "path": "w/my-vendors", "limit": 20 } }
```

Returns `{"exists": true, "type": "Map", "totalSize": 42, "offset": 0, "keys": ["acme", "globex", ...]}`. Shows structure without fetching values.

### covia:inspect · budget-controlled preview

```json
{
  "operation": "v/ops/covia/inspect",
  "input": { "paths": "w/my-vendors", "budget": 500 }
}
```

Renders data as a compact preview, truncated to fit the byte budget (default 500 bytes). Accepts a single path or an array of paths. For data of unknown size, prefer `covia:inspect` over `covia:read`: it returns a budget-controlled summary rather than failing when the value exceeds `maxSize`.

### covia:slice, covia:copy, covia:aggregate

- **`covia:slice`** paginates vector elements or map entries at a path: `{path, offset, limit}` returns elements or `{key, value}` pairs.
- **`covia:copy`** moves a value from one writable path to another in one step: `{from, to}`.
- **`covia:aggregate`** reduces over a path's children (counts, sums, structural rollups).

## Paths, not keys

JSON callers reference lattice content by paths like `w/foo/bar`, not by the internal CVM key types each lattice level uses. The adapter resolves each segment to the canonical key for that level (`KeyedLattice` keywords, `IndexLattice` blobs, string-keyed maps, etc.) so callers never need to construct typed keys. In the reverse direction, listings convert CVM keys back to JSON-friendly form.

A cross-user path works the same way: `did:key:z6Mk…/w/shared/report` reads from another user's shared workspace, subject to their capability grants.

## Lattice namespaces

The addressable namespaces for the authenticated caller:

| Prefix | Access | Content |
|--------|--------|---------|
| `w/` | Read/Write | User workspace (your persistent data) |
| `o/` | Read/Write | Operation pins (named operations for reuse) |
| `n/` | Read | Agent-private notes |
| `g/` | Read | Agent records (state, timeline, config) |
| `s/` | Read | Secrets (encrypted) |
| `j/` | Read | Job records |
| `h/` | Read | HITL inbox |
| `a/` | Read | Assets (content-addressed) |
| `v/ops/` | Read | Venue operations catalog |
| `v/info/` | Read | Venue metadata |

Framework-managed namespaces (`n/`, `g/`, `s/`, `j/`, `h/`, `v/`) are read-only via the Covia adapter. Use dedicated operations (e.g. `agent:create`, `secret:set`, `asset:store`) to modify them.

## Access Control

Reads require `crud/read` on the resolved path; writes require `crud/write` on a writable root (`w/` or `o/` by default). Cross-user reads require the target user to have granted a readable capability to the caller's DID. See [UCAN](./ucan) for the authority model.

## Related

- [UCAN Adapter](./ucan): capability model that gates every read and write
- [Asset Adapter](./asset): content-addressed storage in the `a/` namespace
- [Secret Adapter](./secret): encrypted values in the `s/` namespace
- [Agents: Tools and Context](../agents/tools-and-context): how agents use these operations at runtime
