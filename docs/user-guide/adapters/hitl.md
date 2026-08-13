---
title: Human-in-the-Loop (HITL)
sidebar_label: Human-in-the-Loop
---

# Human-in-the-Loop Adapter

Some decisions must stay human: paying an invoice, approving a deployment, granting an agent new authority. The HITL adapter makes those decisions part of the workflow rather than an interruption to it — automated work pauses for a human answer (approval, choice, free text, or a capability grant) inside the same audited job machinery as everything else. A workflow or agent calls `hitl:request`; the job parks as `INPUT_REQUIRED` and a durable request record lands in the target user's `h/` inbox. When the human responds, the job completes with their answers (or fails on rejection or expiry).

Three operations carry the whole protocol:

| Operation | Who calls it | Purpose |
|-----------|--------------|---------|
| `hitl:request` | workflows, agents | Ask a human; job parks until resolved |
| `hitl:respond` | the inbox owner | Answer or reject a request |
| `hitl:list` | the inbox owner | List your own requests |

## Asking — hitl:request

```json
{
  "operation": "v/ops/hitl/request",
  "input": {
    "title": "Pay invoice",
    "description": "Invoice INV-1 from Acme, £15,600.",
    "asks": [
      { "id": "pay", "type": "approval",
        "prompt": "Approve payment?", "required": true }
    ]
  }
}
```

Each entry in `asks` is a typed question: `text`, `approval` (boolean), `choice` (one option), `checkboxes` (several), or `token` (see below). `user` targets a responder DID — it defaults to the calling user, so an agent asks its **owner** with no extra setup; delivering into another user's inbox requires a `hitl/request` delegation from them. An optional `timeout` (seconds) expires the request; omit it and the request waits indefinitely.

The human sees only the request record — title, description, asks — never the requesting conversation.

## Answering — hitl:respond

```json
{
  "operation": "v/ops/hitl/respond",
  "input": {
    "id": "<request id>",
    "outcome": "answer",
    "answers": { "pay": true },
    "comment": "approved"
  }
}
```

Responding is authorised structurally — you can only resolve requests in your own inbox — and **agents can never answer**, only ask: an agent approving its own request would defeat the point, so the gate is identity, not capability scope. Rejections (`"outcome": "reject"`) fail the requester's job with the reject comment as the reason.

## Grants: consent that mints capability

Approval asks and choice options can carry offered **grants** (`{with, can}`). The venue issues exactly the intersection of what the responder explicitly echoes back and what their choices actually triggered — issued as a single venue-signed [UCAN](../capabilities) with the requester as audience. Grant lifetimes default to 7 days; a venue-configured ceiling validates offers *before* delivery, so a human is never asked to approve an expiry the venue would later refuse.

`token` asks go further: they request a **self-sovereign** UCAN that the human signs client-side with their own key — the venue verifies provenance but never mints or re-signs it, and the signed token is redacted from the durable record, delivered only in the requester's job output.

This is the machinery behind "pause a workflow for a capability grant" ([COG-16](../../protocol/cogs/COG-016)): consent is a first-class, auditable step, and authority is conferred only as the consequence of an explicit human choice.

## Reliability details

Requests survive restarts: parked jobs are recovered and expiry timers re-armed at venue launch, with a lazy check so an expired request can never be answered late. A resolved record is never overwritten — a race between expiry and response has exactly one winner. Discover pending work with `hitl:list` (`{"status": "open"}`); read a full record at `h/<id>` with `covia:read`.

## Related

- [COG-16: Human-in-the-Loop](../../protocol/cogs/COG-016) — the specification
- [Capabilities (UCAN)](../capabilities) — grants, attenuation, delegation
- [Agents](../agents/) — agents as requesters
