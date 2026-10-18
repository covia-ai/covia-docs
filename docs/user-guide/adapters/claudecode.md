---
title: Claude Code
sidebar_label: Claude Code
description: Drive the Claude Code CLI from the venue in operator-declared project directories. Sessions persist on disk; processes stay warm between turns.
---

# Claude Code Adapter

An agent that needs to change code, run tests, or audit a repository can only do that against a real working tree. The `claudecode` adapter runs Anthropic's Claude Code CLI as a worker inside a venue-authorised project directory. Operators name the directories; callers never do. `claudecode:run` performs one turn as one Job, `claudecode:session` holds a long-lived conversation, and both return a `session` id the caller passes to the next call to continue the same conversation with full context intact.

## Operations

| Operation | Purpose |
|-----------|---------|
| `claudecode:run` | One turn as one Job. Returns `{result, session, turns, costUsd, permissionDenials, structured?}` |
| `claudecode:session` | A long-lived Job that waits in `INPUT_REQUIRED` after each turn; messages are the next turns, `{end: true}` finishes |
| `claudecode:projects` | List the projects the caller may run in |
| `claudecode:sessions` | List live and recently stopped sessions |
| `claudecode:stop` | Stop the live process behind a session; the conversation stays resumable |
| `claudecode:create` | Register a runtime project (venue authority) |
| `claudecode:delete` | Deregister a runtime project |

```json
{
  "operation": "v/ops/claudecode/run",
  "input": {
    "project": "my-service",
    "prompt": "Add a unit test for the retry path in Foo.java, run the module's tests, and report the diff.",
    "model": "sonnet",
    "allowedTools": ["Read", "Edit", "Bash(mvn *)", "Bash(git *)"]
  }
}
```

Returns `{result: "...", session: "0x7a3f...", turns: 4, costUsd: 0.12, permissionDenials: []}`. Pass `session` to the next `claudecode:run` call to continue. `permissionDenials` reports tools Claude Code wanted but the permission mode blocked.

## Projects are the unit of authorisation

A project is a directory the venue's OS user may execute code in. Projects are declared by the operator under `adapters.claudecode.projects`, or at runtime by a caller holding venue authority (`<venue>/claudecode/projects` × `claudecode/manage`) through `claudecode:create`, in which case the record lives at `w/claudecode/projects/<name>` and the project re-arms at boot. Choosing a directory is always an operator-level decision. A caller never passes a path, only a project name.

The authority to run in a project is `claudecode/run` on `<owner>/claudecode/<project>`. The owner (and their agents, within scope) may run; anyone else needs a delegation from the owner.

## Sessions outlive processes

Claude Code keeps every session transcript on disk, so a session survives the process that produced it. Live processes form a bounded pool: `maxSessions` caps concurrency, each is around 400 MB, and a process is reaped after `idleSeconds` of inactivity or evicted least-recently-used first to make room for a new one. `claudecode:run` with a resumable `session` id transparently respawns the process if it is no longer warm. `claudecode:stop` reaps the live process early; the conversation is still resumable on the next turn.

## Session mode vs. run mode

`claudecode:run` is one Job per turn. `claudecode:session` is one Job that holds a conversation: it executes the optional first `prompt`, then waits in `INPUT_REQUIRED` with the turn's reply as its output; each job message (`{content}` or `{prompt}`) is the next turn; `{"end": true}` finishes it with a summary. Pick `session` when the long-lived Job should be the handle on the conversation; pick `run` when the caller is already tracking the `session` id and wants per-turn Jobs.

## Progress and structured output

While a turn runs, the Job carries `progress: {toolCalls, lastTool, text, session, model}` so watchers see what Claude Code is doing. For machine-readable turns, pass `jsonSchema` and read the parsed answer from `structured`; `result` always carries the final text message. A turn that fails with `error_max_turns` or a budget cap reports the session id so a caller can resume with a wider budget.

## Access Control

Running in a project requires `claudecode/run` on `<owner>/claudecode/<project>`. Creating or deleting a runtime project requires `claudecode/manage` on the venue resource `claudecode/projects`. See [UCAN](./ucan) for the capability model.

## Related

- [Remote Agent Adapter](./remoteagent): dispatches work to Covia agents the same way `claudecode:run` dispatches to Claude Code
- [UCAN Adapter](./ucan): capability gates for project access and runtime project management
- [Secret Adapter](./secret): where API keys configured for Claude Code live before resolution
- [Agents on the Grid](../agents/): what calls Claude Code turns when an agent delegates coding work
