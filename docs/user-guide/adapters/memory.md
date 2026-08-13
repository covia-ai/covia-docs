---
title: User Memory
sidebar_label: User Memory
---

# User Memory Adapter

Nobody should have to repeat their preferences to every agent, every session. The memory adapter gives every user (and every agent acting for them) a durable, editable memory that agents carry into each turn, with a deliberately tiny surface: one operation, `v/ops/memory`, dispatched by a `command` field (`recall`, `remember`, `update`, `forget`). One tool definition instead of four keeps the cost in an agent's tool palette minimal.

Memory lives as a plain vector at a workspace path (default `w/memory`) in the calling user's namespace: queryable, governed lattice state like everything else, not a private database. Storage delegates to [`covia:read`/`covia:write`](./venue-adapter), so per-user scoping and capability enforcement are inherited rather than reimplemented.

## Operations

### memory remember: Append an Item

```json
{
  "operation": "v/ops/memory",
  "input": { "command": "remember", "text": "Prefers metric units" }
}
```

Returns `{remembered: true, n, count}`; `n` is the new item's number.

### memory recall: Render the List

Returns the memory as a numbered text block (`1. …`), or `null` when empty. Agents rarely call this directly: list it in `config.context` and the memory is injected into the agent's context every turn, freshly rendered.

```json
{
  "operation": "v/ops/memory",
  "input": { "command": "recall" }
}
```

`recall` can also point at a map of records (e.g. a slug-keyed store): entries render sorted, `displayField` picks the line text (default `"text"`), `noteField` appends a note. Entries marked inactive, held, or merged are skipped.

### memory update / forget: Edit by Number

```json
{ "operation": "v/ops/memory", "input": { "command": "update", "n": 2, "text": "Prefers SI units" } }
```

```json
{ "operation": "v/ops/memory", "input": { "command": "forget", "n": 2 } }
```

`n` is the 1-based number as shown by `recall`: the number the agent sees is the number it edits. Both refuse to operate on anything that is not a flat list, so a structured store can never be clobbered by a stray edit.

## Input Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `command` | `recall` \| `remember` \| `update` \| `forget` | required | |
| `text` | string | `remember`, `update` | the item text |
| `n` | integer | `update`, `forget` | 1-based item number |
| `path` | string | optional | memory list path, default `w/memory` |
| `displayField`, `noteField` | string | optional | `recall` over map collections |

## Access Control and Durability

Authentication is required: memory is always some user's memory. Items are stored as `{text, ts}` (with `updated` stamped on edits), and every mutation rewrites the whole vector, so a forgotten item is durably gone; it cannot re-materialise through a partial merge.

## Related

- [Context in Covia](/docs/overview/context): the context layer this feeds
- [Tools and Context](../agents/tools-and-context): `config.context` injection
- [Covia (Venue) Adapter](./venue-adapter): the underlying workspace CRUD
