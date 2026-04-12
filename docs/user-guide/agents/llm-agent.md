---
title: LLM Agent
sidebar_position: 4
---

# LLM Agent

The LLM Agent adapter (`llmagent:chat`) provides a simple conversational agent model with flat conversation history and a tool call loop. It is the default transition function for new agents.

## How It Works

On each run, the LLM Agent:

1. **Assembles context** — system prompt, loaded context paths, pending job results, inbox messages, and conversation transcript
2. **Calls the LLM** — sends messages and tool definitions to the Level 3 backend
3. **Processes tool calls** — if the LLM requests tool calls, executes each as a grid operation and appends results
4. **Loops** — repeats steps 2-3 until the LLM returns a text response (no tool calls), up to 20 iterations
5. **Persists transcript** — stores new conversation turns in agent state

```
         ┌──────────────────────────────────────┐
         │  Assemble context                     │
         │  (system prompt + transcript + tools) │
         └──────────────┬───────────────────────┘
                        │
                        v
              ┌─────────────────┐
              │  Call LLM       │ <───────────┐
              └────────┬────────┘             │
                       │                      │
              ┌────────v────────┐             │
              │  Tool calls?    │── yes ──> Execute tools
              └────────┬────────┘
                       │ no
                       v
              ┌─────────────────┐
              │  Return text    │
              └─────────────────┘
```

## Configuration

Use `llmagent:chat` by omitting the `operation` field (it is the default) or setting it explicitly:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "helper",
    "config": {
      "operation": "v/ops/llmagent/chat",
      "systemPrompt": "You are a helpful assistant.",
      "model": "gpt-4o",
      "tools": ["v/ops/covia/read", "v/ops/covia/list"]
    }
  }
}
```

## Transcript Model

The LLM Agent separates **persistent transcript** from **ephemeral context**:

- **Transcript** (`state.transcript`) — real conversation turns only: user messages, assistant responses, and tool call/result pairs. Persisted across runs.
- **Ephemeral context** — system prompt, loaded context paths, pending job results, inbox messages. Rebuilt fresh each turn from current config and lattice state.

This means:
- Updates to the system prompt take effect immediately (not frozen from first turn)
- Context paths reflect current data, not stale snapshots
- The transcript doesn't bloat with repeated system messages

## Built-in Tools

When `defaultTools` is `true` (the default), the agent has access to ~19 standard tools:

**Workspace CRUD:** `covia:read`, `covia:write`, `covia:delete`, `covia:append`, `covia:slice`, `covia:list`

**Agent Management:** `agent:create`, `agent:fork`, `agent:request`, `agent:message`, `agent:trigger`, `agent:info`, `agent:list`, `agent:cancelTask`

**Assets:** `asset:store`, `asset:get`, `asset:list`

**Schema:** `schema:validate`, `schema:infer`, `schema:coerce`

Additionally, two task management tools are always available:
- `complete_task` — complete a pending task with a result
- `fail_task` — reject a pending task with a reason

And two context management tools:
- `context_load` — persistently load a lattice path into context
- `context_unload` — stop loading a path

## When to Use

The LLM Agent is well suited for:

- **Conversational assistants** — multi-turn Q&A with tool access
- **Simple task workers** — agents that process one task at a time
- **Prototyping** — quick setup with sensible defaults

For complex tasks requiring hierarchical decomposition, subgoals, or typed structured outputs, consider the [Goal Tree](./goal-tree) adapter instead.

## Related

- [Goal Tree](./goal-tree) — hierarchical goal decomposition
- [Tools and Context](./tools-and-context) — tool resolution and context budgets
- [LLM Backends](./llm-backends) — configuring the Level 3 provider
