---
title: WhatsApp
sidebar_label: WhatsApp
description: WhatsApp Cloud API bindings for text and media. Capability-gated sends, protected inbound media, and the 24-hour customer-service window.
---

# WhatsApp Adapter

The `whatsapp` adapter connects a WhatsApp Cloud API business phone number to a venue agent or operation. Inbound text and media arrive at a signed webhook, are matched against the binding's business account and phone-number IDs, and admitted through the binding's allow list. Outbound `whatsapp:send` posts plain text within WhatsApp's 24-hour customer-service window; `whatsapp:download` saves a received media file to a DLFS destination. Templates and OAuth onboarding are out of scope for this module.

## Operations

| Operation | Purpose |
|-----------|---------|
| `whatsapp:send` | Send a text to an admitted phone-number ID (up to 4096 characters) |
| `whatsapp:download` | Save a received image, audio, video, document or sticker to a DLFS destination |
| `whatsapp:create` | Register a caller-owned binding. All credentials must be `s/NAME` secret references |
| `whatsapp:delete` | Deregister a caller-owned binding |
| `whatsapp:bots` | List the caller's bindings, state and webhook paths (tokens never returned) |

```json
{
  "operation": "v/ops/whatsapp/send",
  "input": {
    "bot": "my-support-binding",
    "to": "441234567890",
    "text": "Thanks, that's noted."
  }
}
```

Returns the Meta send response. `to` is the recipient's numeric WhatsApp ID (no leading `+`). The binding's allow list determines who it may address; an `open: true` binding may send to any admitted sender. A failed send may still have been delivered, so do not retry it automatically.

## The customer-service window

WhatsApp enforces a 24-hour customer-service window: free-form text may answer a message this long after it. Outside that window, outbound messaging requires an approved template, which this module does not send. The adapter reports `WhatsApp text reply window has expired` and the caller must either reach the recipient through another approved client, or wait for the person to write in again. The window is Meta's rule, not the adapter's.

## Inbound signing and admission

Every POST to `/webhooks/whatsapp/c-<binding>` is HMAC-verified with the Meta app secret (`X-Hub-Signature-256`), matched against the binding's `businessAccountId` and `phoneNumberId`, and admitted through the allow list. GET challenges answer the `hub.verify_token` stored at `verifyToken`. Messages older than 24 hours or dated more than five minutes in the future are ignored. Each admitted message in a batch becomes one durable receipt, keyed by WhatsApp message ID.

The agent receives `{text, via, attachments?, content?}`. `via.from` is the sender's WhatsApp ID; `via.access` is `allow` or `open`. A WhatsApp identity names a phone, not a Covia principal, and grants no venue authority.

## Media routing

Image, audio, video, document and sticker messages arrive as attachments carrying `kind`, `mediaType`, `voice: true` for voice notes, and a protected `ref` to the stored file; `text` becomes the caption (empty for a bare voice note). A configured `mediaOperation` may add transcribed or extracted text to an attachment's `result`; images also arrive as image blocks. Without a transcription in an attachment, do not claim to have listened to audio.

`whatsapp:download {bot?, media_id, destination?, fileName?}` fetches the raw media id out of a message object and saves it under the caller's write authority. The gate is `whatsapp/download` on `<owner>/whatsapp/<binding>`; `whatsapp/send` does not grant it.

## Access Control

Sending is gated by `whatsapp/send` on `<owner>/whatsapp/<binding>`, downloads by `whatsapp/download`, and binding management by `whatsapp/manage`. The binding owner and their agents (within scope) hold these; anyone else needs a delegation. See [UCAN](./ucan).

## Related

- [Secret Adapter](./secret): where the token, app secret and verify token live before resolution
- [DLFS Adapter](./dlfs): the storage layer `whatsapp:download` writes to
- [UCAN Adapter](./ucan): capability gates on send, download and manage
- [Telegram Adapter](./telegram): the sibling messaging adapter for Telegram bots
