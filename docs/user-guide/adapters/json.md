---
title: JSON
sidebar_label: JSON
sidebar_position: 7
---

# JSON Adapter

The JSON adapter provides four pure data manipulation primitives for composing structured outputs and declarative branching in orchestrations. All operations are pure functions with sub-millisecond execution — no IO, no external calls.

## Operations

### json:merge — Deep Merge

Merges a vector of maps using [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396) JSON Merge Patch semantics. Later values win on key conflict; nested maps merge recursively; `null` values delete keys.

```json
{
  "operation": "json:merge",
  "input": {
    "values": [
      { "decision": "ESCALATED", "tier": "manager" },
      { "invoice": { "vendor": "Acme Corp", "amount": 15600 } },
      { "policy_passed": true }
    ]
  }
}
```

**Result:**

```json
{
  "decision": "ESCALATED",
  "tier": "manager",
  "invoice": { "vendor": "Acme Corp", "amount": 15600 },
  "policy_passed": true
}
```

Use `merge` to compose outputs from multiple pipeline steps (e.g., LLM decision + invoice data + policy rules).

### json:cond — Conditional Selection

Returns the `then` value of the first case whose `when` is truthy. Only `null` and `false` are falsy — everything else (including `0`, `""`, `[]`, `{}`) is truthy.

```json
{
  "operation": "json:cond",
  "input": {
    "cases": [
      { "when": false, "then": { "route": "auto-approve" } },
      { "when": true,  "then": { "route": "manager", "approver": "J. Martinez" } },
      { "when": false, "then": { "route": "vp" } }
    ],
    "default": { "route": "unknown" }
  }
}
```

**Result:** `{ "route": "manager", "approver": "J. Martinez" }`

Use `cond` for declarative branching in orchestrations without invoking an LLM.

### json:assoc — Set Value at Path

Sets a value at a path in a map, creating intermediate maps for missing keys. Equivalent to Clojure `assoc-in` or Lodash `_.set`.

```json
{
  "operation": "json:assoc",
  "input": {
    "target": { "user": { "name": "alice" } },
    "path": ["user", "email"],
    "value": "alice@example.com"
  }
}
```

**Result:** `{ "user": { "name": "alice", "email": "alice@example.com" } }`

The `path` can be a single string (top-level key) or an array of strings (nested path). Missing intermediate maps are created automatically.

### json:select — Pick by Discriminator

Looks up a value in a map of cases by a discriminator key. Like a switch statement.

```json
{
  "operation": "json:select",
  "input": {
    "key": "manager",
    "cases": {
      "auto": { "decision": "APPROVED" },
      "manager": { "decision": "ESCALATED", "target": "J. Martinez" },
      "vp": { "decision": "ESCALATED", "target": "VP Finance" }
    }
  }
}
```

**Result:** `{ "decision": "ESCALATED", "target": "J. Martinez" }`

Returns `default` if the key is not found, or `null` if no default is provided.

## Operations Reference

| Operation | Input | Description |
|-----------|-------|-------------|
| `json:merge` | `values` (array of maps) | RFC 7396 deep merge |
| `json:cond` | `cases` (array of `{when, then}`), `default?` | First truthy case |
| `json:assoc` | `target?`, `path`, `value` | Set value at nested path |
| `json:select` | `key`, `cases` (map), `default?` | Switch on discriminator |

## Use Cases

- **Pipeline composition** — `merge` combines outputs from multiple steps into a single result
- **Declarative routing** — `cond` and `select` branch without LLM calls, keeping orchestrations fast and deterministic
- **Data enrichment** — `assoc` adds fields to records before passing them downstream

## Related

- [Orchestrator](./orchestrator) — workflow coordination using these primitives
- [Agents](/docs/user-guide/agents/) — agents can call JSON operations as tools
