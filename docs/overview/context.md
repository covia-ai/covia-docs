---
title: Context
sidebar_label: Context
sidebar_position: 5
---

# Context

An agent is only as capable as the context you can put in front of it. Covia builds a **governed context layer** into every [venue](./venues): durable, structured state that agents read, write, and share — access-controlled down to the path, auditable at every touch, and open to any agent you choose to let in.

## A workspace for every user — and every agent

Every user gets a persistent workspace; every agent gets private notes of its own — alongside scratch space, immutable content-addressed assets, and encrypted secrets, all addressable as structured paths (`w/projects/apollo/status`) rather than opaque blobs. An agent picks up exactly where it left off after a restart, a redeploy, or a month of silence; two agents collaborate by working the same paths. This is not a bolt-on vector store — it is queryable, governed venue state with an audit trail.

## Any agent can plug in

The context layer is not reserved for agents hosted on the venue. Every venue is an [MCP server](../user-guide/mcp/), so external agents — Claude, or any MCP-capable assistant or framework — reach the same workspace as ordinary tools (`covia_read`, `covia_write`, …). Five minutes of setup gives Claude memory that survives the conversation, lives on infrastructure you control, and leaves a record of every access.

## Scope it, share it, delegate it

Read and write access are governed by [UCAN capabilities](../user-guide/capabilities): signed grants naming who may do what, to which paths. Grants attenuate as they are delegated — give an agent read-only access to `w/reports/`, hand a partner organisation write access to a single path, and nothing more. Every call is checked at the point of use, and a denial explains itself to the LLM instead of inviting retries. Delegation means context can safely cross trust boundaries: your data, their agent, your rules.

## Engineered for LLMs

For hosted agents the layer goes further: context is assembled fresh every turn under explicit budgets, agents load and unload exactly what a task needs, and [skills](./skills) bundle context with instructions and tools for expertise on demand. See [Agents](./agents) for the full suite.

## Go deeper

[Give Claude persistent memory](../user-guide/tutorials/claude-mcp) · [Tools and Context](../user-guide/agents/tools-and-context) · [Capabilities (UCAN)](../user-guide/capabilities) · [COG-3: Authentication Mechanisms](../protocol/cogs/COG-003)
