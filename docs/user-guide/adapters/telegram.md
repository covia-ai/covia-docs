---
title: Telegram
sidebar_label: Telegram
description: Telegram bots as inbound handlers and outbound surfaces. One agent conversation per chat, media downloads, and allow-list enforcement.
---

# Telegram Adapter

A Telegram bot is useful because people can reach it from a phone. The `telegram` adapter runs operator-declared or runtime-created bots that connect Telegram chats to a venue agent or operation. Each bot runs as its user. Inbound updates fan out one `agent:chat` session per Telegram chat (persisted so conversations survive restarts), or hand the raw Telegram `Update` to an operation. Outbound operations cover the full Bot API: `send` for plain text, `call` for every other method, `download` to save a received attachment, and `format` to turn Markdown into the HTML flavour Telegram accepts.

## Operations

| Operation | Purpose |
|-----------|---------|
| `telegram:send` | Send a text message. Text over 4096 characters is split |
| `telegram:call` | Call any Bot API method (sendPhoto, editMessageText, answerCallbackQuery, …) |
| `telegram:download` | Save a received attachment to a DLFS destination. Returns `{ref, fileName, size}` |
| `telegram:format` | Convert Markdown to the HTML Telegram accepts (pure, read-only) |
| `telegram:create` | Register a caller-owned bot. The token must be an `s/NAME` secret reference |
| `telegram:delete` | Deregister a caller-owned bot |
| `telegram:bots` | List the caller's bots, state and Telegram username (tokens never returned) |

```json
{
  "operation": "v/ops/telegram/send",
  "input": {
    "bot": "my-support-bot",
    "chat_id": 123456789,
    "text": "Thanks, that's noted."
  }
}
```

Returns the sent `Message`. A private chat id is the person's Telegram user id; group ids are negative; channels may use `@channelusername`. Omit `bot` when the caller owns exactly one. For formatted text, run `telegram:format` on model-produced Markdown first and send the result with the `parse_mode` it returned.

## Inbound handlers: agent or operation

Each bot is declared with exactly one inbound handler. The `agent` handler runs one `agent:chat` session per Telegram chat, so a conversation thread corresponds to a durable conversation state. The `operation` handler hands every Telegram `Update` to the named operation exactly as Telegram sends it (snake_case, `message` or `callback_query` nested as Telegram nests them), plus the `bot` identifier. Every inbound message runs as a Job in the bot user's job index: the canonical record of the interaction.

The handler reply is governed by the bot's `reply` setting (result, silent, or a fixed acknowledgement). The adapter never reshapes operation messages. A target that wants a different input (a SQL write, a webhook, a log) is reached through an operator-owned mapping operation, not through adapter configuration.

## Allow lists and open bots

An allow-listed bot (the default) only answers Telegram users on its `allow` list, and only in private chats. `send` and `call` on an allow-listed bot can only address ids on that list, or the accounts that listed `@username` entries resolved to when those people first wrote in. Group chats are refused. An `open: true` bot answers anyone who writes to it and can send to any id. A refusal citing allow-list rules is the venue enforcing them, not a fault.

## Downloads and attachments

Inbound photos, voice notes, video and documents arrive as `attachments: [{kind, file_id, ref, mediaType, ...}]`. The `ref` points at a protected copy the adapter has already stored; nothing needs re-downloading unless the caller wants the raw file somewhere specific. `telegram:download {bot?, file_id, destination?, fileName?}` fetches it to a DLFS directory of the caller's choosing, picking a safe filename (`report(1).pdf`) on conflicts. Omit `destination` for the bot owner's private `dlfs/telegram` drive. The download gate is `telegram/download` on `<owner>/telegram/<bot>`; `telegram/send` does not grant it.

## Format for Telegram HTML

Telegram accepts HTML with a restricted tag set and does not accept the full Markdown spec. `telegram:format` converts Markdown to that HTML flavour deterministically with no bot involved. An agent bot can declare `format` as its `replyOperation` so every reply converts automatically, or an operation can call it before sending.

## Access Control

Each operation is gated on `<owner>/telegram/<bot>`: `telegram/send` for sends, `telegram/call` for Bot API calls, `telegram/download` for attachments and `telegram/manage` for create and delete. The bot's user and their agents (within scope) hold these; anyone else needs a delegation. See [UCAN](./ucan).

## Related

- [Secret Adapter](./secret): where the bot token lives before resolution
- [DLFS Adapter](./dlfs): the storage layer `telegram:download` writes to
- [UCAN Adapter](./ucan): capability gates on send, call, download and manage
- [Discord Adapter](./discord): the sibling messaging adapter for Discord bots
