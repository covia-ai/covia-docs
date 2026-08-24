---
title: Schema
sidebar_label: Schema
---

# Schema Adapter

Data that crosses boundaries — between workflow steps, between agents, between venues — needs checking, and LLM output doubly so. The schema adapter is that guard rail, exposing JSON Schema operations as grid tools: validate, infer, coerce, and check. All five are **pure JVM functions — no IO, no LLM, sub-millisecond** — cheap enough to guard every boundary and safe to call in tight orchestration loops.

## Operations

| Operation | Purpose |
|-----------|---------|
| `schema:validate` | Validate a value against a schema; reports the first violation |
| `schema:validateAll` | Validate and return **all** violations (`v/ops/schema/validate-all`) |
| `schema:infer` | Infer the tightest schema accepting an example value |
| `schema:coerce` | Coerce a value toward a schema (string→number, string→boolean, …) |
| `schema:check` | Check a schema is itself structurally well-formed |

```json
{
  "operation": "v/ops/schema/validate",
  "input": {
    "schema": { "type": "object", "properties": { "a": { "type": "number" } } },
    "value": { "a": 1 }
  }
}
```

Returns `{valid: true}` — or `{valid: false, error}` with the violation. `schema:infer` powers the site's canonical first example: give it `{"name": "Ada", "age": 36}` and it hands back the schema.

## Boundary discipline

Two rules make these operations trustworthy at trust boundaries:

- **Values are judged exactly as given.** A JSON-looking string (`"{\"a\":1}"`) is a string — it is never silently reparsed into the structure it resembles; `infer` on `"[1,2,3]"` yields `{"type": "string"}`.
- **LLM-friendly schema input.** The `schema` parameter tolerates a string-encoded JSON object (LLM callers often stringify); a malformed string is reported with its real parse cause rather than a generic error.

Only the baseline `invoke` capability is required; no state is touched.

## Related

- [Orchestrator](./orchestrator) — schema ops as workflow guards
- [JSON Adapter](./json) — pure data manipulation alongside validation
