---
title: Skills
sidebar_label: Skills
sidebar_position: 6
---

# Skills

Most agent frameworks make you decide everything up front — every tool, every procedure, pinned into the configuration and paid for on every turn. Covia agents learn on the job. A **skill** is a named bundle of instructions, context, and tools that an agent picks up mid-task, uses, and puts down again.

## Package any grid operation

This is what makes Covia skills unusual: the tools a skill carries are **grid operations**. A skill doesn't just tell an agent how to do something — it hands over the working capability itself: an LLM call, an outbound HTTP request, a scheduled wake-up, a workflow, an operation hosted on a partner's venue across the [Grid](./grid). Anything a venue can do, a skill can teach. Know-how and capability travel as one artifact.

## Lean agents, expertise on demand

A well-built agent starts lean — a couple of read tools — and carries a one-line index of the skills within reach. When a task calls for more, the agent loads the skill, its instructions and tools join the working context under an explicit budget, and when the job is done the agent unloads it. No sprawling system prompts, no paying every turn for expertise used once.

## Write once, teach anywhere

A skill is an ordinary [asset](../protocol/cogs/COG-005): content-addressed and portable. Draft one in your workspace, publish it, and hand it to any agent on any venue. Edit it, and every agent carrying it picks up the change on its next turn. Venues ship with a skill library covering their own mechanisms, browsable by anyone — no agent, no authentication required.

## Powerful, not privileged

Loading a skill grants no authority. Its tools are [capability-checked](../user-guide/capabilities) at invocation exactly like everything else, so an agent can carry a powerful skill and still act only within its grant. Teach freely; governance holds.

## Go deeper

[Teach an Agent a New Skill](../user-guide/tutorials/skills) · [Skills reference](../user-guide/agents/tools-and-context#skills) · [COG-18: Skills](../protocol/cogs/COG-018)
