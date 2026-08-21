---
id: telegram
title: Telegram Adapter
sidebar_label: Telegram
---

# Telegram Adapter

Most people who need an agent don't want to open a console to reach it. The Telegram adapter turns a venue into something they can simply message: an operator (or a user) registers a bot, points it at an agent, and every Telegram chat with that bot becomes a durable conversation with that agent. Pointed at an operation instead, the same bot becomes a webhook with an audit trail — every inbound update is a Job in the bot user's job index.

Telegram is an optional [venue module](./jvm#venue-modules) (`ai.covia:covia-telegram`), shipped as a module jar alongside each release and loaded by config or at runtime.

## Operations

| Operation | Purpose |
|-----------|---------|
| `telegram:send` | Send a text message through one of the venue's bots |
| `telegram:call` | Call any Telegram Bot API method — media, edits, keyboards, reactions |
| `telegram:create` | Create a bot that acts as you, and start it |
| `telegram:delete` | Stop and remove one of your own bots |
| `telegram:bots` | Status of the bots you may use (tokens are never returned) |

## Bots

A **bot** is a Telegram bot token plus a routing target. It runs as a Covia `user` — the identity everything it does is attributed to — and has exactly one **inbound handler**:

- **`agent`** — every Telegram chat gets its own `agent:chat` session with that agent, persisted so conversations survive a restart.
- **`operation`** — every Telegram `Update` is handed to that operation verbatim (snake_case, `message`/`callback_query` nested as Telegram nests them) plus `bot`. What gets sent back is governed by `reply`: `true` sends the result (the default), `false` is silent, and a string is a fixed acknowledgement.

Exactly one of `agent` or `operation` — one message, one handler. An operation handler that needs to hand off to an agent, log somewhere, or write to SQL does so itself; the module never reshapes messages.

Operators declare bots under `adapters.telegram.bots.<name>`:

```json
{
  "adapters": {
    "telegram": {
      "bots": {
        "support": {
          "token": "s/TELEGRAM_SUPPORT_TOKEN",
          "user": "did:web:venue.example:u:alice",
          "agent": "Alice",
          "allow": [123456789, "@someone"],
          "parseMode": "Markdown",
          "greeting": "Hi — ask me anything about your account."
        }
      }
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `token` | BotFather token, normally an `s/NAME` [secret reference](./secret) |
| `user` | DID the bot acts as (the owner of the agent it routes to), or `"public"` |
| `agent` / `operation` | The inbound handler — exactly one |
| `reply` | Operation handlers: `true` (send the result), `false` (silent), or fixed text |
| `allow` | Telegram user ids and/or `@usernames` permitted to talk to the bot |
| `open` | `true` lets anyone talk to it (default `false`) |
| `parseMode` | `Markdown`, `MarkdownV2` or `HTML`; omit for plain text |
| `greeting` | Reply to `/start` |

Bots are effective adapter configuration, so they follow the [runtime adapter lifecycle](./#runtime-lifecycle): `v/ops/venue/adapter/configure` adds, removes and changes bots on a running venue — changed bots restart, the rest are untouched — and `adapters.telegram.enabled: false` parks the adapter. Runtime configuration is not persisted across a restart.

A bot whose token secret is absent parks as `PENDING` and retries, so provisioning the secret later brings it up without a restart.

### Inbound access is fail-closed

Only Telegram users on the bot's `allow` list are answered, unless the bot is `open: true`. Nothing else reaches the handler.

## Users can create their own bots

`telegram:create` registers a bot that acts as **you**, and starts it immediately. Get a token from `@BotFather`, store it with [`secret:set`](./secret), and pass the reference — literal tokens are refused:

```json
{
  "operation": "v/ops/telegram/create",
  "input": {
    "name": "my-assistant",
    "token": "s/TELEGRAM_BOT_TOKEN",
    "agent": "Alice",
    "allow": ["@me"]
  }
}
```

The bot is recorded in the venue-private adapter workspace under `users/<your-did>/bots/<name>` and re-armed at boot; `telegram:delete` stops it and removes its record together with its per-chat sessions (the Telegram-side bot and its token are untouched). Config-declared bots cannot be deleted this way.

## Sending

`telegram:send` takes Telegram's own [`sendMessage`](https://core.telegram.org/bots/api#sendmessage) parameters as-is:

```json
{
  "operation": "v/ops/telegram/send",
  "input": {
    "chat_id": 123456789,
    "text": "Invoice INV-042 is approved.",
    "reply_markup": { "inline_keyboard": [[{ "text": "View", "callback_data": "v:42" }]] }
  }
}
```

`bot` is optional when you own exactly one. Two conveniences beyond the raw API: text over 4096 characters is split into consecutive messages, and if a `parse_mode` is set and Telegram rejects the formatting, the text is resent plain.

Everything beyond plain text goes through `telegram:call` — `sendPhoto`, `sendDocument`, `editMessageText`, `answerCallbackQuery`, `setMessageReaction`, `getChat`, and the rest, with the method's documented parameters:

```json
{
  "operation": "v/ops/telegram/call",
  "input": {
    "method": "sendPhoto",
    "params": { "chat_id": 123456789, "photo": "https://example.com/chart.png", "caption": "Q3" }
  }
}
```

The methods that drive the update stream — `getUpdates`, `setWebhook`, `deleteWebhook`, `logOut`, `close` — are refused: the venue's own update loop owns them.

## What an agent sees

An agent behind a Telegram bot receives `{text, via}`, where `via` is put there by the venue rather than typed by anyone:

```json
{
  "text": "when is my invoice due?",
  "via": {
    "from": { "id": 123456789, "username": "someone", "first_name": "Sam" },
    "chat": { "id": 123456789, "type": "private" },
    "bot": "support",
    "access": "allow"
  }
}
```

`via.access` is how the sender was admitted — `allow` (allow-listed by the bot's owner) or `open`. Treat `via.from` as **who you are talking to on Telegram**: it is not a Covia identity and carries no venue authority. The venue's own attribution note names the bot's Covia identity — the principal that submitted the turn — not the human.

The module ships a `telegram` [agent skill](./skills) and a `v/agents/templates/telegram` assistant template, so an agent can be given Telegram literacy without hand-writing a prompt.

## Capabilities

| Ability | Resource | Grants |
|---------|----------|--------|
| `telegram/send` | `<bot user>/telegram/<bot>` | Send text through that bot |
| `telegram/call` | `<bot user>/telegram/<bot>` | Any Bot API method — a superset of `send` |
| `telegram/manage` | `<owner>/telegram/<name>` | Create or delete your own bots |

The bot's user — and their agents, within scope — may send. Anyone else needs a [delegation](./ucan) from that user.

## Related

- [Discord Adapter](./discord) — the same shape for Discord
- [Secrets](./secret) — where bot tokens live
- [Agents](../agents/) — what a bot routes to
- [Capabilities](../capabilities) — the authority model
