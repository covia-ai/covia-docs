---
title: Security
sidebar_position: 4
---

# Security

Your venue holds things worth protecting: users' workspaces and files, agents and their memory, API keys, and an audit trail people will rely on. Covia's security posture is built on two principles: **secure defaults** (anonymous callers get a read-only ceiling, unknown identities get nothing, agents cannot mint authority) and **fail-closed configuration** (a security misconfiguration stops the venue at startup; it never silently downgrades to an unprotected state).

This page tours the controls in the order an attacker would meet them, and ends with a production checklist. Config snippets show venue-entry keys; in a real config file they sit inside an entry of the top-level `venues` array (see [Configuration](./configuration#the-config-file-is-a-server-document)).

## Encrypt the store

A venue's Etch store contains everything: lattice state, agent records, DLFS drives, secrets. If a disk, VM image, or backup walks away, encryption at rest is what makes that a non-event. Venues run on **encrypted Etch v3 stores**:

```json
{
  "store": "/data/venue.etch",
  "etch": {
    "version": 3,
    "cipher": "aes-256-ctr",
    "encryptIndex": true,
    "key": { "env": "COVIA_ETCH_KEY" }
  }
}
```

- **Ciphers**: `aes-256-ctr` or `chacha20` (encryption requires `version: 3`).
- **Key sourcing**: exactly one of `{"env": "VAR"}`, `{"file": "path"}`, or an inline hex string (dev/test only; never commit key material). The key must resolve to exactly 32 bytes of hex or the venue refuses to start.
- **Key identity hints**: the store is stamped with an identity derived from its key, and the venue verifies it before opening. Start with the wrong key and you get a one-line diagnosis naming the key the store actually needs, never a garbage-decrypt or a mysteriously empty venue.
- **Fail-closed, everywhere**: an unset environment variable, an unreadable key file, a wrong-sized key, a cipher with no key source: all are startup errors. There is no code path from "operator asked for encryption" to "data landed on disk unencrypted".

Two caveats the venue itself warns about: with `storage.content: "file"`, asset content bytes live *outside* the encrypted store as plaintext files; and an auto-generated plaintext `venue.key` sitting beside an encrypted store means disk theft still yields your venue identity; prefer `seed` or a `keystore` and remove the key file.

Embedded deployments can go further: the embedding application supplies a **key function** (backed by a KMS, HSM, or user passphrase) and hands the venue an already-opened store, so key material never touches config, environment, or disk. See [Embedded Venue](./embedded-venue).

Secrets get a second, independent layer: the per-user secret store encrypts every value with AES-256-GCM under a key bound to the venue's identity, so with an Etch cipher enabled your users' API keys are encrypted twice.

## Pin the venue identity

The venue's key pair is the root of every UCAN it signs, every session it issues, and every federation trust decision, so identity is pinned rather than assumed. Declare it with the `did` config key:

- A declared `did:key` must **match the venue key pair**: a venue started with the wrong seed or keystore refuses to run rather than impersonate.
- A declared `did:web` must match the configured public `hostname`, and did:web callers verify at every ingress with HTTPS-only, public-hostname-only resolution.
- An existing store opened with a key that owns none of its state is a **startup error naming the store's real owner**: a wrong key can never silently create a fresh empty venue and orphan your data.
- The auto-generated `venue.key` file is written with owner-only (`0600`) permissions, repaired on every launch. For production, prefer an explicit `seed` or a PKCS12 `keystore`.

One consequence to plan around: user secrets are encrypted under a key derived from the venue seed, so **rotating the seed orphans existing encrypted secrets**; treat the identity seed and the store key as separate secrets, rotated deliberately.

## Control the network surface

The defaults suit development: bind on all interfaces, permissive CORS. A venue holding real data should tighten each one, and the venue helps, by failing at startup on invalid values rather than silently widening.

- **`bindAddress`**: set `"127.0.0.1"` for anything local or embedded; the loopback bind also flips rate limiting and Private Network Access to matching defaults.
- **TLS**: the venue deliberately does not terminate TLS; run it behind a reverse proxy (the repo's `deploy/` directory ships a working Caddy setup with automatic HTTPS) and set `baseUrl` explicitly.
- **`corsOrigins`**: narrow `"*"` to your real origins. The `"loopback"` sentinel matches literal localhost forms without ever resolving DNS, which blocks DNS-rebinding tricks; denied origins get a clean 403.
- **Rate limiting**: per-caller token buckets, on by default for any non-loopback bind: `{"rateLimit": {"rps": 100, "burst": 300, "maxConcurrentJobsPerUser": 100}}`. Buckets are keyed per user DID (all anonymous traffic shares one bucket), over-limit requests get `429` with `Retry-After`, and a concurrent-jobs cap stops one caller from monopolising the job engine.
- **SSRF protection**: outbound HTTP, bridged MCP servers, and A2A URLs all pass the same guard: loopback, site-local, and link-local addresses are blocked, HTTP(S) only.

## Decide who gets in

Authentication proves control of a DID; it does not make someone a member of your venue. **Admission is a separate, deliberate step**:

- An unknown authenticated DID gets a `403` with an actionable registration message, before any state is created for it. `users.autoCreate` defaults to `false`; leave it that way on private and production venues.
- Admit users explicitly: `users.bootstrap` in config (named users and their public keys, provisioned before HTTP starts), or at runtime via `user:create`, as the venue itself, or by a provisioner holding a venue-issued UCAN delegation for exactly that ability. No separate admin API to secure; the capability check *is* the admission control.
- Anonymous access, when enabled, is bounded by the **public capability ceiling**: read-only, no `invoke`, unless you explicitly widen it. `"unrestricted"` exists for loopback throwaway venues only.
- MCP inherits the same posture: `mcp.auth.required` defaults to the inverse of public access, and an explicit `false` cannot re-open MCP on a venue that requires authentication elsewhere.

## Extend without widening

Everything that adds code or capability to a venue is operator-gated:

- **Venue modules** load only from config, at boot, with optional `sha256` content pinning, and there is deliberately no runtime module-load operation, because in-process code is total compromise.
- **The Python adapter is not a sandbox**: configured scripts run with the venue's full authority. The operator selects every script and allowlists every callable; callers can never submit source. Use containers for untrusted code.
- **`strictConfig`** rejects unknown config fields at startup (typo-proofing your security settings); known fields are always validated fatally either way. **`strictAssets`** (default on) refuses to boot a venue whose operations failed to install.

## Production checklist

- [ ] `store` is a file path, with `etch.cipher` set and the key sourced from `env` or `file`
- [ ] Venue identity from `seed` or `keystore`, with no plaintext `venue.key` beside an encrypted store
- [ ] `did` declared, pinning the identity fail-closed
- [ ] TLS terminated by a reverse proxy; `baseUrl` set explicitly
- [ ] `corsOrigins` narrowed from `"*"`; `bindAddress` restricted where applicable
- [ ] Rate limiting left on (or tuned); `maxContentSize` appropriate
- [ ] `auth.public.caps` reviewed; `users.autoCreate` off; admission via bootstrap or delegated `user:create`
- [ ] Secrets supplied as bootstrap config or `s/NAME` references; never in operation inputs, never committed
- [ ] Modules pinned with `sha256`; Python scripts treated as trusted code
- [ ] Startup log reviewed: the venue warns on exactly the gaps above (unencrypted vault data, plaintext key files, content stored outside the cipher)

Found a vulnerability? Report it privately via [GitHub private vulnerability reporting](https://github.com/covia-ai/covia/security) or security@covia.ai, and remember the trust model: the security of a federation depends on the policies its operators configure.

## Related

- [Configuration Reference](./configuration): every key used above
- [Authentication](./auth): OAuth, token types, the access model
- [Persistence](./persistence): the store the cipher protects
- [Embedded Venue](./embedded-venue): the loopback, key-function deployment shape
