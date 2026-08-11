---
title: Agents
sidebar_label: Agents
sidebar_position: 4
---

# Agents

Covia agents are **persistent, governed AI actors** that live on a [venue](./venues). An agent is not a chat window: it is a durable record with configuration, conversation [sessions](../user-guide/agents/sessions), a task queue, and an append-only timeline of every run. It calls tools, picks up skills mid-task, remembers across restarts, and delegates work to other agents — on its own venue or across the [Grid](./grid) — with every step landing in an audit-grade job record.

This page tours the agentic suite; the [user guide](../user-guide/agents/) covers each piece in depth.

## Equipping an agent

### Tools

Every operation in a venue's catalog is a potential tool. Operations are self-describing — JSON Schema in and out — so the same capability serves human developers and LLMs alike: list it in the agent's `config.tools` and it is presented to the model under a snake_case name (`v/ops/covia/read` becomes `covia_read`). Agents are not limited to their configured set: a [Goal Tree](../user-guide/agents/goal-tree) agent can call `more_tools` to discover what else its venue offers. Every call is capability-checked at invocation, whatever route it arrived by.

→ [Tools and Context](../user-guide/agents/tools-and-context) · [Calling MCP tools](../user-guide/mcp/calling-mcp-tools)

### Skills

A **skill** is a named bundle of instructions, context, and tools that an agent loads on demand. Instead of pinning every procedure into the configuration and paying for it on every turn, a well-built agent starts lean and carries a one-line index of skills it can acquire when a task needs them (`skill_load`). Skills are ordinary assets — content-addressed and portable, so you can write one in your workspace and hand it to any agent on any venue. Loading a skill grants no authority: its tools are still capability-checked like any other.

→ [Teach an Agent a New Skill](../user-guide/tutorials/skills) · [Skills reference](../user-guide/agents/tools-and-context#skills) · [COG-18](../protocol/cogs/COG-018)

### Context

Each turn, the context builder reassembles the agent's input from scratch: system prompt, tools, pinned context entries, loaded paths, pending results, and the session conversation. Agents manage their own working set with `context_load` and `context_unload`, every entry carries a byte budget with budget-aware rendering, and the Goal Tree adapter compacts automatically under pressure — so context is an engineered, inspectable resource rather than an ever-growing transcript.

→ [Context assembly](../user-guide/agents/tools-and-context#context-assembly-pipeline) · [Context budgets](../user-guide/agents/tools-and-context#context-budgets)

### Memory

Agent state is durable by construction. [Sessions](../user-guide/agents/sessions) hold conversation threads that persist across runs; tasks survive venue restarts; the timeline records every completed run. Beyond the conversation, agents read and write the venue's lattice through well-defined namespaces — `w/` for the user's workspace, `n/` for the agent's private notes, `a/` for immutable assets — so memory is queryable, governed state, not an opaque blob. The same machinery gives a connected AI assistant persistent memory on infrastructure you control.

→ [Sessions](../user-guide/agents/sessions) · [Lattice namespaces](../user-guide/agents/tools-and-context#lattice-namespaces) · [Give Claude persistent memory](../user-guide/tutorials/claude-mcp)

## Connecting and extending

### Connectors

Every venue is an **MCP server** and an **A2A agent** out of the box — no gateway, no extra deployment. Add a venue to claude.ai or Claude Desktop as a custom connector and its operations appear as tools; point any A2A-speaking framework at it and it responds as an agent. One capability, published once, reachable from every protocol the ecosystem already uses.

→ [Venues as MCP servers](../user-guide/mcp/venues-as-mcp-servers) · [Covia with A2A](../user-guide/adapters/covia-with-a2a) · [Give Claude your own tools in 5 minutes](../user-guide/tutorials/claude-mcp)

### Adapters

Adapters are how a venue gets its capabilities: each contributes a family of operations — LLM calls, outbound HTTP, files, secrets, scheduling, lattice state, federation, and more. Out of the box a venue ships with around twenty, and they compose: an agent can call an LLM, fetch a URL, and schedule its own wake-up through one uniform interface.

→ [Adapters overview](../user-guide/adapters/)

### Plugins

The capability surface is pluggable at every level. Operators extend a venue with their own adapters; **bridging** mirrors or curates an external MCP server's tools into the venue's catalog, where they behave exactly like native operations — discoverable, capability-scoped, and audited; and skills package higher-level know-how that agents load at run time. Extending a venue never means forking it.

→ [Bridging MCP tools](../user-guide/mcp/calling-mcp-tools#bridging-mcp-tools-into-the-catalog) · [Adapters overview](../user-guide/adapters/)

### Federation

Agents do not stop at the venue boundary. The [Grid adapter](../user-guide/adapters/grid-adapter) invokes operations on remote venues exactly as if they were local, and the [orchestrator](../user-guide/adapters/orchestrator) runs multi-step workflows that span them — while each party's data stays under its own governance and only results cross the boundary. Multi-agent systems can therefore span organisations: your agent, a partner's venue, a third party's model, one auditable workflow.

→ [The Grid](./grid) · [Federate two venues](../user-guide/tutorials/federation) · [COG-12: Orchestrations](../protocol/cogs/COG-012)

## Governed by default

None of the above is bolted on to an ungoverned core. Agents run under [capability](../user-guide/capabilities) grants — signed, attenuable, enforced on every call — with their permissions disclosed in the system prompt and explained in every denial. Each run is a job with an immutable record, and a workflow can pause for human review or a capability grant ([COG-16](../protocol/cogs/COG-016)) inside the same audit trail. The suite is comprehensive precisely because the governance is uniform: one model of identity, authority, and audit underneath every tool an agent touches.

## Start here

[Running Agents tutorial](../user-guide/tutorials/running-agents) · [Creating Agents](../user-guide/agents/creating-agents) · [Agents user guide](../user-guide/agents/) · [COG-11: Agent Lifecycle](../protocol/cogs/COG-011)
