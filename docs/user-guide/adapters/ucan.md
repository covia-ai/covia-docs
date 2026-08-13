---
title: UCAN
sidebar_label: UCAN
---

# UCAN Adapter

Collaboration across users, agents, and organisations only works when authority itself can be handed over, narrowed, and checked — not implied by shared infrastructure. The UCAN adapter is the venue's capability desk for exactly that: `ucan:issue` mints venue-signed capability tokens, and `ucan:verify` explains — rather than merely enforces — whether a token would be honoured. Together with the [capability model](../capabilities) they make authority a first-class, inspectable artifact.

## ucan:issue — Mint a Grant

```json
{
  "operation": "v/ops/ucan/issue",
  "input": {
    "aud": "did:key:z6MkBob...",
    "att": [{ "with": "w/projects/", "can": "crud/read" }],
    "exp": 1786550400
  }
}
```

Returns `{token}` — a signed UCAN JWT granting the audience the listed capabilities. Bare paths canonicalise to the **caller's** namespace before signing, so the token in the wild always carries the absolute resource. Omitting `exp` mints a genuinely non-expiring token; a finite expiry must be in the future.

Issuance is a governed surface, with rules worth knowing:

- **The venue signs only for what it controls** — its own resources and its managed custodial users. Self-sovereign users issue with their own key via the SDK; the venue never impersonates them.
- **Agents cannot issue at all.** An agent acts *within* its owner's namespace but does not speak *for* it — it requests grants from a human through [HITL](./hitl) instead. Consent, not self-service.
- **Delegating beyond your own namespace requires a granting right** (`grant/<can>` on the resource, per [COG-17](../../protocol/cogs/COG-017)) — and the minted authority can never outlive the right that enabled it.

Proofs travel in the transport channel (request `ucans` array or `Authorization` header), never in operation input — input is persisted in job records; secrets and proofs are not.

## ucan:verify — Explain a Token

Enforcement only ever says "Access denied"; `verify` says **why**. Give it a token (plus optionally `with`/`can` to ask "would this authorise that request here?") and it returns the verdict with the working: issuer, audience, expiry, delegation `chainDepth`, and per-capability `rootAuthority` — `owner` (self-sovereign chain), `venue` (rooted in this venue's grant), or `refused`. It runs the **same gate as enforcement**, so its answer is the enforcer's answer.

```json
{
  "operation": "v/ops/ucan/verify",
  "input": { "token": "eyJhbGciOi...", "with": "w/projects/x", "can": "crud/read" }
}
```

## Related

- [Capabilities (UCAN)](../capabilities) — the model: attenuation, delegation, enforcement
- [Human-in-the-Loop](./hitl) — grants minted by human consent
- [COG-17](../../protocol/cogs/COG-017) · [COG-15](../../protocol/cogs/COG-015) — granting rights and the proof channel
