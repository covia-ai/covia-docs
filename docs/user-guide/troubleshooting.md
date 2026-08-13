---
title: Troubleshooting
sidebar_position: 6
---

# Troubleshooting

Symptoms, causes, and fixes for the issues people actually hit. Each error message below is shown verbatim as the venue produces it.

## "Cannot resolve operation: …"

```json
{ "error": "Error invoking operation: IllegalArgumentException:Cannot resolve operation: covia:read" }
```

**Cause:** the `operation` field isn't a resolvable reference. The short `adapter:op` style (`covia:read`, `http:get`) is a display name, not an address.

**Fix:** use the catalog path — `v/ops/covia/read`, `v/ops/http/get`. List everything the venue offers with `GET /api/v1/operations`. Multi-word operations are kebab-case: `v/ops/grid/job-result`, `v/ops/agent/cancel-task`, `v/ops/mcp/tools-list`. The other valid forms are a workspace pin (`o/<name>`), an asset id (`a/<hash>`), and a DID URL. See the [API reference](./api/).

## My job failed — how do I see why?

A failed job carries its error in the job record:

```json
{ "id": "0x019e...", "status": "FAILED", "error": "boom", "output": null }
```

Ways to inspect:

- **The invoke response itself** — with `"wait": true` you get the final record including `error`.
- **By id** — `GET /api/v1/jobs/{id}` re-fetches the record at any time; `GET /api/v1/jobs` lists your recent job ids.
- **Live** — `GET /api/v1/jobs/{id}/sse` streams status updates while a job runs.
- **From the lattice** — your job log is data: `v/ops/covia/inspect` with `{"paths": "j", "budget": 1000}` previews recent records.

## "API key not found for provider 'openai' at /s/OPENAI_API_KEY"

**Cause:** an LLM operation ran but the venue couldn't resolve the API key from the caller's secret store. This fails fast by design — there is no silent fallback.

**Fix:** store the key the operation names:

```json
{ "operation": "v/ops/secret/set", "input": { "key": "OPENAI_API_KEY", "value": "sk-..." }, "wait": true }
```

Secrets are per-user and resolved at invocation time; they never appear in job records. Each [backend](./agents/llm-backends) declares its own secret name (`ANTHROPIC_API_KEY`, `XAI_API_KEY`, …). Local [Ollama](./agents/llm-backends#available-backends) needs no key.

## My agent is SUSPENDED

When a transition fails (bad credentials, missing tool, capability denial), the agent records the error and suspends rather than retrying blindly. Its sessions and tasks are preserved.

1. **Read the error:** `v/ops/agent/info` with `{"agentId": "..."}` — the `error` field says what broke.
2. **Fix the cause** — usually a missing secret, a tool path that doesn't resolve, or a capability the agent lacks.
3. **Resume:** `v/ops/agent/resume` with `{"agentId": "..."}` — the agent returns to SLEEPING and picks up its pending work.

## "'paths' must be a string or array of strings"

`v/ops/covia/inspect` takes **`paths`** (a string or an array), not `path` — unlike `covia:read`/`covia:write`, which take `path`. Easy to mix up.

## My data disappeared after a restart

**Cause:** the venue had no `store` configured, so it used an ephemeral temp store — and warned about it at startup:

```
No 'store' configured — falling back to ephemeral temp Etch store; data will be deleted on JVM exit.
```

**Fix:** set `"store": "/path/to/venue.etch"` in the venue config (for Docker, on a mounted volume). See [Persistence](../operator-guide/persistence) for the durability model.

## Claude (or another MCP client) won't connect

- **Check the path:** the MCP endpoint is `/mcp` on the venue, e.g. `http://localhost:8080/mcp`.
- **claude.ai and Claude Desktop custom connectors require a public HTTPS URL** — they cannot reach `localhost`. Use **Claude Code** for a local venue (`claude mcp add --transport http covia http://localhost:8080/mcp`), or tunnel (e.g. `ngrok http 8080`). See the [Claude tutorial](./tutorials/claude-mcp).
- **Testing with curl?** MCP responses need the right Accept header:

  ```bash
  curl -X POST http://localhost:8080/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
  ```

## A hosted venue rejects examples that work locally

Use **venue-3.covia.ai** or **venue-4.covia.ai** — they are redeployed automatically from the latest development build, which these docs track. The stable venues (**venue-1.covia.ai**, **venue-2.covia.ai**, and the scratch venue **venue-test.covia.ai**) run the latest release, which may lag the docs; `GET /api/v1/status` and `GET /api/v1/operations` tell you what a venue actually is and offers.

## Where are the venue's logs?

The venue logs to stdout (so `docker logs <container>` for Docker). Startup logs tell you the store location, the venue DID, and which adapters loaded; warnings about sweeps or flushes indicate persistence trouble — see [Persistence § Monitoring](../operator-guide/persistence#monitoring).

## Still stuck?

- `GET /api/v1/status` — is the venue up, and which venue is it?
- [`/swagger`](http://localhost:8080/swagger) — explore the live API interactively.
- Ask on [Discord](https://discord.gg/fywdrKd8QT) or open a [GitHub issue](https://github.com/covia-ai/covia/issues).
