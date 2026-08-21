---
id: claudecode
title: Claude Code Adapter
sidebar_label: Claude Code
---

# Claude Code Adapter

Some tasks want a coding agent, not a chat model: read the repository, change files, run the tests, report what happened. The Claude Code adapter makes that an ordinary grid operation — a venue drives the [Claude Code](https://claude.com/claude-code) CLI in a directory it is authorised to work in, and the turn comes back as a Job with a result, a cost, and a session id you can continue from.

It is an optional [venue module](./jvm#venue-modules) (`ai.covia:covia-claude-code`). Claude Code runs as the venue's own OS user, under that user's subscription or API login.

## Operations

| Operation | Purpose |
|-----------|---------|
| `claudecode:run` | One Claude Code turn as one Job |
| `claudecode:session` | A long-lived conversation held open as a Job |
| `claudecode:sessions` | Sessions you may see, live and recently stopped |
| `claudecode:stop` | Stop a live process (the session stays resumable) |
| `claudecode:projects` | The projects you may run in |
| `claudecode:create` / `claudecode:delete` | The runtime project registry (venue authority) |

## Projects are the unit of authorisation

A **project** is a directory Claude Code may run in, owned by a `user`. That user and their agents may run there; anyone else needs a [delegation](./ucan) from them. The gate is `<owner>/claudecode/<project>` × `claudecode/run`.

Naming a directory in which the venue's OS user may execute arbitrary code is always an operator-level decision — **a caller never chooses a directory**. Projects are declared in config:

```json
{
  "adapters": {
    "claudecode": {
      "maxSessions": 4,
      "idleSeconds": 900,
      "projects": {
        "docs": {
          "path": "/srv/repos/covia-docs",
          "user": "did:web:venue.example:u:alice",
          "description": "Documentation site",
          "options": { "model": "sonnet", "permissionMode": "acceptEdits" }
        }
      }
    }
  }
}
```

…or created at runtime with `claudecode:create` by a caller holding venue authority (`<venueDID>/claudecode/projects` × `claudecode/manage`), in which case they are recorded at `w/claudecode/projects/<name>` and re-armed at boot.

## Running a turn

A prompt should be a complete, self-contained task — Claude Code is a full agent that reads, edits, runs commands and uses git in that directory:

```json
{
  "operation": "v/ops/claudecode/run",
  "input": {
    "project": "docs",
    "prompt": "Add a unit test for the link checker and run the suite.",
    "allowedTools": ["Read", "Edit", "Bash(pnpm *)"],
    "maxTurns": 30
  }
}
```

The result carries `result` (the final text), `session`, `turns`, `costUsd`, `durationMs`, `model`, `subtype`, and `permissionDenials` — the tool uses Claude Code refused under the permission mode, which is what to widen if a task couldn't be finished. While the job runs it publishes `progress` (`toolCalls`, `lastTool`, `text`, `session`, `model`) so watchers can see what it's doing.

Pass `jsonSchema` and the result also carries `structured`, the validated object.

A turn that Claude Code reports as an error — max turns, budget, execution error — **fails the job** with the reason and a session id you can resume from.

### Permission modes

Headless runs have nobody to answer a permission prompt, so `default` denies anything that would ask. `acceptEdits` auto-approves file edits; `plan` is read-only planning. `bypassPermissions` is only allowed when the project itself is configured with it.

Per-call options — `model`, `fallbackModel`, `effort`, `allowedTools`, `disallowedTools`, `tools`, `maxTurns`, `maxBudgetUsd`, `appendSystemPrompt`, `agent`, `keepAlive` — layer over the project's settings, which layer over the adapter defaults. Process environment, working directories and MCP configuration are **operator-only**: they can be set in adapter or project config, never per call.

## Continuing a conversation

Claude Code keeps every session on its own disk transcript, so a session outlives its process. Pass `session` from a previous result to continue with full context:

```json
{
  "operation": "v/ops/claudecode/run",
  "input": { "session": "a1b2c3d4-…", "prompt": "Now update the changelog for that change." }
}
```

That is the right shape for **an agent using Claude Code as a tool**. For a client that holds a job handle — REST/SSE, A2A — `claudecode:session` opens the conversation as a single long-lived Job: it runs the optional first `prompt`, then waits in `INPUT_REQUIRED` with the turn's reply as its output; each message sent to the job (`{"content": "…"}`) is the next turn, and `{"end": true}` finishes it.

## The process pool

Live Claude Code processes are a bounded pool — roughly 400 MB each — so they are managed rather than unlimited:

| Setting | Default | Meaning |
|---------|---------|---------|
| `maxSessions` | 4 | Maximum live processes; a new session evicts the least recently used |
| `idleSeconds` | 900 | Idle time before a warm process is reaped |

A process stays warm between turns while `keepAlive` is on (the default), and is respawned transparently on the session's next turn. Because the conversation lives in Claude Code's own transcript, a reap — or a venue restart — costs latency, not context. `claudecode:stop` stops a live process without ending the session.

## Capabilities

| Ability | Resource | Grants |
|---------|----------|--------|
| `claudecode/run` | `<project owner>/claudecode/<project>` | Run turns and sessions in that project |
| `claudecode/manage` | `<venueDID>/claudecode/projects` | Create or delete runtime projects |

## Related

- [Agents](../agents/) — using Claude Code as an agent tool
- [Capabilities](../capabilities) — the authority model
- [JVM Adapter](./jvm) — how venue modules are loaded
