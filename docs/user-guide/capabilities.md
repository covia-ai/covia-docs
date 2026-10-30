---
title: Capabilities (UCAN)
sidebar_position: 5
---

# Capabilities

Covia uses **capabilities** to decide what an authenticated caller — a user, an agent, or another venue — is allowed to do. A capability is a signed grant that says "this holder may perform *this ability* on *this resource*". Covia's model follows [UCAN](https://github.com/ucan-wg/spec) (User-Controlled Authorization Networks): capabilities are carried as signed tokens, can be **attenuated** (narrowed) when delegated, and are checked at the point of use.

Authentication answers *who you are* (see the [operator auth guide](../operator-guide/auth)); capabilities answer *what you may do*.

## The shape of a capability

A capability is a `{with, can}` pair:

- **`with`** — the resource, as a path or URI: a lattice path like `o/shared/`, `w/reports/`, or `dlfs/notes/` (DLFS drives are a DID-scoped namespace alongside `w/`; the legacy `dlfs://notes/` scheme form is still accepted for your *own* drives), or a typed resource such as `file://workspace/`.
- **`can`** — the ability, a hierarchical path. The common family is `crud/read`, `crud/write`, `crud/delete` (with the umbrella `crud` covering all three); further families govern specific surfaces — e.g. `agent/create`, `asset/read`, `mcp/manage` (managing bridged MCP servers), `grant/…` (issuing grants) — and `*` covers everything.

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

Verification checks the **root of the delegation chain**: a grant over Alice's resources must be rooted by Alice herself (an owner-signed, *self-sovereign* grant — verifiable by **any** venue, which is what makes capabilities work across venue boundaries) or by the venue that hosts the data (venue-issued grants, e.g. from `ucan:issue`). A chain can pass through intermediaries (Alice → Bob → Carol) as long as each hop only narrows the grant; an escalating hop is refused.

## Issuing a UCAN

The `ucan:issue` operation mints a venue-signed UCAN delegating capabilities to an audience:

```json
{
  "operation": "v/ops/ucan/issue",
  "input": {
    "aud": "did:key:z6MkBob...",
    "att": [
      { "with": "o/shared/", "can": "crud/read" }
    ],
    "exp": 2000000000
  }
}
```

| Field | Meaning |
|-------|---------|
| `aud` | Audience DID — who receives the capability |
| `att` | Attenuations — the `{with, can}` grants being delegated |
| `exp` | Expiry, in unix seconds |

The result is a JWT the audience presents as a bearer token. Because UCANs attenuate, the audience can in turn delegate a *narrower* subset onward, but never more than it holds.

A resource owner with their own `did:key` keypair can equally sign grants over their own namespace **directly** — no venue involvement. Such self-sovereign grants verify on any venue that holds the data.

## Ability reference

`crud/read`, `crud/write`, `crud/delete` (with the umbrella `crud`) and `invoke` are the generic abilities. On top of those, Covia defines domain families for the surfaces that need more than CRUD:

| Ability | Guards |
|---------|--------|
| `asset/read` | Reading asset metadata and content by hash |
| `asset/store` | Storing and pinning assets |
| `secret/write` | Writing a secret (`s/<name>`) |
| `agent/create` | Creating agents |
| `agent/request` | Sending a tracked task to an agent |
| `agent/message` | Sending a one-way message to an agent |
| `agent/write` | Updating, suspending, resuming, deleting an agent |
| `hitl/request` | Raising a [human-in-the-loop](./adapters/hitl) request |
| `mcp/manage` | Managing bridged [MCP](./mcp/) servers — guarded on `v/mcp` |
| `adapter/manage` | Adapter and module lifecycle — guarded on `<venue DID>/adapters`, and **venue-owned**: an ordinary authenticated caller cannot hold it over their own namespace |
| `user/create`, `user/read` | Administrative [user](./adapters/user) registration and lookup |
| `user/authentication-manage` | Managing a user's authenticator keys |
| `grant/…` | Issuing grants over a resource — the right to *delegate*, which access alone never implies |

Optional [venue modules](./adapters/jvm#venue-modules) add their own, scoped to the thing they govern rather than to the venue:

| Ability | Resource | Module |
|---------|----------|--------|
| `sql/…` | A registered database | [SQL](./adapters/sql) |
| `telegram/send`, `telegram/call`, `telegram/manage` | `<owner>/telegram/<bot>` | [Telegram](./adapters/telegram) |
| `discord/send`, `discord/call`, `discord/manage` | `<owner>/discord/<bot>` | [Discord](./adapters/discord) |
| `claudecode/run` | `<owner>/claudecode/<project>` | [Claude Code](./adapters/claudecode) |
| `claudecode/manage` | `<venueDID>/claudecode/projects` | [Claude Code](./adapters/claudecode) |

Abilities are **hierarchical paths**, so a grant of `agent` covers `agent/create` and its siblings, and `*` covers everything. Because an adapter's abilities disappear with the adapter, a grant naming one is inert on a venue where that module isn't loaded.

## Capability-gated adapters

Capability checks apply across the venue. In particular, the [`file:`](./adapters/file) adapter is gated on typed resources (`file://<root>/<path>`) and the [`dlfs:`](./adapters/dlfs) adapter on DID-scoped drive paths (`dlfs/<drive>/<path>`, owner-prefixed for cross-user access: `did:key:zAlice.../dlfs/<drive>/<path>`), so a grant can scope filesystem access down to a single root, drive, or path.

## Related

- [Operator: Authentication](../operator-guide/auth) — how callers are identified
- [Creating Agents](./agents/creating-agents) — setting an agent's `caps`
- [File Adapter](./adapters/file) — capability-gated filesystem access
- [COG-013: Agent Capabilities](../protocol/cogs/COG-013) — the protocol specification
