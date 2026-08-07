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
defaults. The topic guides — [Venue Quick Start](./venue-start),
[Persistence](./persistence), [Authentication](./auth), and
[Embedded Venue](./embedded-venue) — carry the narrative and worked examples;
this page is the index of *what keys exist and what they default to*.

All keys are top-level unless shown with a dotted path (e.g. `auth.public.enabled`).

## Identity & network

| Key | Default | Description |
|-----|---------|-------------|
| `name` | — | Human-readable venue name, surfaced in status. |
| `port` | `8080` | HTTP listen port. |
| `bindAddress` | all interfaces (`0.0.0.0`) | Network interface the HTTP connector binds to. Set `127.0.0.1` to restrict the venue to loopback — see [Embedded Venue](./embedded-venue). Distinct from `hostname`. |
| `hostname` | — | The venue's *advertised* public host, used to derive `baseUrl` and a `did:web` alias in the DID document. Leave unset for a loopback/embedded venue (identity stays `did:key`). |
| `baseUrl` | derived from `hostname`/`port` | Explicit external base URL (e.g. behind a reverse proxy). |

## Persistence & storage

See [Persistence](./persistence) for the full model.

| Key | Default | Description |
|-----|---------|-------------|
| `store` | `"temp"` | Etch store location: `"temp"` (deleted on exit), `"memory"`, or a file path (survives restarts). |
| `seed` | auto-generated | Ed25519 hex seed for a stable venue identity. If omitted with a persistent `store`, one is generated and saved to `venue.key` beside the store. |
| `storage` | `lattice` | Content storage backend: `lattice`, `memory`, `file`, or `dlfs`. As an object, `storage.type` plus backend options like `storage.path`. |
| `maxContentSize` | `104857600` (100 MB) | Maximum asset content size in bytes. |

## Authentication & access control

See [Authentication](./auth) for OAuth setup, token types, and the access model.

| Key | Default | Description |
|-----|---------|-------------|
| `auth.public.enabled` | `true` | Allow unauthenticated (anonymous) access. `false` requires a bearer token on every request. |
| `auth.public.caps` | secure read-only | Capability ceiling applied to unauthenticated callers. `"unrestricted"` removes the ceiling (use only on a loopback throwaway venue); an explicit capability vector sets a custom ceiling. |
| `auth.tokenExpiry` | `86400` (24 h) | Expiry, in seconds, of venue-issued JWTs (after OAuth login). |
| `auth.oauth.<provider>` | — | OAuth login providers (`google`, `microsoft`, `github`), each with `clientId` / `clientSecret`. |
| `auth.acceptedAudiences` | venue DID(s) | Additional JWT `aud` values the venue accepts, beyond its own published DID. |
| `auth.audience` | `verify` | Audience policy: `verify` (tolerate an absent `aud` during migration) or `require` (reject tokens with no `aud`). |
| `corsOrigins` | `*` | Allowed CORS origins for browser clients. Restrict for production. |
| `allowPrivateNetwork` | `false` | Emit `Access-Control-Allow-Private-Network` so a public web origin can reach a loopback venue from the browser. Leave `false` unless a specific dev workflow needs it. |

## Protocols & features

| Key | Default | Description |
|-----|---------|-------------|
| `mcp` | off unless present | Model Context Protocol endpoint config. |
| `a2a` | off unless present | Agent-to-Agent protocol config (`a2a.defaultChatOp`, `a2a.agentInfo`). Endpoints register only when this block is present. |
| `webdav.enabled` | `false` | Mount DLFS over WebDAV at `/dlfs/`. |
| `adapters.<name>` | — | Per-adapter settings, keyed by adapter name (e.g. `adapters.agent.sessionDelete`, default `true`). |
| `file.roots` | — | Named filesystem roots for the [File adapter](../user-guide/adapters/file), e.g. `{"workspace": "/srv/agent-workspace", "data": {"path": "/srv/data", "readOnly": true}}`. Without roots the adapter refuses all access. |
| `enablePrivateJobs` | `false` | Accept `private: true` (memory-only) jobs. A private request against a venue without this fails. |
| `defaultTransitionOp` | `v/ops/llmagent/chat` | Default agent transition operation when an agent config omits `operation`. |
| `defaultLlmOperation` | `v/ops/langchain/openai` | Default level-3 LLM operation for agents. |
| `strictAssets` | `true` | Enforce strict asset-metadata validation on store. |
| `fixMcpStrings` | `true` | Coerce non-string MCP tool arguments where a schema expects a string. |
| `outputValidation` | provider default | Validate operation outputs against their declared output schema. |

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
launch; names not listed are left untouched. **Never commit production secrets** —
keep configs with bootstrap secrets in a per-user, non-tracked location.

## Advanced / tuning

Rarely needed; sensible defaults apply.

| Key | Description |
|-----|-------------|
| `acceptQueueSize` | Connector accept-queue backlog (default `1024`). |
| `httpSelectors` / `httpAcceptors` | Explicit Jetty selector/acceptor thread counts. Handlers run on virtual threads, so selectors only pump non-blocking I/O — override only when co-locating many venues in one JVM. |

## Minimal examples

**Local development** (ephemeral, anonymous):

```json5
{ "port": 8080, "store": "temp" }
```

**Embedded, single-owner** (loopback, authenticated) — see [Embedded Venue](./embedded-venue):

```json5
{
  "port": 8080,
  "bindAddress": "127.0.0.1",
  "allowPrivateNetwork": false,
  "store": "/path/to/venue.etch",
  "auth": { "public": { "enabled": false } }
}
```

**Production** (internet-facing, authenticated, OAuth) — see [Authentication](./auth#example-configuration):

```json5
{
  "hostname": "venue.example.com",
  "baseUrl": "https://venue.example.com",
  "store": "/data/venue.etch",
  "auth": {
    "public": { "enabled": false },
    "tokenExpiry": 3600,
    "oauth": { "google": { "clientId": "…", "clientSecret": "…" } }
  }
}
```
