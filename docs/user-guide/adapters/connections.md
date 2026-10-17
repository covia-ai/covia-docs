---
title: Connections
sidebar_label: Connections
description: Discovery for 20+ pre-registered service connections (Slack, GitHub, Notion, Linear, Stripe, Twilio, etc.). Reports provider availability and per-caller credential presence without ever reading a secret.
---

# Connections Adapter

Every agent eventually needs to talk to a third-party service: send a Slack message, open a GitHub issue, append a row to Notion, trigger a Twilio SMS. The `connections` adapter is the discovery layer for those integrations. Two read-only operations (`list`, `status`) report what providers this venue knows about, which of their tools are currently live, and whether the authenticated caller has the credentials to use them. Transport stays with [HTTP](./http-adapter), grants stay with [OAuth](./oauth), credentials stay in the caller's `s/` namespace. This adapter never resolves, decrypts, or returns a secret value.

## Operations

| Operation | Purpose |
|-----------|---------|
| `connections:list` | Enumerate every known provider, with endpoint + auth metadata + the tools it uses |
| `connections:status` | Report, for the authenticated caller, whether credentials exist and tools are live |

```json
{
  "operation": "v/ops/connections/status",
  "input": {
    "provider": "slack"
  }
}
```

Returns `{connections: [{provider: "slack", skill: "v/skills/connections/slack", configured: true, credentials: [{ref: "s/slack-token", configured: true, source: "user"}], available: true, unavailableTools: []}]}`. Omit the `provider` field to report every connection. `configured: true` means the credential record exists in the caller's store; `available: true` means every tool's adapter is live right now. Neither implies authority: whether the caller can actually invoke each tool is still a UCAN check at the point of action.

## 20 pre-registered providers

Shipped with the venue in stable presentation order:

| Category | Providers |
|----------|-----------|
| Chat + collab | slack, discord, telegram |
| Project + issue tracking | asana, clickup, jira, linear, monday, notion |
| Dev + ops | github, gitlab, pagerduty, sentry |
| CRM + marketing | hubspot, intercom |
| Scheduling | calendly |
| Data + spreadsheets | airtable |
| Payments + comms | stripe, twilio, sendgrid |

Each provider is backed by an immutable skill asset at `v/skills/connections/<name>` containing the provider's instructions, tool references, endpoint, and credential-reference names. The adapter owns these skills; it does not maintain a parallel provider registry. Adding a new provider is adding a new skill, not editing adapter code.

## What a provider descriptor looks like

```json
{
  "provider": "slack",
  "description": "Send messages, read channels, manage Slack workspaces",
  "skill": "v/skills/connections/slack",
  "connection": {
    "baseUrl": "https://slack.com/api",
    "auth": {
      "kind": "bearer",
      "alternatives": ["s/slack-token", "oauth/slack"]
    }
  },
  "tools": ["slack_send_message", "slack_read_channel", "slack_list_users"],
  "available": true
}
```

The `auth.alternatives` list is ordered: the adapter prefers the first credential reference the caller has configured. A provider that accepts either a static token (`s/slack-token`) or an OAuth connection (`oauth/slack`) lists both.

## No state, no decryption

This adapter deliberately holds no state of its own. `connections:list` composes its output from the installed skill assets; `connections:status` additionally checks the caller's secret store for presence of the referenced credential names. No credential value is ever read; no OAuth grant is ever decrypted. The authority to actually use a credential is enforced at call time by the HTTP or OAuth adapter when the tool itself runs.

## Related

- [HTTP Adapter](./http-adapter): the transport every connection ultimately uses
- [OAuth Adapter](./oauth): user-granted OAuth 2.0 connections (one `auth.alternatives` option)
- [Secret Adapter](./secret): the encrypted store where static credentials live
- [Skills Adapter](./skills): each connection provider is backed by a skill asset
