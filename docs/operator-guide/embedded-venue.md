---
title: Embedded Venue
sidebar_position: 6
---

# Embedded, Loopback, Self-Authenticated Venue

This is the deployment shape for a venue **embedded inside a desktop or
single-user application**: launched as a subprocess, reachable only on
localhost, and serving exactly one owner. It's the shape behind the GetMine
desktop app and applies to any app that bundles a venue for one user.

The goal is a venue that is **private to its host machine and its owner**: no
anonymous access, not reachable off-box, and no browser on some other origin
able to reach in. The app authenticates itself as its owner and the venue's job
is simply to *verify and enforce*.

## The security model: no token minting

An embedded venue does **not** hand out per-launch tokens. Instead the embedding
app holds its own Ed25519 key pair and **self-signs a bearer JWT**, which the
venue verifies with no shared secret and no prior registration:

- The app generates a key pair once and derives its `did:key` from the public key.
- For each session it signs a JWT whose `sub` claim is that `did:key` and whose
  `kid` header carries the same public key. The venue's
  [self-issued JWT verification](./auth#self-issued-eddsa-jwts) checks that the
  `kid` and `sub` agree (proving the signer owns the DID) and enforces the
  token's expiry and audience.
- The token's `aud` claim must name **this venue's DID** (read it from
  `/.well-known/did.json`). A token minted for another venue cannot be replayed
  here.

Every request then authenticates as the app owner's DID; there is no shared
`public` identity to fall back to.

## The recipe

Four settings turn a default venue into this shape:

```json5
{
  "bindAddress": "127.0.0.1",
  "allowPrivateNetwork": false,

  "auth": {
    "public": { "enabled": false }
  },
  "users": { "autoCreate": true }
}
```

| Setting | Value | What it does |
|---------|-------|--------------|
| `bindAddress` | `127.0.0.1` | Binds the HTTP listener to loopback only, so the venue is unreachable from the LAN. (If omitted, a venue binds to all interfaces.) |
| `allowPrivateNetwork` | `false` | Suppresses the `Access-Control-Allow-Private-Network` header, so a public web origin **cannot** reach the venue on localhost from the browser. This is a real override: on a loopback bind the default is `true`. |
| `auth.public.enabled` | `false` | Removes the anonymous/shared `public` identity. Every request must carry a valid bearer token; an unauthenticated request gets `401`. |
| `users.autoCreate` | `true` | Admits the owner's `did:key` on first authenticated request: a fresh venue has never seen it, and [admission](./auth#admission-authentication-is-not-membership) would otherwise return `403`. Acceptable here precisely because only loopback token-holders can reach the venue at all; for a stricter posture, provision the owner DID explicitly at startup via `user:create` with venue authority instead. |

With these in place, the only way to reach the venue is a process on the same
machine presenting a bearer token the venue accepts, i.e. the owner app.
(Rate limiting, incidentally, defaults **off** on a loopback bind.)

:::note bindAddress vs hostname
`bindAddress` is the socket the listener binds to (restrict it to loopback).
It is distinct from `hostname`, the venue's *advertised* public host used to
derive `baseUrl` and the DID. An embedded venue typically sets no public
`hostname`, so its identity stays its `did:key`.
:::

## Secrets belong to the owner, not to `public`

An embedded venue's secrets (LLM API keys, provider credentials) are
bootstrapped under the **owner's DID**, not the `public` identity. Config
pre-populates the per-user encrypted secret stores at startup, keyed by DID:

```json5
{
  "secrets": {
    "did:key:z6MkOwnerAppKey...": {
      "ANTHROPIC_API_KEY": "sk-ant-...",
      "OPENAI_API_KEY": "sk-..."
    }
  }
}
```

Top-level keys resolve as follows: `"venue"` → the venue's own DID, `"public"` →
the `<venueDID>:public` identity, and anything else verbatim as a literal DID. Because the
app authenticates as its owner DID, secret references (`s/ANTHROPIC_API_KEY`)
resolve under that identity at invocation time. Nothing lands under `public`, so
there is no shared credential surface.

:::caution
Never commit production secrets to a checked-in config. Keep the embedded
venue's config (with its bootstrap secrets) in a per-user, non-tracked location
the app manages.
:::

## Putting it together

A complete embedded-venue config:

```json5
{
  "venues": [ {
    "name": "GetMine Local Venue",
    "port": 8080,
    "bindAddress": "127.0.0.1",
    "allowPrivateNetwork": false,

    "store": "/Users/alice/Library/Application Support/GetMine/venue.etch",
    "seed": "…ed25519 hex seed for a stable venue identity…",

    "auth": {
      "public": { "enabled": false }
    },
    "users": { "autoCreate": true },

    "secrets": {
      "did:key:z6MkOwnerAppKey...": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  } ]
}
```

This venue:

- listens on loopback only, unreachable off-box;
- rejects browser Private-Network reach-in;
- requires a bearer token for every request: no anonymous access;
- accepts the owner app's self-signed JWT (audienced to this venue's DID) and admits it on first use;
- resolves the owner's secrets under their DID.

An embedded venue holding personal data should also **encrypt its store**. Java embedders can go one better than a config key: supply the Etch key via a key function (a KMS, OS keychain, or user passphrase) and hand the venue an already-opened store, so no key material ever touches config or disk; see [Security](./security#encrypt-the-store).

The app's responsibilities, in turn:

1. Generate an Ed25519 key pair once and persist it.
2. Derive its `did:key` and read the venue's DID from `/.well-known/did.json`.
3. Sign a bearer JWT per session (`sub` = its `did:key`, `kid` = its public key,
   `aud` = the venue's DID, with an expiry) and send it as
   `Authorization: Bearer <jwt>`.
4. Bootstrap its secrets under its own DID (via the config above, or `secret:set`
   as the authenticated owner).

## See also

- [Configuration Reference](./configuration): every venue config key and its default.
- [Authentication](./auth): the auth primitives this recipe composes:
  [self-issued JWTs](./auth#self-issued-eddsa-jwts) and
  [public access](./auth#public-access).
- [Persistence](./persistence): the `store` and `seed` settings for a stable
  venue identity across restarts.
