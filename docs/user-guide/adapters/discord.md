---
title: Discord
sidebar_label: Discord
description: Discord bots as a venue front door. DMs and mentions route to agents or operations; send and REST calls go out capability-gated.
---

# Discord Adapter

The `discord` adapter runs operator-declared Discord bots as a venue front door and gives an agent five operations for talking back. Inbound DMs and server mentions are routed to the bot's handler (an agent or an operation) under the authority of the bot's user. Outbound sends and REST calls go through the same bot, gated at each call by UCAN. A Discord identity names a chat account, not a Covia principal, and grants no venue authority.

## Operations

| Operation | Purpose |
|-----------|---------|
| `discord:send` | Send a Discord message as the bot. Content over 2000 characters is split |
| `discord:call` | Call any Discord REST API v10 route. Gateway and OAuth routes are refused |
| `discord:create` | Register a caller-owned bot. The token must be an `s/NAME` secret reference |
| `discord:delete` | Deregister a caller-owned bot |
| `discord:bots` | List the caller's bots and their state (tokens never returned) |

```json
{
  "operation": "v/ops/discord/send",
  "input": {
    "bot": "my-support-bot",
    "channel_id": "123456789012345678",
    "content": "Thanks, that's noted."
  }
}
```

Returns the Discord `Message` object. Omit `bot` when the caller owns exactly one. Set `reply_to` to thread the reply to a message; set `suppress_embeds: true` to disable link previews; pass `allowed_mentions` deliberately, because Discord markdown can trigger mentions.

## Bot tokens are secret references

A Discord bot token is never a literal string in configuration. Operators declare bots under `adapters.discord.bots.<name>` with `token: "s/NAME"` resolving to a secret in the user's store; `discord:create` performs the same registration at runtime for a user with `discord/manage`. The adapter resolves the reference inside its own execution scope, so the raw token never appears in the request context, the job record, or anything the model can read. See [Secret](./secret) for how the reference is stored.

## Inbound message routing

A bot's inbound handler is one agent or one operation. DMs are handled unconditionally; a server message is handled only when the bot is explicitly mentioned, or (for an agent handler) when the message is a reply in a conversation the bot already holds. Allow lists restrict which Discord users the bot answers; an `open` bot answers anyone.

The agent receives `{text, via}` where `via.from` is the Discord-authenticated sender, `via.chat` is the channel, `via.guild` the server when applicable, and `via.access` is `allow` or `open`. The venue places this metadata; the text itself does not prove identity.

A reply to an inbound message is posted back to the channel it came from, as a reply to that message. In a server channel everyone can read it, so write for that audience and keep anything meant only for the owner out of it. A DM is private to that person.

## REST calls

`discord:call {bot?, method, route, body?}` is an escape hatch for Bot API routes beyond plain sends: reactions, pins, role management, channel configuration. Gateway and OAuth routes are refused. The adapter forwards the body as-is and returns Discord's response. The gate is `discord/call` on `<bot user>/discord/<bot>`.

## Access Control

Sending is gated by `discord/send`, API calls by `discord/call`, and bot registration by `discord/manage`, all on the bot's resource (`<owner>/discord/<bot>`) or the venue registry. The bot's user and their agents hold these abilities within scope; anyone else needs a delegation. See [UCAN](./ucan).

## Related

- [Secret Adapter](./secret): where bot tokens live before resolution
- [UCAN Adapter](./ucan): capability gates for send, call and manage
- [Slack Adapter](./slack): the sibling messaging adapter for Slack-authorised bots
- [Connections Adapter](./connections): how `discord` is also surfaced as a provider in the connections catalogue
