---
title: Users
sidebar_label: Users
---

# User Adapter

A sovereign venue decides exactly who it serves — membership is a deliberate trust decision, not a side effect. The user adapter manages that decision: who is registered, and which keys may authenticate as them. Registration is an **explicit administrative act** — successfully authenticating never registers anyone.

## Operations

| Operation | Purpose | Who may call |
|-----------|---------|--------------|
| `user:create` | Register a user DID at the venue | venue admin |
| `user:info` | Registration info for a DID | self, or admin for others |
| `user:list` | List registered users | venue admin |
| `user:authentication-add` | Add a public `did:key` authenticator | the named user, or admin |
| `user:authentication-revoke` | Revoke an authenticator (audit tombstone kept) | the named user, or admin |
| `user:authentication-list` | List active and revoked authenticators | self, or admin |

"Admin" is precise here: administrative ops require the **venue's own authority** — the venue DID acting directly, or a venue-rooted delegation of the relevant ability (`user/create`, `user/read`, `user/authentication-manage`) on the venue's `users` resource. An ordinary registered user, however broad their grant scope, cannot administer users.

## Two kinds of user

```json
{
  "operation": "v/ops/user/create",
  "input": { "username": "alice" }
}
```

Returns `{did: "did:web:venue.example.com:u:alice", registered: true, created: true}` — idempotent on repeat.

- **Venue-managed named users**: `username` derives a `did:web:<venue>:u:<name>` identity under the venue's namespace. These are the users whose authenticator keys the venue manages (`authentication-add`/`-revoke`), with rotation and revocation history preserved.
- **Self-sovereign DIDs**: pass any valid `did` (a `did:key`, an external `did:web`) instead. Registering it grants venue access but **never transfers control** — the venue's root authority stops strictly at identities it minted itself.

Agent sub-principal DIDs are refused outright: registering one would hand its bearer the owner's whole namespace. Named users can also be bootstrapped from venue config for repeatable deployments.

## Related

- [Authentication](/docs/operator-guide/auth) — how registered users authenticate
- [Capabilities (UCAN)](../capabilities) — venue-rooted delegation
