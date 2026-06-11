---
title: Capabilities (UCAN)
sidebar_position: 5
---

# Capabilities

Covia uses **capabilities** to decide what an authenticated caller — a user, an agent, or another venue — is allowed to do. A capability is a signed grant that says "this holder may perform *this ability* on *this resource*". Covia's model follows [UCAN](https://github.com/ucan-wg/spec) (User-Controlled Authorization Networks): capabilities are carried as signed tokens, can be **attenuated** (narrowed) when delegated, and are checked at the point of use.

Authentication answers *who you are* (see the [operator auth guide](../operator-guide/auth)); capabilities answer *what you may do*.

## The shape of a capability

A capability is a `{with, can}` pair:

- **`with`** — the resource, as a path or URI: a lattice path like `o/shared/` or `w/reports/`, or a typed resource such as `file://workspace/` or `dlfs://notes/`.
- **`can`** — the ability: `crud/read`, `crud/write`, `crud/delete`, or `*` for all.

```json
{ "with": "o/shared/", "can": "crud/read" }
```

A grant **covers** a request when its resource is a prefix of the target and its ability includes the required one. Reads require `crud/read`, writes/appends/mkdir require `crud/write`, deletes require `crud/delete`.

## Two ways capabilities are applied

### 1. Agent caps

An agent's config can carry a `caps` array. Once set, **every** operation the agent attempts is checked against it — the agent cannot exceed its grant, even via tool calls:

```json
"caps": [
  { "with": "w/vendor-records/", "can": "crud/read" },
  { "with": "w/enrichments/",    "can": "crud" },
  { "with": "file://workspace/", "can": "crud/write" }
]
```

The agent's capabilities are disclosed in its system prompt so the model knows its limits up front. A denied call returns a **structural** error — it names the required ability and resource and lists what the agent holds, and signals that retrying won't help — so the agent adapts instead of looping. (An agent with no `caps` is unrestricted within its owner's namespace.)

### 2. UCAN tokens on a request

A caller can present a UCAN as a bearer token. The venue verifies it at ingress and treats the proven capabilities as authority for that request:

```
Authorization: Bearer <ucan-jwt>
```

This works on both the REST API and the MCP endpoint. The token's issuer (`iss`) is taken as the caller DID, and the token is stashed as a capability proof for the operation. Requests may also carry proofs explicitly via the `ucans` field of the invoke envelope.

This is what enables **cross-user access**: if Alice issues Bob a UCAN granting `{with: "o/shared/", can: "crud/read"}`, Bob can present it to read under Alice's `o/shared/` namespace — access he wouldn't otherwise have. The venue trusts the verified proof, not Bob's bare identity.

## Issuing a UCAN

The `ucan:issue` operation mints a venue-signed UCAN delegating capabilities to an audience:

```json
{
  "operation": "ucan:issue",
  "input": {
    "aud": "did:key:z6MkBob...",
    "att": [
      { "with": "o/shared/", "can": "crud/read" }
    ],
    "exp": 1767225600
  }
}
```

| Field | Meaning |
|-------|---------|
| `aud` | Audience DID — who receives the capability |
| `att` | Attenuations — the `{with, can}` grants being delegated |
| `exp` | Expiry, in unix seconds |

The result is a JWT the audience presents as a bearer token. Because UCANs attenuate, the audience can in turn delegate a *narrower* subset onward, but never more than it holds.

## Capability-gated adapters

Capability checks apply across the venue. In particular, the [`file:`](./adapters/file) and [`dlfs:`](./adapters/dlfs) adapters are gated on typed resources (`file://<root>/<path>`, `dlfs://<drive>/<path>`), so a grant can scope filesystem access down to a single root or path.

## Related

- [Operator: Authentication](../operator-guide/auth) — how callers are identified
- [Creating Agents](./agents/creating-agents) — setting an agent's `caps`
- [File Adapter](./adapters/file) — capability-gated filesystem access
- [COG-013: Agent Capabilities](../protocol/cogs/COG-013) — the protocol specification
