---
title: Give Claude Your Own Tools in 5 Minutes
sidebar_position: 1
---

# Give Claude Your Own Tools in 5 Minutes

Every Covia venue is an [MCP server](../mcp/venues-as-mcp-servers). Point Claude at one and it immediately gets a working tool belt — a persistent workspace it can read and write, agents it can create and delegate to, assets, and grid operations. **No API key needed** for anything in this tutorial.

By the end, Claude will be storing data on a venue *you* control — memory that survives the conversation, lives on your infrastructure, and leaves an auditable record.

## Pick your path

| Path | Client | Venue | Time |
|------|--------|-------|------|
| **A — zero install** | claude.ai or Claude Desktop | Public test venue | ~2 min |
| **B — your own venue** | Claude Code (CLI) | Docker on your machine | ~5 min |

Custom connectors in claude.ai and Claude Desktop require a **public HTTPS** URL, which is why Path A uses a hosted venue. Claude Code connects happily to `localhost`, which is why Path B pairs it with Docker.

## Path A — connect Claude to a live venue (no install)

1. In **claude.ai** go to **Settings → Connectors** (or in **Claude Desktop**: Settings → Connectors), and click **Add custom connector**. *(Custom connectors require a Pro, Max, Team, or Enterprise plan.)*
2. Paste the test venue's MCP endpoint:

   ```
   https://venue-3.covia.ai/mcp
   ```

3. Click **Add**. That's it — Claude now has the venue's tools.

> The test venue is a shared, public sandbox — fine for trying things, not for anything you care about. Path B gives you your own.

## Path B — run your own venue and connect Claude Code

1. Start a venue (Docker, one line):

   ```bash
   docker run -p 8080:8080 ghcr.io/covia-ai/covia:latest
   ```

2. Tell Claude Code about it:

   ```bash
   claude mcp add --transport http covia http://localhost:8080/mcp
   ```

3. Verify the connection:

   ```bash
   claude mcp list
   ```

   You should see `covia: http://localhost:8080/mcp (HTTP) - ✓ Connected`.

> To use Claude Desktop with your own venue, the venue needs a public HTTPS URL — put it behind a tunnel (e.g. `ngrok http 8080`) or deploy it properly (see the [operator guide](../../operator-guide/venue-start)).

## Try it

Open a conversation and ask:

> *What tools do you have from covia?*

Claude will list around **35 tools** — workspace CRUD (`covia_read`, `covia_write`, `covia_list`, …), agent lifecycle (`agent_create`, `agent_request`, `agent_chat`, …), assets, grid operations, and secrets. These are the venue's [operations](../adapters/), exposed as snake_case MCP tools.

Now give Claude some memory:

> *Use covia_write to save my project preferences to `w/notes/preferences`: I prefer British English, tabs over spaces, and concise commit messages.*

Claude calls the tool and the venue answers `{"written": true}`. Then the payoff — **start a brand-new conversation** and ask:

> *Read `w/notes/preferences` from covia and follow them.*

The data is still there. It didn't live in the chat context — it lives in your venue's workspace, on your infrastructure.

## What just happened

Three things worth noticing:

1. **The tools are self-describing operations.** Claude discovered them via MCP `tools/list` — nothing was hard-coded on the client side. Anything you add to the venue (a new [adapter](../adapters/), a pinned operation) shows up as a tool automatically.

2. **The same data is reachable over every protocol.** What Claude wrote via MCP, you can read via REST:

   ```bash
   curl -X POST http://localhost:8080/api/v1/invoke \
     -H "Content-Type: application/json" \
     -d '{ "operation": "v/ops/covia/read", "input": { "path": "w/notes/preferences" }, "wait": true }'
   ```

   One capability, every protocol — that's the [grid](../../overview/grid) model.

3. **Every call left a record.** Each tool invocation is a [job](../api/) on the venue — who called what, when, with what result. Ask Claude to *"list recent jobs with grid_job_status"*, or browse `http://localhost:8080/swagger` yourself.

## Go further

- **Have Claude create an agent.** Ask: *"Use agent_create to create an agent called Scribe with the system prompt 'You summarise documents concisely', then send it a task with agent_request."* Claude builds and delegates to a persistent [Covia agent](../agents/) — an agent managing agents.
- **Keep the data for real.** The default Docker venue stores state in a temporary store. Mount a volume and set `store` in the config to make it durable — see [Persistence](../../operator-guide/persistence).
- **Lock it down.** A venue is public by default for easy development. Before exposing one, configure [authentication](../../operator-guide/auth) and [capabilities](../capabilities).

## Related

- [Venues as MCP Servers](../mcp/venues-as-mcp-servers) — configuration, tool filtering, naming
- [Calling MCP Tools](../mcp/calling-mcp-tools) — the reverse direction: your venue calling external MCP servers
- [Quick Start](../quick-start) — the REST and SDK fundamentals
