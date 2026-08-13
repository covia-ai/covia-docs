---
title: Configuration Reference
sidebar_position: 2
---

# Configuration Reference

A venue is configured from a single JSON5 file passed on launch:

```bash
java -jar covia.jar config.json
```

This page is the exhaustive list of configuration keys, grouped by concern, with
defaults. The topic guides ([Venue Quick Start](./venue-start),
[Authentication](./auth), [Security](./security), [Persistence](./persistence),
and [Embedded Venue](./embedded-venue)) carry the narrative and worked
examples; this page is the index of *what keys exist and what they default to*.

## The config file is a server document

The root of the file is a **server document**, not a venue: it holds a
`venues` array (required, non-empty), and each entry is one venue. One JVM can
host several venues; the [federation tutorial](../user-guide/tutorials/federation)
runs two from one file.

```json5
{
  "strictConfig": true,          // optional: reject unknown fields (inherited by venues)
  "venues": [
    { "name": "My Venue", "port": 8080, "store": "/data/venue.etch" }
  ]
}
```

Validation is fail-closed for known fields: a malformed value is a startup
error, never a silently substituted default. Unknown fields warn and are
ignored, or are rejected outright under `strictConfig: true`.

All keys below are venue-entry keys unless noted, dotted paths showing nesting
(e.g. `auth.public.enabled`).

## Identity & network

