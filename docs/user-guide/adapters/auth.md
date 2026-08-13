---
title: Auth
sidebar_label: Auth
---

# Auth Adapter

The auth adapter is a single diagnostic operation: `auth:whoami` returns the caller identity exactly as the venue's auth middleware resolved it. It answers the question every integration eventually asks (*who does the venue think I am?*) end to end, through the real request path.

```json
{
  "operation": "v/ops/auth/whoami",
  "input": {}
}
```

Returns:

```json
{
  "caller": "did:web:venue.example.com:u:alice",
  "authenticated": true,
  "internal": false
}
```

`caller` is the resolved DID; `internal` is true only when the caller *is* the venue itself (engine-side trust paths). The operation is deliberately callable anonymously: on a venue with public access enabled, anonymous requests resolve to the venue's public principal (a DID ending `:public`), and `whoami` shows you exactly that.

Use it to verify bearer tokens, UCAN presentation, and agent identity attribution before debugging anything else: if `whoami` says the wrong name, nothing downstream will behave.

## Related

- [Authentication](/docs/operator-guide/auth): configuring who can call the venue
- [Capabilities (UCAN)](../capabilities): what an identity may do
