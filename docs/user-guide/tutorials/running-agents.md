---
title: Running Covia Agents
sidebar_position: 2
---

# Running Covia Agents

A Covia agent is not a chat session — it's a **durable record on a venue**: configuration, conversation [sessions](../agents/sessions), a task queue, and an append-only timeline, all persisted as lattice data you can inspect. In this tutorial you'll seed a workspace with data, create an agent, watch it use the workspace to do real work, and then read the audit trail it left behind.

**You'll need:** a running venue (`docker run -p 8080:8080 ghcr.io/covia-ai/covia:latest`, or see [Venue Quick Start](../../operator-guide/venue-start)) and an LLM API key — the examples use OpenAI, but any [backend](../agents/llm-backends) works, including a local Ollama with no key at all.

All the calls below go to `POST /api/v1/invoke`. Operations are referenced by their **catalog path** (`v/ops/covia/write`, `v/ops/agent/create`) — the short `covia:write` style you'll see in prose is the operation's name, not an invokable reference. You can equally drive every step from Claude over MCP using the snake_case tool names (see the [previous tutorial](./claude-mcp)).

## 1. Give the venue an LLM key

Store the key in the venue's secret store. It's resolved at invocation time and never appears in job records:

```json
POST /api/v1/invoke
{ "operation": "v/ops/secret/set", "input": { "key": "OPENAI_API_KEY", "value": "sk-..." }, "wait": true }
```

## 2. Seed your workspace

Every caller gets a private, persistent namespace on the venue. `w/` is your workspace — write a couple of project records:

```json
{ "operation": "v/ops/covia/write",
  "input": { "path": "w/projects/apollo",
             "value": { "name": "Apollo", "status": "active", "budget": 120000, "lead": "Dana" } },
  "wait": true }
```

```json
{ "operation": "v/ops/covia/write",
  "input": { "path": "w/projects/borealis",
             "value": { "name": "Borealis", "status": "on-hold", "budget": 45000, "lead": "Sam" } },
  "wait": true }
```

`covia:list` confirms what's there without fetching the values:

```json
{ "operation": "v/ops/covia/list", "input": { "path": "w/projects" }, "wait": true }
```

```json
{ "type": "Map", "keys": ["apollo", "borealis"], "totalSize": 2, "exists": true }
```

## 3. Meet `covia:inspect` — the discovery tool

`covia:inspect` is how both you *and your agents* find your way around: a **budget-bounded preview** of any lattice path that shows shape, types, and sizes without flooding the context window. Elided content is annotated so you know where to drill in next.

Inspect the venue's virtual namespace:

```json
{ "operation": "v/ops/covia/inspect", "input": { "paths": "v", "budget": 400 }, "wait": true }
```

```json5
{test: {ops: {/* +15 more, 9.8KB */}}, ops: {/* +21 more, 129KB */}, info: {/* 6 keys, 13KB */}, /* +1 more, 163KB */}
```

And your own workspace:

```json
{ "operation": "v/ops/covia/inspect", "input": { "paths": "w", "budget": 300 }, "wait": true }
```

```json5
{projects: {apollo: {lead: "Dana", status: "active", name: "Apollo", budget: 120000}, /* ... */}}
```

The progressive pattern — `inspect` broadly, `inspect` deeper with a bigger budget, then `read` the exact value — is precisely how an LLM agent explores data without burning its context. That's why it's the first tool to give an agent.

Your full namespace map:

| Prefix | Contents |
|--------|----------|
| `w/` | Your workspace — structured, persistent data |
| `o/` | Operation pins — short names for operations you use often |
| `g/` | Your agents — config, sessions, tasks, timeline |
| `j/` | Job log — auto-populated as you invoke operations |
| `a/` | Content-addressed assets |
| `n/` | Named references · `t/` transient scratch |
| `v/ops/`, `v/info/` | Venue catalog and introspection (read-only, shared) |

## 4. Create an agent

```json
{ "operation": "v/ops/agent/create",
  "input": {
    "agentId": "Scribe",
    "config": {
      "systemPrompt": "You are Scribe. You analyse the data in the workspace and write clear, concise reports.",
      "tools": ["v/ops/covia/inspect", "v/ops/covia/read", "v/ops/covia/list", "v/ops/covia/write"]
    }
  },
  "wait": true }
```

