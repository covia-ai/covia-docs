---
sidebar_position: 2
title: Working with agents
---

# Working with agents

The **Agents** section is the workbench for [Covia Agents](../../overview/agents): create an agent from a template, chat with it in sessions, watch what it does, and control its lifecycle. Every action here is an `agent:*` operation on the venue, so everything you do leaves the same audit trail a script would.

## Creating an agent

**Agents → Create** builds an agent from a venue template (`v/agents/templates/*`): among them `skilled` (lean core with loadable skills), `goaltree` (hierarchical planner), `worker`, `analyst`, and `minimal`. You choose a name, an LLM provider and model, and a system prompt; the template supplies the default tools and skills. The venue needs an API key for your chosen provider, stored as a [secret](./data-and-inbox#secrets) under the standard name (for example `ANTHROPIC_API_KEY`); the create flow detects which providers are ready.

Equivalent operation:

```json
POST /api/v1/invoke
{ "operation": "v/ops/agent/create",
  "input": { "agentId": "researcher", "template": "skilled",
             "config": { "model": "claude-sonnet-5", "systemPrompt": "..." } } }
```

After creation, the **tool & skill picker** on the agent's configuration lets you browse the venue's operations and skills and attach or detach them; each change is an `agent:update` with its own job record.

SDK: `venue.agents.create(...)`, then `venue.agents.chat(...)`. See [Creating Agents](../agents/creating-agents) for the full configuration shape.

## Chat and sessions

**Agents → Chat** is a two-pane workbench: your agents on the left, the conversation on the right. Each conversation is a [session](../agents/sessions) on the venue: sessions persist across restarts, can be renamed, and the transcript renders agent replies as markdown with tool calls grouped into collapsible turns, so you can see exactly which operations the agent invoked and what came back.

| In the app | Operation |
| ---------- | --------- |
| Send a message | `agent:chat` (with `sessionId` after the first turn) |
| New chat | `agent:chat` without a session id; the venue mints one |
| Rename a session | `agent:renameSession` |
| Fire-and-forget note to the agent | `agent:message` |
| Hand the agent a task | `agent:request` |

## Runtime state and control

The agent detail view shows what a status pill alone cannot: pending inbox messages waiting for the next cycle, the next scheduled wake time, tasks in flight, and the per-cycle **timeline** with the operations each run invoked and the tokens it consumed. From the toolbar you can trigger a run now (`agent:trigger`), suspend and resume (`agent:suspend` / `agent:resume`), and delete (`agent:delete`).

Agent statuses: `SLEEPING` (waiting for messages or a wake), `RUNNING` (in a cycle), `SUSPENDED` (will not run until resumed), `TERMINATED`.

## Skills

**Agents → Skills** is the venue's skills library: every [skill](../../overview/skills) the venue ships plus any you have written into your workspace (`w/skills`), each readable in full. A skill is an ordinary content-addressed asset bundling instructions, context, and tools that an agent loads on demand, so the library doubles as a catalogue of what your agents can learn. The page reads through `skills:manage`, job-free.

To teach an agent a skill of your own, follow [Teach an Agent a New Skill](../tutorials/skills).
