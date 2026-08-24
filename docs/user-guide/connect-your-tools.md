---
sidebar_position: 6
title: Connect your tools
---

# Connect your tools

Agents on a venue can use your third-party services (GitHub, Linear, Notion, HubSpot, Slack, and more) with **credentials you supply and keep on your own venue**. There is no Covia-hosted broker in the path: a token you paste is stored in your venue's encrypted secret store, referenced by name, injected at runtime, never shown back, never placed in a prompt, and redacted from job records. Revoking access is deleting the secret.

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
| **Zapier** | `https://mcp.zapier.com/api/v1/connect` | `ZAPIER_MCP_TOKEN` (connection token) | mcp.zapier.com → New MCP Server → Connect. *Bridging pending a fix to endpoint handling (covia#398).* |
| **Stripe** | `https://mcp.stripe.com` | `STRIPE_KEY` (restricted key, read-only where possible) | Stripe Dashboard → API keys. *Same pending fix.* |

Zapier is worth a special mention: once bridged it reaches Google Workspace, Slack, Notion, and thousands of other apps through **your own** Zapier connections, which is the quickest honest route to Google data from a private venue today.

Remove a bridge with `mcp:server:remove` (`{name}`); refresh its tool list after vendor changes with `mcp:server:refresh`. Scope `venue` (shared with everyone on the venue) needs the `mcp/manage` ability; the default `user` scope is private to you.

## 2. Connection skills over the HTTP operations

For services without a token-friendly MCP server, the venue ships **connection skills**: instruction bundles that teach an agent a service's API on top of the built-in `http:get` / `http:post` operations. The credential is passed as `bearerSecret: "s/<NAME>"` and resolved server-side; the agent never sees it.

| Skill | Secret to store | Credential type |
| ----- | --------------- | --------------- |
| `v/skills/connections/notion` | `NOTION_TOKEN` | Personal access token (Settings → Developer Mode) or an internal connection token |
| `v/skills/connections/hubspot` | `HUBSPOT_TOKEN` | Private-app access token (Settings → Integrations → Private Apps) |
| `v/skills/connections/slack` | `SLACK_BOT_TOKEN` (`xoxb-`) or `SLACK_USER_TOKEN` (`xoxp-`) | A Slack app you create and install in your workspace (api.slack.com/apps; a manifest makes this one step) |

Store the secret, attach the skill to an agent (or let a `skilled` agent load it on demand), and ask: "summarise the Notion page for the Q3 plan" or "post the deploy summary to #releases". Each call is a job record; each skill explains the service's error semantics so the agent reports a missing scope instead of retrying blindly.

Atlassian (Jira/Confluence) uses HTTP Basic authentication for its API tokens, which the HTTP operations cannot yet resolve from a secret; that is tracked as covia#397 and an Atlassian skill follows it.

## What about Google?

Google is the one service where the standard "Sign in with Google" shape does not fit a private venue, because Google requires a pre-registered, verified application and its device flow excludes Gmail, Calendar, and full Drive. The honest options today:

- **Organisations running their own venue:** a Google service account with domain-wide delegation (a super admin grants the scopes once; no OAuth client, no verification). An adapter for this path is planned.
- **Individuals:** Zapier (above) for actions against your Google data, or your own Google OAuth client configured on your venue, accepting Google's verification rules for the scopes you need.
- **Covia-hosted venues:** will offer Covia's own verified Google client as a convenience; that does not become a dependency for any other venue.

## Security model in one paragraph

Credentials live in your venue's per-user secret store (AES-256-GCM, decryptable only by that venue). Operations reference them by name; the runtime is the single decryption point and injects values at the adapter layer. Fields an operation marks as secret are redacted from job records. Every use is a job under your authority, and agents act only within the capabilities you granted them. Deleting the secret ends the access.

## Coming next

Device-code sign-in for services that support it (GitHub, Microsoft 365) with the code shown in your inbox; bring-your-own OAuth clients for data scopes; the venue as a first-class MCP client for vendors that support client ID metadata documents; and a Covia connector for Claude and ChatGPT so your venue's tools appear there.