```json
{ "created": true, "agentId": "Scribe", "updated": false, "status": "SLEEPING" }
```

Unspecified config gets sensible defaults — the `v/ops/llmagent/chat` transition and the `v/ops/langchain/openai` backend. The `tools` array is the agent's palette: we've given Scribe the same workspace operations you just used, so it explores and writes data exactly the way you do.

## 5. The agent is data — inspect it

Here's the part that makes Covia agents different. Scribe is not a process hidden inside a runtime — it's a record at `g/Scribe` in *your* namespace, and `covia:inspect` works on it like anything else:

```json
{ "operation": "v/ops/covia/inspect", "input": { "paths": "g/Scribe", "budget": 600, "compact": false }, "wait": true }
```

```json5
{
  timeline: [],
  sessions: {},
  tasks: {},
  status: "SLEEPING",
  config: {
    operation: "v/ops/llmagent/chat",
    systemPrompt: "You are Scribe. You analyse the data in the workspace and write clear, concise reports.",
    llmOperation: "v/ops/langchain/openai",
    tools: ["v/ops/covia/read", "v/ops/covia/list", "v/ops/covia/inspect", "v/ops/covia/write"]
  }
}
```

Empty timeline, no sessions, no tasks — a newborn agent, fully transparent.

## 6. Give it work

`agent:request` sends a tracked task. It waits up to `timeout` ms for the agent to finish; on timeout you get a snapshot with a job id to poll via `v/ops/grid/jobResult`:

```json
{ "operation": "v/ops/agent/request",
  "input": {
    "agentId": "Scribe",
    "input": { "task": "Explore w/projects with covia_inspect, read the project records, and write a one-paragraph status report to w/reports/projects." },
    "timeout": 60000
  },
  "wait": true }
```

While you wait, Scribe is running its loop: assemble context → call the LLM → execute the tool calls it asks for (`covia_inspect`, `covia_read`, `covia_write`) → repeat until done. Tool names are the snake_case forms of the operations in its config.

## 7. See what it did

The report is in your workspace:

```json
{ "operation": "v/ops/covia/read", "input": { "path": "w/reports/projects" }, "wait": true }
```

And the agent's record now tells the story — inspect `g/Scribe` again and you'll find a session with the conversation, and a timeline entry recording the run: when it started and ended, which transition ran, what tasks it processed, and what it produced. `agent:info` gives the quick summary:

```json
{ "operation": "v/ops/agent/info", "input": { "agentId": "Scribe" }, "wait": true }
```

This is the audit trail working for free: every run the agent ever makes is appended to its timeline, and every operation it invoked is a job in `j/`. Nothing about what your agent did is opaque.

## 8. Scope it with capabilities

Right now Scribe can touch anything in your namespace. Give it only what its role needs by adding [capabilities](../capabilities) to the config:

```json
"caps": [
  { "with": "w/projects/", "can": "crud/read" },
  { "with": "w/reports/",  "can": "crud" }
]
```

With caps set, every tool call the agent makes is checked: read-only on the source data, full access to its own output area, and nothing else. A denied call returns a **structural** error that tells the agent what it holds and that retrying won't help — so it adapts instead of looping. Update a live agent with `v/ops/agent/update`.

## Go further

- **Templates** — skip hand-written config: `"config": "template:worker"` resolves from the venue catalog at `v/agents/templates/`. See [Creating Agents](../agents/creating-agents#templates).
- **Converse** — `v/ops/agent/chat` holds a multi-turn conversation on a [session](../agents/sessions); echo the returned `sessionId` to continue the thread.
- **Typed outputs** — pass a `responseSchema` on `agent:request` for schema-enforced results, or use the [Goal Tree](../agents/goal-tree) adapter for hierarchical task decomposition.
- **Drive it all from Claude** — every operation here is an MCP tool (`agent_create`, `agent_request`, `covia_inspect`, …). Connect Claude via the [previous tutorial](./claude-mcp) and have it build and manage the agents.

## Related

- [Agents Overview](../agents/) — the three-level architecture
- [Sessions](../agents/sessions) — how conversations and tasks flow through an agent
- [Agent Operations](../agents/operations) — the full lifecycle reference
- [Capabilities](../capabilities) — the UCAN model behind `caps`
