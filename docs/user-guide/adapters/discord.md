---
id: discord
title: Discord Adapter
sidebar_label: Discord
---

# Discord Adapter

Discord is where a lot of teams and communities already talk. The Discord adapter puts a venue in the room: a bot that answers DMs and replies when it is mentioned in a channel, backed by a durable per-channel session with an agent — or by an operation, if what you want is a governed webhook rather than a conversation.

It is the same shape as the [Telegram adapter](./telegram), and deliberately so: bots, one inbound handler each, fail-closed allow-lists, and outbound ops gated on the bot's owner.

Discord is an optional [venue module](./jvm#venue-modules) (`ai.covia:covia-discord`), shipped as a module jar and loaded by config or at runtime. Its JDA runtime is shaded and isolated from the venue classpath.

:::note
The Discord module ships in 0.9.4. It is available now on the development channel — see [Choosing a channel](../../operator-guide/venue-start).
:::

## Operations

| Operation | Purpose |
|-----------|---------|
| `discord:send` | Send a message through one of the venue's bots |
| `discord:call` | Call any Discord REST API v10 route |
| `discord:create` | Create a bot that acts as you |
| `discord:delete` | Stop and delete one of your own bots |
| `discord:bots` | List your bots and their state (tokens are never returned) |

## Bots

A bot is a Discord bot token plus a routing target, running as a Covia `user`, with exactly one inbound handler — `agent` (a durable `agent:chat` session per channel) or `operation` (the message record handed to that operation, with `reply` governing what goes back).

```json
{
  "adapters": {
    "discord": {
      "bots": {
        "community": {
          "token": "s/DISCORD_BOT_TOKEN",
          "user": "did:web:venue.example:u:alice",
          "agent": "Alice",
          "allow": ["123456789012345678"],
          "mentionOnly": true,
          "greeting": "Mention me and I'll help."
        }
      }
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `token` | Bot token, normally an `s/NAME` [secret reference](./secret) |
| `user` | DID the bot acts as, or `"public"` |
| `agent` / `operation` | The inbound handler — exactly one |
| `reply` | Operation handlers: `true`, `false`, or fixed text |
| `allow` | Discord user ids permitted to talk to the bot |
| `open` | `true` lets anyone talk to it (default `false`) |
| `mentionOnly` | Only respond in a guild channel when the bot is mentioned. **Default `true`** — set `false` only for a channel the bot is meant to read wholesale |
| `greeting` | Opening reply |

**What reaches a handler:** direct messages always, and guild messages only when they mention the bot — because `mentionOnly` defaults to `true`. A guild channel is a shared space, so a bot that answered everything would be both a nuisance and a leak; mentions are the opt-in. Setting `mentionOnly: false` gives the bot every message in the channels it can see, which is occasionally what you want and never the safe default.

Access is fail-closed on top of that: only allow-listed Discord accounts are answered, unless the bot is `open`. An unauthorised DM gets a reply naming the sender’s Discord user id, so they can pass it to whoever administers the allow-list.

Users create their own bots with `discord:create` (token must be an `s/NAME` reference), persisted in the venue-private adapter workspace and re-armed at boot; `discord:delete` removes the bot and its channel sessions.

## Sending

```json
{
  "operation": "v/ops/discord/send",
  "input": {
    "channel_id": "987654321098765432",
    "content": "Build 0.9.3 is green.",
    "reply_to": "987654321098765433"
  }
}
```

`bot` is optional when you own exactly one. Content over Discord's 2000-character limit is split. `embeds`, `components`, `allowed_mentions` and `suppress_embeds` pass through to Discord.

Anything else is a REST call:

```json
{
  "operation": "v/ops/discord/call",
  "input": { "method": "GET", "route": "/channels/987654321098765432/messages?limit=10" }
}
```

`route` is relative to API v10. Gateway and OAuth routes are refused — the venue's own Gateway connection owns them. Rate-limited calls are retried.

## What an agent sees

As with Telegram, an agent receives `{text, via}`:

```json
{
  "text": "@bot what changed in the last release?",
  "via": {
    "from": { "id": "123456789012345678", "username": "sam" },
    "chat": { "id": "987654321098765432", "type": "GUILD_TEXT", "name": "general" },
    "guild": { "id": "111222333444555666", "name": "Covia" },
    "access": "allow"
  }
}
```

`via` is placed by the venue; message text proves nothing. A Discord identity grants no Covia authority. The module ships a `discord` agent skill and an agent template.

## Capabilities

| Ability | Resource | Grants |
|---------|----------|--------|
| `discord/send` | `<bot user>/discord/<bot>` | Send messages through that bot |
| `discord/call` | `<bot user>/discord/<bot>` | Any REST route — a superset of `send` |
| `discord/manage` | `<owner>/discord/<name>` | Create or delete your own bots |

## Related

- [Telegram Adapter](./telegram) — the same model for Telegram
- [Secrets](./secret) — where bot tokens live
- [Agents](../agents/) — what a bot routes to
