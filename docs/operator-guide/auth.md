---
title: Authentication
sidebar_position: 3
---

# Authentication

Covia venues support flexible authentication and access control. By default, venues allow anonymous (public) access, which is suitable for development and testing. For production deployments, you can configure OAuth login providers and restrict access to authenticated users.

All authentication settings live under the `"auth"` key in your venue configuration.

## Public Access

The `auth.public` setting controls whether unauthenticated requests are allowed to API endpoints. When disabled, all API, MCP, and A2A requests require a valid bearer token.

```json5
"auth": {
  "public": { "enabled": true }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `auth.public.enabled` | `true` | Allow unauthenticated access to API endpoints |

When public access is disabled and a request arrives without a valid `Authorization: Bearer <token>` header, the venue returns `401 Authentication required`.

Even with public access enabled, authenticated users receive a caller identity that the venue can use for access control, audit logging, and user-specific state.

## Token Expiry

Venue-issued JWTs (returned after OAuth login) have a configurable expiry:

```json5
"auth": {
  "tokenExpiry": 86400
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `auth.tokenExpiry` | `86400` | JWT token expiry in seconds (default: 24 hours) |

## OAuth Providers

The venue supports OAuth 2.0 Authorization Code flow with three providers: Google, Microsoft, and GitHub. Each provider requires a `clientId` and `clientSecret` obtained from the provider's developer console.

### Configuration

OAuth providers are configured under `auth.oauth`:

```json5
"auth": {
  "oauth": {
    "google": {
      "clientId": "YOUR_GOOGLE_CLIENT_ID",
      "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
    },
    "microsoft": {
      "clientId": "YOUR_MS_CLIENT_ID",
      "clientSecret": "YOUR_MS_CLIENT_SECRET"
    },
    "github": {
      "clientId": "YOUR_GITHUB_CLIENT_ID",
      "clientSecret": "YOUR_GITHUB_CLIENT_SECRET"
    }
  }
}
```

You only need to configure the providers you want to support. Unconfigured providers are simply not available.

### Redirect URIs

Each provider requires a redirect URI to be registered in the provider's developer console. The venue automatically constructs these from the venue's base URL:

```
https://venue.example.com/auth/google/callback
https://venue.example.com/auth/microsoft/callback
https://venue.example.com/auth/github/callback
```

The base URL is derived from the venue's `hostname` and `port` configuration, or can be overridden with an explicit `baseUrl` setting at the venue level. For production deployments behind a reverse proxy, you should set `baseUrl` explicitly:

```json5
{
  "hostname": "0.0.0.0",
  "port": 8080,
  "baseUrl": "https://venue.example.com",
  "auth": {
    "oauth": { ... }
  }
}
```

### Login Flow

When OAuth providers are configured, the venue exposes:

| Endpoint | Description |
|----------|-------------|
| `/login` | Login page listing available providers |
| `/auth/{provider}` | Redirects to the provider's authorization page |
| `/auth/{provider}/callback` | Handles the OAuth callback and issues a venue JWT |

After a successful OAuth login, the venue:

1. Exchanges the authorization code for tokens from the provider
2. Extracts the user's identity (email, name, subject)
3. Creates or updates the user record in the venue's user database
4. Issues a venue-signed JWT containing the user's DID
5. Returns the JWT to the client

### Provider Details

#### Google

- Uses OpenID Connect with JWKS-based ID token verification
- Scopes: `openid`, `email`, `profile`
- User identity derived from email address

#### Microsoft

- Uses Microsoft Identity Platform (Azure AD)
- Scopes: `openid`, `email`, `profile`
- Supports multi-tenant configurations
- User identity derived from email address

#### GitHub

- Uses GitHub OAuth (not OpenID Connect)
- Scopes: `user:email`, `read:user`
- User information fetched from GitHub's API after token exchange
- User identity derived from email address

## Bearer Token Authentication

API requests are authenticated via `Authorization: Bearer <token>` headers. The venue's auth middleware supports three types of bearer tokens:

### Self-Issued EdDSA JWTs

Clients with their own Ed25519 key pair can create self-issued JWTs. The `sub` claim must be a `did:key` matching the signing key in the `kid` header. This allows agents and automated clients to authenticate without OAuth.

### Venue-Signed JWTs

JWTs signed by the venue's own key pair, typically issued after OAuth login. The `sub` claim contains the user's DID (e.g. `did:covia:venue:u:alice_gmail_com`).

### External Provider RS256 JWTs

RS256 JWTs from configured OAuth providers, verified against the provider's JWKS endpoint. This allows clients that already have a provider-issued token to authenticate directly.

## User Database

Authenticated users are stored in the venue's lattice-backed user database. User records are keyed by a sanitised user ID derived from the email address (e.g. `alice_gmail_com`) and contain:

| Field | Description |
|-------|-------------|
| `did` | The user's venue-scoped DID |
| `email` | Email address from the OAuth provider |
| `name` | Display name from the OAuth provider |
| `provider` | The OAuth provider used for login |
| `updated` | Timestamp of last update |

User records can be queried via the `/api/v1/users` API endpoint.

## Example Configuration

A complete auth configuration for a production venue:

```json5
{
  "name": "Production Venue",
  "hostname": "0.0.0.0",
  "port": 8080,
  "baseUrl": "https://venue.example.com",

  "auth": {
    "public": { "enabled": false },
    "tokenExpiry": 3600,
    "oauth": {
      "google": {
        "clientId": "123456789.apps.googleusercontent.com",
        "clientSecret": "GOCSPX-..."
      },
      "github": {
        "clientId": "Iv1.abc123",
        "clientSecret": "abc123def456..."
      }
    }
  }
}
```

This configuration:
- Requires authentication for all API access
- Issues tokens valid for 1 hour
- Supports Google and GitHub login
