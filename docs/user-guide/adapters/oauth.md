---
title: OAuth
sidebar_label: OAuth
description: Hold OAuth 2.0 grants on behalf of venue users so agents can call provider APIs as the user. Not login — connections are per-user, per-provider authorisations.
---

# OAuth Adapter

An agent that needs to send a user's email, read their calendar, or push a file to their drive has one honest option: hold a user-granted OAuth 2.0 token, scoped to exactly what the user agreed to, and never let the raw token enter the model's context. The `oauth` adapter runs that flow — three operations (`connect`, `status`, `disconnect`) that mint PKCE-protected authorisation URLs, store the resulting grant in the user's encrypted secret store, and refresh access tokens transparently when the `http:*` adapter later calls the provider's API.

**This is not login.** Login OAuth (`/auth/{provider}`) proves who a caller is and mints a venue bearer. A **connection** is a grant to act on a user's data at a third-party provider — Gmail, Microsoft Graph, GitHub, anything that speaks OAuth 2.0 — obtained under the caller's venue identity and stored for later use.

## Operations

| Operation | Purpose |
|-----------|---------|
| `oauth:connect` | Start a connection flow — returns an authorisation URL to hand to the user |
| `oauth:status` | List existing connections for the caller (no tokens, just metadata) |
| `oauth:disconnect` | Revoke at the provider and forget the stored grant |

```json
{
  "operation": "v/ops/oauth/connect",
  "input": {
    "provider": "google",
    "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
    "returnTo": "/w/post-connect"
  }
}
```

Returns `{provider: "google", url: "https://accounts.google.com/o/oauth2/v2/auth?…", state: "…", expiresAt: 1735…, scopes: [...]}`. **Hand the URL to the user** (a `hitl` ask is the natural way); never open it yourself. Nothing is connected until the user approves in a browser and the provider redirects back to `/auth/connect/{provider}/callback`.

## How a connection becomes a usable API call

Once the user has approved and the grant is stored, calling the provider's API is a plain `http:*` invocation with a `bearerSecret` reference:

```json
{
  "operation": "v/ops/http/get",
  "input": {
    "url": "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    "bearerSecret": "oauth/google"
  }
}
```

The adapter resolves `oauth/google` to a fresh access token through the OAuth adapter's `TokenSource`, refreshing when the stored token is close to expiry. The token itself never enters the request context, the job record, or anything the model reads. The agent sees the response body; nothing else.

## Provider configuration

Providers are operator configuration (`adapters.oauth.providers` in venue config): a client ID, an `s/NAME` reference to the client secret (omit for a public PKCE client), endpoints — pre-filled for the `google`, `microsoft`, and `github` presets — default scopes, and any extra authorisation parameters. Provider endpoints are trusted configuration, so they're not subject to the HTTP adapter's SSRF guard.

To see which providers are configured on a venue:

```json
{
  "operation": "v/ops/info",
  "input": { "path": "adapters/oauth" }
}
```

## PKCE + state

Every `oauth:connect` call mints a one-time `state` and a PKCE verifier bound to the caller's DID. The callback at `/auth/connect/{provider}/callback` requires both the state (round-tripped by the provider) and the stored verifier before exchanging the code for tokens. A connection attempt that doesn't complete within 10 minutes lapses and must be re-started.

## Access Control

Only the caller can start, see, or revoke their own connections. Stored grants live under `s/oauth/<provider>` in the caller's encrypted secret store, subject to the same UCAN checks as any other secret. A grant is specific to the venue identity that created it — a different user on the same venue has their own, independent grant per provider.

## Related

- [HTTP Adapter](./http-adapter) — resolves `bearerSecret: "oauth/<provider>"` to a live access token
- [Secret Adapter](./secret) — the encrypted store that holds the grant
- [Auth Adapter](./auth) — the separate venue-login OAuth flow (`/auth/{provider}`)
- [UCAN Adapter](./ucan) — capability model that gates access to each grant
