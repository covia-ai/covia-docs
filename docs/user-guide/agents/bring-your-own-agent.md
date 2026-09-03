---
sidebar_position: 8
title: Bring your own agent
---

# Bring your own agent

You don't have to rebuild an agent to use it on Covia. If you already run one —
in Agentforce, Lyzr, Hermes, or any other framework — you can **connect it to a
venue** and task it like a native agent: it becomes discoverable, every call is
a governed job with a receipt, and it can take part in workflows across the grid.

The on-ramp is **A2A** (the [Agent-to-Agent protocol](https://a2a-protocol.org/)),
now a Linux Foundation standard backed by 150+ organisations. Covia is already an
A2A *client* — you **import** the remote agent once, then send it work. See the
[A2A adapter](../adapters/covia-with-a2a) for the full operation reference.

## Three steps

### 1. Store the agent's credential

The remote agent authenticates you with its own credential — an API key or a
bearer token. Keep it in your venue's encrypted secret store, referenced by name
and never inlined into a call:

```bash
curl -X PUT https://venue-3.covia.ai/api/v1/secrets/PARTNER_KEY \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"value": "<the remote agent key>"}'
```

### 2. Import the agent

`import-agent` fetches the remote **Agent Card** (`/.well-known/agent-card.json`),
validates the endpoint, and writes an immutable `type:a2a-agent` asset bound at
`w/a2a/agents/<name>`. Auth is attached here, once — as a `s/NAME` reference:

```bash
curl -X POST https://venue-3.covia.ai/api/v1/invoke \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"operation": "v/ops/a2a/import-agent",
       "input": {"name": "partner-bot",
                 "url": "https://agent.example.com",
                 "auth": {"scheme": "bearer", "secret": "s/PARTNER_KEY"}}}'
```

Use `auth: {scheme: "<card scheme>", secret: "s/NAME"}` for the API-key or
HTTP-Bearer scheme the agent card declares, or `auth: {kind: "bearer", secret:
"s/NAME"}` when a bearer is needed even to fetch a private card. Literal
credentials are rejected — only the reference is stored.

### 3. Send it work

Task the binding. One Covia **Job mirrors one remote A2A Task**: the adapter
polls the remote to completion, cancelling the Job sends a best-effort cancel,
and an `input-required` / `auth-required` turn surfaces on the Job so you can
respond. Reattach a long-running task with `v/ops/a2a/get-task`.

```bash
curl -X POST https://venue-3.covia.ai/api/v1/invoke \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"operation": "v/ops/a2a/send",
       "input": {"agent": "w/a2a/agents/partner-bot",
                 "message": {"role": "user",
                             "parts": [{"type": "text", "text": "Summarise Q1 revenue"}]}}}'
```

TypeScript: `await venue.secrets.set("PARTNER_KEY", key)`, then
`await venue.operations.run("v/ops/a2a/import-agent", { name, url, auth })`, then
`await venue.operations.run("v/ops/a2a/send", { agent, message })`.

Once imported, an agent can also be loaded through the `a2a` skill, so a skilled
agent can discover and task it in plain language.

## Your framework

Most agent platforms now speak A2A, so "can I bring it in?" is increasingly
"yes". A few specifics:

| Framework | A2A | How to point Covia at it |
| --- | --- | --- |
| **Agentforce** (Salesforce) | Native — Salesforce co-created A2A and contributed the Agent Card | Import its agent URL with the scheme the card declares |
| **Lyzr** | Native, in Lyzr Agent Studio | Import; the credential is the agent's API key |
| **Hermes** (Nous Research) | Native A2A plugin, both directions | Expose Hermes with a bearer and an explicit `A2A_HOST`, store the bearer as `s/NAME`, then import |
| **OpenClaw** | Local-first gateway; A2A not built in | Front its gateway with a thin A2A facade (an `a2a-sdk` wrapper), then import — its self-hosted design makes this straightforward |

For a framework that exposes only tools (not an agent), bridge those instead —
see [Connect your tools](../connect-your-tools) (MCP) — or wrap a plain HTTP API
as an operation.

## What you get

- **Governed** — every interaction is a job with a verifiable receipt on your
  venue; the imported agent acts under your own capabilities toward the remote.
- **Discoverable and composable** — it is an ordinary asset; other agents and
  workflows can reach it.
- **Resumable** — tasks have no framework timeout; reattach by task id.
- **Contained** — the remote's replies are treated as untrusted data; the
  credential never leaves your secret store, and Covia UCAN proofs are not
  forwarded outbound, so cross-organisation authorisation rests on the remote's
  own auth.

## Related

- [A2A adapter](../adapters/covia-with-a2a) — the full inbound and outbound reference
- [Connect your tools](../connect-your-tools) — bringing a framework's *tools* in over MCP
- [Agents overview](../../overview/agents) — the three doors: hosted, bring-your-own-agent, bring-your-own-model
