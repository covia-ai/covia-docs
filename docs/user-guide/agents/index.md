---
title: Agents Overview
sidebar_position: 1
---

# Agents

Covia agents are persistent, stateful AI actors that live on a venue. They receive tasks, call tools, coordinate with other agents, and produce auditable results — all within the venue's governance and capability framework.

## Key Concepts

An agent is more than a chat session. It is a durable record with:

- **Configuration** — system prompt, tools, capabilities, LLM backend
- **State** — conversation history and user-defined data that persists across runs
- **Tasks** — a queue of inbound requests from humans, other agents, or systems
- **Timeline** — an append-only audit trail of every completed run

Agents are created by callers and scoped to their owner. Two different users can each have an agent named "Alice" without collision.

## Architecture

The agent system separates concerns into three pluggable levels:

```
Level 1: Framework          Level 2: Domain Logic       Level 3: LLM
agent:trigger               goaltree:chat               langchain:openai
agent:request        -->    llmagent:chat        -->    langchain:anthropic
agent:message               (custom)                    langchain:ollama
```

**Level 1 (Framework)** manages the agent lifecycle — reading inbound tasks, invoking the transition function, recording results in the timeline, and persisting state. It never inspects the conversation or user data.

**Level 2 (Domain Logic)** manages conversation history, tool call loops, and context assembly. Two built-in options:

| Adapter | Operation | Best for |
|---------|-----------|----------|
| [LLM Agent](./llm-agent) | `llmagent:chat` | Simple conversational agents, flat history |
| [Goal Tree](./goal-tree) | `goaltree:chat` | Complex tasks with hierarchical subgoals, typed outputs |

**Level 3 (LLM Call)** is a stateless request/response to the language model. See [LLM Backends](./llm-backends) for available providers.

## Agent States

An agent transitions through four states:

```
              create
                |
                v
  resume --> SLEEPING <-- (run completes successfully)
                |
            trigger / request
                |
                v
             RUNNING
              /    \
             v      v
         SLEEPING  SUSPENDED  (error)
                      |
                   resume
```

| State | Description |
|-------|-------------|
| **SLEEPING** | Idle, ready to run. Default after creation or a successful run. |
| **RUNNING** | A transition is in flight. New tasks and messages are queued. |
| **SUSPENDED** | Last run failed. Dormant — does not auto-retry. State and tasks are preserved for debugging. |
| **TERMINATED** | Logically deleted. Preserves audit record; can be revived with `overwrite: true`. |

## Quick Example

Create an agent, send it a task, and wait for the result:

```json
// 1. Create
POST /api/v1/invoke
{
  "operation": "agent:create",
  "input": {
    "agentId": "Alice",
    "config": {
      "systemPrompt": "You are Alice, a helpful research assistant.",
      "model": "gpt-4o",
      "tools": ["v/ops/covia/read", "v/ops/covia/list"]
    }
  }
}

// 2. Send a task and wait
POST /api/v1/invoke
{
  "operation": "agent:request",
  "input": {
    "agentId": "Alice",
    "input": { "question": "Summarise the vendor records" },
    "wait": true
  }
}
```

Or via MCP tools in Claude Desktop:

```
agent_create  agentId: "Alice"  config: { systemPrompt: "...", tools: [...] }
agent_request agentId: "Alice"  input: { question: "Summarise the vendor records" }  wait: true
```

## What's Next

- [Creating Agents](./creating-agents) — configuration, templates, and examples
- [Agent Operations](./operations) — full lifecycle reference
- [LLM Agent](./llm-agent) — simple conversational agents
- [Goal Tree](./goal-tree) — hierarchical goal decomposition
- [Tools and Context](./tools-and-context) — tool resolution, capabilities, context loading
- [LLM Backends](./llm-backends) — OpenAI, Anthropic, Ollama, and more

## Related

- [COG-004: Agents](/docs/protocol/cogs/COG-004) — Protocol specification
- [COG-011: Agent Loops](/docs/protocol/cogs/COG-011) — Loop semantics
- [COG-012: Orchestrations](/docs/protocol/cogs/COG-012) — Multi-agent orchestration
