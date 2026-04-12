---
id: venue-adapter
title: Covia (Venue) Adapter
sidebar_label: Covia (Venue)
---

# Covia Adapter

The Covia adapter provides workspace CRUD, data inspection, and lattice access. These are the core operations for reading and writing data on a venue.

## Workspace Operations

### covia:read — Read a Value

```json
{ "operation": "covia:read", "input": { "path": "w/vendor-records/acme" } }
```

**Response:** `{ "exists": true, "value": { "name": "Acme Corp", "status": "active" } }`

Supports deep paths: `w/records/acme/contact/email` navigates into nested maps. Numeric keys index into vectors.

### covia:write — Store a Value

```json
{
  "operation": "covia:write",
  "input": {
    "path": "w/vendor-records/acme",
    "value": { "name": "Acme Corp", "status": "active" }
  }
}
```

Creates intermediate maps for deep paths. Only `w/` (workspace) and `o/` (operation pins) are writable.

### covia:delete — Remove a Value

```json
{ "operation": "covia:delete", "input": { "path": "w/vendor-records/acme" } }
```

Idempotent — deleting a non-existent path succeeds.

### covia:append — Add to a Vector

```json
{ "operation": "covia:append", "input": { "path": "w/events", "value": { "type": "invoice_received" } } }
```

Creates the vector if it doesn't exist. Useful for event logs and audit trails.

### covia:list — List Keys

```json
{ "operation": "covia:list", "input": { "path": "w/vendor-records", "limit": 20 } }
```

**Response:** `{ "exists": true, "type": "map", "count": 42, "keys": ["acme", "globex", ...] }`

Supports pagination via `limit` and `offset`. Shows structure without fetching values.

### covia:slice — Paginate Collections

```json
{ "operation": "covia:slice", "input": { "path": "w/events", "offset": 0, "limit": 10 } }
```

Returns elements from vectors or `{key, value}` pairs from maps.

### covia:inspect — Budget-Controlled Preview

```json
{ "operation": "covia:inspect", "input": { "path": "w/vendor-records", "budget": 500 } }
```

Renders data as a compact preview, truncated to fit the byte budget (default 500 bytes). Accepts a single path or an array of paths. Useful for agent context and debugging.

## Operations Reference

| Operation | Input | Writable Paths | Description |
|-----------|-------|----------------|-------------|
| `covia:read` | `path`, `maxSize?` | All | Read value at path |
| `covia:write` | `path`, `value` | `w/`, `o/` | Store value (creates intermediates) |
| `covia:delete` | `path` | `w/`, `o/` | Remove value (idempotent) |
| `covia:append` | `path`, `value` | `w/`, `o/` | Append to vector |
| `covia:list` | `path`, `limit?`, `offset?` | All | List keys with pagination |
| `covia:slice` | `path`, `limit?`, `offset?` | All | Paginate collection elements |
| `covia:inspect` | `path` or `paths`, `budget?` | All | Compact preview |

## Lattice Namespaces

| Prefix | Access | Description |
|--------|--------|-------------|
| `w/` | Read/Write | User workspace — your persistent data |
| `o/` | Read/Write | Operation pins — named operations for reuse |
| `n/` | Read | Agent-private notes |
| `g/` | Read | Agent records (state, timeline, config) |
| `s/` | Read | Secrets (encrypted) |
| `j/` | Read | Job records |
| `a/` | Read | Assets (content-addressed) |
| `v/ops/` | Read | Venue operations catalog |
| `v/info/` | Read | Venue metadata |

Framework-managed namespaces (`g/`, `s/`, `j/`, `v/`) are read-only via the Covia adapter. Use dedicated operations (e.g., `agent:create`, `secret:set`) to modify them.

## Related

- [Agents: Tools and Context](/docs/user-guide/agents/tools-and-context) — how agents use these operations
- [REST API](/docs/user-guide/api) — HTTP endpoints
- [DLFS](./dlfs) — file-based storage (separate from workspace)
