---
sidebar_position: 6
title: Connect your tools
---

# Connect your tools

Agents on a venue can use your third-party services (GitHub, Linear, Notion, HubSpot, Slack, and more) with **credentials you supply and keep on your own venue**. There is no Covia-hosted broker in the path: a token you paste is stored in your venue's encrypted secret store, referenced by name, injected at runtime, never shown back, never placed in a prompt, and redacted from job records. Revoking access is deleting the secret.

## The quickest path: the Connections page

In the dashboard, **Connections** (under Data) is a catalogue of ready-to-use
services. Pick one, follow the two or three steps to create a token, and paste
it: the page stores the token encrypted on your venue, runs a live
**test-before-save** check (a bad token is rejected and never kept), and shows
the service as connected. Paste a token straight into the search box and it
recognises the service for you. Each connected service can then be granted to
individual agents from the agent's own **Connections** section, so an agent
only reaches what you allow.

The catalogue today, grouped as it appears in the app:

| Group | Services |
| ----- | -------- |
| Dev | GitHub, Sentry, GitLab, PagerDuty, Datadog |
| Docs & PM | Notion, Jira, Linear, Asana, ClickUp, Calendly, monday.com, Confluence, Trello |
| CRM & Support | HubSpot, Intercom, Zendesk |
| Payments | Stripe |
| Comms | Slack, Discord, Telegram, SendGrid, Twilio |
| Data | Airtable, Shopify |

Behind that page are the two mechanisms below; either can be driven directly
against the API.

## Two mechanisms

Two mechanisms cover most services today, and both work on a self-hosted venue exactly as on a hosted one.

## 1. Bridge a vendor's MCP server with a token

Many vendors now run a remote MCP server. The venue can mirror one into its own catalog with `mcp:server:add`: the vendor's tools appear as ordinary operations under `o/mcp/<name>/...`, capability-checked and audited like everything else, and agents can pick them up through the tool picker or a skill.

Store the vendor token first, then bridge:

```bash
# 1. store the token (write-only; the value is never readable back)
curl -X PUT https://venue-3.covia.ai/api/v1/secrets/GITHUB_TOKEN \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"value": "github_pat_..."}'

# 2. bridge the server, referencing the secret by name
curl -X POST https://venue-3.covia.ai/api/v1/invoke \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"operation": "v/ops/mcp/server/add",
       "input": {"name": "github", "url": "https://api.githubcopilot.com/mcp/", "auth": "s/GITHUB_TOKEN"}}'
```

TypeScript: `await venue.secrets.set("GITHUB_TOKEN", token)` then `await venue.operations.run("v/ops/mcp/server/add", { name: "github", url: "https://api.githubcopilot.com/mcp/", auth: "s/GITHUB_TOKEN" })`.

| Service | MCP endpoint | Token to store | Where to get it |
| ------- | ------------ | -------------- | --------------- |
| **GitHub** | `https://api.githubcopilot.com/mcp/` | `GITHUB_TOKEN` (fine-grained personal access token) | GitHub → Settings → Developer settings → Personal access tokens |
| **Linear** | `https://mcp.linear.app/mcp` | `LINEAR_API_KEY` (personal API key) | Linear → Settings → API |
| **Zapier** | `https://mcp.zapier.com/api/v1/connect` | `ZAPIER_MCP_TOKEN` (connection token) | mcp.zapier.com → New MCP Server → Connect |
| **Stripe** | `https://mcp.stripe.com/` | `STRIPE_KEY` (restricted key, read-only where possible) | Stripe Dashboard → API keys |

The bridge normalises each URL to the server's streamable-HTTP endpoint: a bare host implies `/mcp` (so `https://mcp.linear.app` and `https://mcp.linear.app/mcp` are the same), any explicit path is kept as given, and a lone trailing slash means *this exact root* — which is why Stripe's root server is written `https://mcp.stripe.com/`.

Zapier is worth a special mention: once bridged it reaches Google Workspace, Slack, Notion, and thousands of other apps through **your own** Zapier connections, which is the quickest honest route to Google data from a private venue today.

**Bring your own automation platform.** Anything that speaks streamable HTTP can be bridged the same way, including a platform you already run. Expose an **n8n** workflow through its *MCP Server Trigger* node (choose the streamable-HTTP transport and a bearer token), or switch on **Make**'s hosted MCP server (streamable HTTP; its connection URL ends in `/stream`), then `mcp:server:add` that URL with the token as `s/<NAME>`. Because the endpoint is your own instance or account, there is no fixed vendor URL to list — you paste the one that platform gives you. Each then reaches every app you have already connected there, the same logic as Zapier, on infrastructure you control.

Remove a bridge with `mcp:server:remove` (`{name}`); refresh its tool list after vendor changes with `mcp:server:refresh`. Scope `venue` (shared with everyone on the venue) needs the `mcp/manage` ability; the default `user` scope is private to you.

## 2. Connection skills over the HTTP operations

For services without a token-friendly MCP server, the venue ships **connection
skills**: instruction bundles that teach an agent a service's API on top of the
built-in `http:get` / `http:post` operations. The credential is referenced by
name and resolved server-side; the agent never sees it. Three shapes cover how
a service expects its credential, so the skill picks whichever fits:

- **Bearer** — `bearerSecret: "s/<NAME>"` sends `Authorization: Bearer <token>`.
- **Header** — `secretHeaders: {"<Header>": "s/<NAME>"}` sends the stored value
  as any header, so Basic auth (`Basic <base64>`), an API-key header, or a
  `Bot <token>` value all work; the stored secret is the complete header value.
