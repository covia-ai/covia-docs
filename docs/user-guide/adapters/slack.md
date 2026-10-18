---
title: Slack
sidebar_label: Slack
description: Slack bots that answer DMs and allowed channel mentions through Events API webhooks or Socket Mode. Signed inbound, capability-gated send.
---

# Slack Adapter

The `slack` adapter connects workspace-installed Slack apps to Covia agents or operations. Each binding handles DMs and explicitly-admitted channel mentions by itself; `slack:send` posts plain text to allowed channels and threads for anything else. Inbound events arrive either as HTTP callbacks to the Events API (signed, verifiable) or over Socket Mode (an outbound WebSocket, no public URL required), and the binding chooses between the two by whether `signingSecret` or `appToken` is configured.

## Operations

| Operation | Purpose |
|-----------|---------|
| `slack:send` | Post plain text to an allowed channel or DM. `thread_ts` preserves the thread |
| `slack:bots` | List the caller's bindings, state, webhook path or Socket Mode `connection`, and receipt counts |
| `slack:create` | Register a durable caller-owned binding (requires `slack/manage`) |
| `slack:delete` | Deregister a caller-owned binding |

```json
{
  "operation": "v/ops/slack/send",
  "input": {
    "bot": "my-support-bot",
    "channel": "C0123456789",
    "text": "Deployment finished.",
    "thread_ts": "1735020000.000100"
  }
}
```

Returns the Slack API response. Text goes out exactly as written up to 4000 characters: Markdown, `<@U…>` mentions and `<url|text>` links appear literally, so write plain text and bare URLs. `channel` must match one the binding admits; a refusal citing the destination is the binding's `allowChannels` list at work. A failed send may still have been delivered, so do not retry it automatically.

## Events API vs. Socket Mode

Slack delivers the same events over two transports. Pick one per binding:

| Transport | How events arrive | Credential |
|-----------|-------------------|------------|
| Events API | HTTP POST to `/webhooks/slack/c-<name>` on the venue, signed with HMAC | `signingSecret: "s/NAME"` |
| Socket Mode | Outbound WebSocket from the venue to Slack | `appToken: "s/NAME"` with the `connections:write` scope |

Socket Mode is the right choice when the venue runs on a laptop or behind NAT and cannot expose a public URL. A silent Socket Mode connection is replaced after two missed ping intervals (`keepaliveMillis`). Both transports admit the same event payloads; the binding's downstream behaviour is identical.

## Admission is fail-closed

Every inbound event is HMAC-verified (or arrived over an authenticated socket), matched against the binding's `appId` and `teamId`, and tested against its `allowChannels` and allow list before being admitted. DMs arrive as `message.im`, channel mentions as `app_mention`. A thread reply in a channel the binding already holds continues the conversation without a fresh mention, as long as `message.channels` is subscribed. Edits, deletes, bot messages and self-echoes never start conversations.

The agent receives `{text, via}` where `via.from` is the sender's Slack user ID, `via.chat` is the channel ID, `via.thread` the thread timestamp, `via.message_id` the message's own timestamp, `via.team` the workspace and `via.access` is `allow` or `open`. The venue supplies `via`: it names a Slack account, not a Covia principal, and grants no venue authority.

## Reading Slack is a different skill

Reading Slack (history, user names, search) is not this adapter. It is the `slack` entry in the [connections catalogue](./connections), which calls the Slack Web API with the caller's own `s/SLACK_BOT_TOKEN` and needs matching app scopes. This adapter owns inbound events and outbound sends; the connection owns Web API queries.

## Access Control

Sending is gated by `slack/send` on `<owner>/slack/<binding>`; creating or deleting a binding by `slack/manage`. The binding owner and their agents hold these within scope; anyone else needs a delegation. See [UCAN](./ucan).

## Related

- [Connections Adapter](./connections): the `slack` provider that calls the Web API for reads
- [Secret Adapter](./secret): where the bot token, signing secret and app token live
- [UCAN Adapter](./ucan): capability gates on send and manage
- [Discord Adapter](./discord): the sibling messaging adapter for Discord bots
