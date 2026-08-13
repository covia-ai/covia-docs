---
id: secret
title: Secrets
---

# Secret Adapter

The Secret adapter manages the venue's **per-user encrypted secret store**: the home for API keys and other credentials that operations need at run time but that must never appear in job records, agent context, or operation input.

The core idea: you store a secret once, then **reference it by name** (`s/NAME`) wherever an operation accepts a secret reference. The venue resolves the reference at invocation time, on the caller's behalf, and the plaintext value never travels through the Grid.

## Storing a secret

```json
{
  "operation": "v/ops/secret/set",
  "input": { "name": "OPENAI_API_KEY", "value": "sk-..." }
}
```

Returns `{ "name": "OPENAI_API_KEY", "stored": true }`. The value is encrypted into the caller's own store, and because the operation declares `value` as a secret field, it is **redacted in the job record**: the write itself leaves no plaintext in durable history.

Storing requires an authenticated caller holding the `secret/write` ability on `s/<name>`. Authenticated users hold this by default; the anonymous [public capability ceiling](../../protocol/cogs/COG-010) does not, so unauthenticated callers cannot write secrets.

## Referencing secrets: `s/NAME`

Operations that need a credential accept a **secret reference** instead of a plaintext value, resolved from the *caller's* store at invocation time:

- The [HTTP adapter](./http-adapter)'s `bearerSecret`: the venue sends `Authorization: Bearer <resolved value>` without the token appearing in input or job records.
- The [LangChain backends](./langchain-adapter) resolve provider keys (`s/OPENAI_API_KEY`, `s/ANTHROPIC_API_KEY`, …) the same way; a missing key fails fast, naming the reference it looked for.
- [Bridged MCP servers](../mcp/calling-mcp-tools#authentication-for-bridged-servers) resolve their `auth` secret per caller.

Because resolution is per-DID, two users invoking the same operation use their own keys; a venue never shares one credential across callers.

## Operations Reference

| Operation | Catalog path | Input | Description |
|-----------|--------------|-------|-------------|
| `secret:set` | `v/ops/secret/set` | `name`, `value` | Store an encrypted secret in the caller's store |
| `secret:extract` | `v/ops/secret/extract` | `name` | Read a secret's plaintext back. **Currently denied for all callers** pending capability-gated extraction. Pass an `s/<name>` reference instead |

The refusal of `extract` is deliberate: day-to-day use never needs plaintext back out, and keeping extraction closed until UCAN-gated grants land means a compromised agent cannot exfiltrate its owner's keys.

## REST and SDK access

The store is also exposed directly over [REST](../api/#secrets), where `GET /api/v1/secrets` lists the caller's secret **names** (values are never returned) and `PUT /api/v1/secrets/{name}` stores one, and through the SDK secret managers (`venue.secrets.set/list/delete`).

## Related Documentation

- [HTTP Adapter](./http-adapter) - `bearerSecret` for authenticated HTTP calls
- [LangChain Adapter](./langchain-adapter) - provider API keys
- [Capabilities](../capabilities) - the authorisation model behind `secret/write`
- [REST API § Secrets](../api/#secrets) - the HTTP surface