- **URL** — an `{s/<NAME>}` placeholder in the request URL, for a service that
  carries its token in the path (Telegram's `/bot<token>/`). The venue resolves
  it before the request and masks it back out of every job record.

Whichever shape a service uses, store the secret, attach the skill to an agent
(or let a `skilled` agent load it on demand), and ask in plain language —
"summarise the Notion page for the Q3 plan", "post the deploy summary to
#releases", "open a Linear issue for this bug". Each call is a job record, and
each skill explains the service's error semantics so the agent reports a
missing scope instead of retrying blindly.

| Skill (`v/skills/connections/…`) | Secret to store | Credential and where to create it |
| --- | --- | --- |
| `github` | `GITHUB_TOKEN` | Fine-grained personal access token — GitHub → Settings → Developer settings → Fine-grained tokens |
| `notion` | `NOTION_TOKEN` | Internal integration secret — notion.so/my-integrations (share the pages you want) |
| `slack` | `SLACK_TOKEN` | Bot User OAuth token (`xoxb-`) — api.slack.com/apps → your app → Install |
| `hubspot` | `HUBSPOT_TOKEN` | Private-app access token — Settings → Integrations → Private Apps |
| `jira` | `ATLASSIAN_AUTH` | Basic auth, stored as `Basic <base64(email:token)>` — id.atlassian.com/manage-profile → API tokens |
| `linear` | `LINEAR_API_KEY` | Personal API key (sent as the raw `Authorization` value) — Linear → Settings → API |
| `stripe` | `STRIPE_KEY` | Restricted key, read-only where possible — Stripe Dashboard → Developers → API keys |
| `airtable` | `AIRTABLE_TOKEN` | Personal access token — airtable.com/create/tokens |
| `discord` | `DISCORD_BOT_TOKEN` | Bot token, stored as `Bot <token>` — discord.com/developers → your app → Bot |
| `telegram` | `TELEGRAM_BOT_TOKEN` | Bot token (`<id>:<hash>`) — @BotFather → `/newbot` |
| `asana` | `ASANA_TOKEN` | Personal access token — app.asana.com → My apps |
| `intercom` | `INTERCOM_TOKEN` | Access token — Intercom → Developer Hub → your app |
| `sentry` | `SENTRY_TOKEN` | Auth token — Sentry → Settings → Auth Tokens |
| `sendgrid` | `SENDGRID_KEY` | API key — SendGrid → Settings → API Keys |
| `twilio` | `TWILIO_AUTH` | Basic auth, stored as `Basic <base64(SID:token)>` — Twilio Console |
| `gitlab` | `GITLAB_TOKEN` | Personal access token (`api` or `read_api` scope) — GitLab → Preferences → Access Tokens |
| `clickup` | `CLICKUP_TOKEN` | Personal API token (sent as the raw `Authorization` value) — ClickUp → Settings → Apps → API Token |
| `calendly` | `CALENDLY_TOKEN` | Personal access token — Calendly → Integrations → API & Webhooks |
| `monday` | `MONDAY_TOKEN` | Personal API token (GraphQL, raw `Authorization` value) — monday.com → Developers → My access tokens |
| `pagerduty` | `PAGERDUTY_TOKEN` | API key, stored as the complete `Token token=<key>` header — PagerDuty → Integrations → API Access Keys |
| `zendesk` | `ZENDESK_SITE` + `ZENDESK_AUTH` | Subdomain, plus Basic auth (base64 of `email/token:api_token`) — Zendesk Admin Center → APIs |
| `confluence` | `CONFLUENCE_SITE` + `CONFLUENCE_AUTH` | Site, plus Basic auth (base64 of `email:token`) — id.atlassian.com → API tokens |
| `shopify` | `SHOPIFY_STORE` + `SHOPIFY_TOKEN` | Store subdomain, plus an Admin API access token (`shpat_`) — Shopify admin → Develop apps |
| `trello` | `TRELLO_KEY` + `TRELLO_TOKEN` | API key and token — trello.com/power-ups/admin |
| `datadog` | `DATADOG_API_KEY` + `DATADOG_APP_KEY` | API key and Application key — Datadog → Organization Settings |

Atlassian (Jira/Confluence) authenticates with HTTP Basic, and Twilio the same;
both are handled by the header shape above (`secretHeaders`), so no special
casing is needed.

## What about Google?

Google is the one service where the standard "Sign in with Google" shape does not fit a private venue, because Google requires a pre-registered, verified application and its device flow excludes Gmail, Calendar, and full Drive. The honest options today:

- **Organisations running their own venue:** a Google service account with domain-wide delegation (a super admin grants the scopes once; no OAuth client, no verification). An adapter for this path is planned.
- **Individuals:** Zapier (above) for actions against your Google data, or your own Google OAuth client configured on your venue, accepting Google's verification rules for the scopes you need.
- **Covia-hosted venues:** will offer Covia's own verified Google client as a convenience; that does not become a dependency for any other venue.

## Security model in one paragraph

Credentials live in your venue's per-user secret store (AES-256-GCM, decryptable only by that venue). Operations reference them by name; the runtime is the single decryption point and injects values at the adapter layer. Fields an operation marks as secret are redacted from job records. Every use is a job under your authority, and agents act only within the capabilities you granted them. Deleting the secret ends the access.

## Covia inside Claude and ChatGPT

The reverse direction ships too: the **Covia connector** lets your venue's
operations and agents appear as tools inside Claude and ChatGPT, so an
assistant can invoke your venue under your identity. It is a standalone OAuth
2.1 and MCP service; add it as a connector in the assistant and authorise it
against your venue.

## Coming next

Device-code sign-in for services that support it (GitHub, Microsoft 365) with
the code shown in your inbox; bring-your-own OAuth clients for data scopes; and
the venue as a first-class MCP client for vendors that support client ID
metadata documents.