| Key | Default | Description |
|-----|---------|-------------|
| `name` | *(none)* | Human-readable venue name, surfaced in status. |
| `port` | `8080` | HTTP listen port. |
| `bindAddress` | all interfaces (`0.0.0.0`) | Network interface the HTTP connector binds to. Set `127.0.0.1` to restrict the venue to loopback; see [Embedded Venue](./embedded-venue). A loopback bind also flips the defaults for `rateLimit` (off) and `allowPrivateNetwork` (on). Distinct from `hostname`. |
| `hostname` | *(none)* | The venue's *advertised* public host, used to derive `baseUrl` and a `did:web` alias in the DID document. Leave unset for a loopback/embedded venue (identity stays `did:key`). |
| `baseUrl` | derived from `hostname`/`port` | Explicit external base URL (e.g. behind a reverse proxy). |
| `did` | *(none)* | Operator-declared venue identity, validated **fail-closed**: a `did:web` must match the public `hostname`; a `did:key` must match the venue key pair (wrong seed → refuses to start). See [Security](./security#pin-the-venue-identity). |
| `seed` | auto-generated | Ed25519 hex seed for a stable venue identity. If omitted with a persistent `store`, one is generated and saved to `venue.key` (owner-only permissions) beside the store. |
| `keystore` | *(none)* | Venue identity from a PKCS12 keystore (Convex CLI format): `{path, alias, storepass, keypass}`, with `CONVEX_KEYSTORE`/`CONVEX_KEYSTORE_PASSWORD` env fallbacks. Any keystore failure is fatal, never a silent fallback to a generated key. |
| `rootPage` | venue status page | Replace the public `/` page: `{"redirect": "https://…"}` or `{"file": "path/to/index.html"}`. |

## Persistence & storage

See [Persistence](./persistence) for the durability model and [Security](./security#encrypt-the-store) for encryption.

| Key | Default | Description |
|-----|---------|-------------|
| `store` | `"temp"` | Etch store location: `"temp"` (deleted on exit), `"memory"`, or a file path (survives restarts). |
| `etch` | *(none)* | Encrypted Etch v3 store policy: `{version: 3, cipher: "aes-256-ctr" \| "chacha20", encryptIndex, key: {env} \| {file} \| hex}`. Fail-closed: any misconfiguration is a startup error, never an unencrypted store. |
| `storage` | `lattice` | Content storage backend: `lattice`, `memory`, `file`, or `dlfs`. Object form uses **`storage.content`** plus backend options like `storage.path`. With `"file"`, asset content bytes live **outside** the (possibly encrypted) Etch store as plaintext files; the venue warns about this combination. |
| `maxContentSize` | `104857600` (100 MB) | Maximum asset content size in bytes. |

## Authentication & access control

See [Authentication](./auth) for OAuth setup, token types, and admission.

| Key | Default | Description |
|-----|---------|-------------|
| `auth.public.enabled` | `true` | Allow unauthenticated (anonymous) access. `false` requires a bearer token on every request. |
| `auth.public.caps` | secure read-only | Capability ceiling applied to unauthenticated callers (read-only, no `invoke`). `"unrestricted"` removes the ceiling (loopback throwaway venues only); an explicit capability vector sets a custom ceiling. |
| `auth.tokenExpiry` | `86400` (24 h) | Expiry, in seconds, of venue-issued JWTs (after OAuth login). |
| `auth.oauth.<provider>` | *(none)* | OAuth login providers (`google`, `microsoft`, `github`), each with `clientId` / `clientSecret`. |
| `auth.acceptedAudiences` | venue DID(s) | Additional JWT `aud` values the venue accepts, beyond its own published DID. |
| `auth.audience` | `verify` | Audience policy: `verify` (tolerate an absent `aud` during migration) or `require` (reject tokens with no `aud`). |
| `users.autoCreate` | `false` | Automatically admit previously unknown authenticated DIDs. Off, an unknown DID gets `403` with a registration message; see [Admission](./auth#admission-authentication-is-not-membership). Keep off for private and production venues. |
| `users.bootstrap` | *(none)* | Provision named venue users and their public `did:key` authenticator keys before HTTP starts. First-use only: once a user has authenticator history, later startups never add or revoke keys. |
| `corsOrigins` | `*` | Allowed browser origins: a single origin, an array, the `"loopback"` sentinel (literal localhost forms, never resolves DNS), or `false`/`"none"`/`[]` to disable. Denied origins get `403`; invalid config fails startup rather than silently widening. |
| `allowPrivateNetwork` | follows bind | Emit `Access-Control-Allow-Private-Network`. Defaults **on for a loopback bind, off otherwise**; an explicit value wins either way. |
| `rateLimit` | on for non-loopback binds | Per-caller token bucket: `{enabled, rps: 100, burst: 300, maxConcurrentJobsPerUser: 100, blockMs: 3000}`. Buckets are keyed per user DID (anonymous traffic shares one); over-limit requests get `429` + `Retry-After`. |

## Protocols & features

| Key | Default | Description |
|-----|---------|-------------|
| `mcp` | off unless present | Model Context Protocol endpoint config: `enabled`, `includeAdapters`, `includePathPrefixes`, `serverInfo`, and `servers` (bridge external MCP servers into the catalog). |
| `mcp.auth.required` | inverse of `auth.public.enabled` | MCP authentication. A non-empty `mcp.auth.allowedDids` implies required; an explicit `false` cannot re-open MCP when venue-wide public access is off. |
| `a2a` | off unless present | Agent-to-Agent protocol config (`a2a.defaultChatOp`, `a2a.agentInfo`). Endpoints register only when this block is present. |
| `webdav.enabled` | `false` | Mount DLFS over WebDAV at `/dlfs/`. |
| `file.roots` | ephemeral `tmp` root | Named filesystem roots for the [File adapter](../user-guide/adapters/file). Forms: a path string, `{path, readOnly}`, `{dlfs, subpath, readOnly}` (a DLFS drive clamped to a subtree), or `{temp: true, prefix}`. With no roots configured the adapter creates a single ephemeral `tmp` root, deleted on exit. |
| `modules` | *(none)* | External adapter jars loaded at boot: a path string or `{path, sha256, config}`. `sha256` pins jar content; loading is fail-fast and operator-only; there is deliberately no runtime module-load operation. See [venue modules](../user-guide/adapters/jvm#venue-modules). |
| `recordReadOnlyOperations` | `false` | Record even declared-read-only `/api/v1/run` operations as durable jobs. |
| `enablePrivateJobs` | *(deprecated)* | No longer enables `private: true` on `/invoke`; invoke always creates a durable job. Read-only result-oriented execution goes through `/api/v1/run`. |
| `defaultTransitionOp` | `v/ops/llmagent/chat` | Default agent transition operation when an agent config omits `operation`. |
| `defaultLlmOperation` | `v/ops/langchain/openai` | Default level-3 LLM operation for agents. |
| `maxToolIterations` | `30` | Venue-wide cap on agent tool-loop iterations per turn; agents can override per config. |
| `strictAssets` | `true` | Broken or missing adapter operation resources **fail startup**: a venue booting with silently missing ops is broken. `false` is test scaffolding only. |
| `strictConfig` | `false` | Reject unknown config fields at startup instead of warning. Also valid at the server-document root, inherited by every venue entry. |
| `fixMcpStrings` | `true` | Coerce non-string MCP tool arguments where a schema expects a string. |
| `outputValidation` | `"off"` | Validate operation outputs against their declared output schema: `"off"`, `"warn"`, or `"strict"`. |

## Adapter settings

Per-adapter settings live under `adapters.<name>`:

| Key | Default | Description |
|-----|---------|-------------|
| `adapters.agent.sessionDelete` | `true` | Allow agent session deletion. |
| `adapters.vault.drive` | `"vault"` | Backing DLFS drive name for the [Vault adapter](../user-guide/adapters/vault). The venue warns at startup if the adapter is active without an encrypted Etch policy. |
| `adapters.hitl.maxGrantLifetimeSecs` | none | Ceiling on the lifetime of [HITL](../user-guide/adapters/hitl)-minted capability grants; offers exceeding it are rejected before the human ever sees them. |
| `adapters.orchestrator.maxItems` / `maxConcurrency` | `50` / `8` | Bounds on orchestrator `foreach` fan-out. |
| `adapters.langchain.ollamaUrl` | *(none)* | Local Ollama endpoint for the LangChain adapter. |
| `adapters.sql.databases.<name>` | *(none)* | *(SQL module)* Operator-registered JDBC connections: `{url, user, password}`, with `s/NAME` secret references for passwords. `adapters.sql.path` makes venue-local databases persistent. See [SQL adapter](../user-guide/adapters/sql). |

## Secrets bootstrap

Pre-populate the per-user encrypted secret stores at startup, keyed by DID.
Top-level keys resolve as: `"venue"` → the venue's own DID, `"public"` → the
`<venueDID>:public` identity, anything else verbatim as a literal DID.

```json5
{
  "secrets": {
    "venue":  { "OPENAI_API_KEY": "sk-..." },
    "public": { "ANTHROPIC_API_KEY": "sk-ant-..." },
    "did:key:z6MkOwner...": { "FOO": "bar" }
  }
}
```

Each named secret overwrites any existing value under that name for that user at
launch; names not listed are left untouched, and a per-secret failure warns
without failing startup. **Never commit production secrets**; keep configs with
bootstrap secrets in a per-user, non-tracked location.

## Advanced / tuning

Rarely needed; sensible defaults apply.

| Key | Description |
|-----|-------------|
| `acceptQueueSize` | Connector accept-queue backlog (default `1024`). |
| `httpSelectors` / `httpAcceptors` | Explicit Jetty selector/acceptor thread counts. Handlers run on virtual threads, so selectors only pump non-blocking I/O; override only when co-locating many venues in one JVM. |

## Minimal examples

**Local development** (ephemeral, anonymous):

```json5
{ "venues": [ { "port": 8080, "store": "temp" } ] }
```

**Embedded, single-owner** (loopback, authenticated); see [Embedded Venue](./embedded-venue):

```json5
{
  "venues": [ {
    "port": 8080,
    "bindAddress": "127.0.0.1",
    "allowPrivateNetwork": false,
    "store": "/path/to/venue.etch",
    "auth": { "public": { "enabled": false } },
    "users": { "autoCreate": true }
  } ]
}
```

**Production** (internet-facing, authenticated, OAuth, encrypted store); see [Authentication](./auth#example-configuration) and [Security](./security):

```json5
{
  "strictConfig": true,
  "venues": [ {
    "hostname": "venue.example.com",
    "baseUrl": "https://venue.example.com",
    "store": "/data/venue.etch",
    "etch": {
      "version": 3,
      "cipher": "aes-256-ctr",
      "key": { "env": "COVIA_ETCH_KEY" }
    },
    "auth": {
      "public": { "enabled": false },
      "tokenExpiry": 3600,
      "oauth": { "google": { "clientId": "…", "clientSecret": "…" } }
    }
  } ]
}
```
