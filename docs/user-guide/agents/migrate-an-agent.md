---
sidebar_position: 9
title: Migrate an agent
---

# Migrate an agent

You do not have to rebuild an agent to move it onto Covia. If you already run
one elsewhere, you can bring its **system prompt** and its **skills** across and
stand up a native Covia agent from them in one step. Once it is native, it runs
on your venue's own agent loop and inherits the grid: every task becomes a
governed job with a receipt, it is discoverable and composable, and it can take
part in workflows across venues.

This is the counterpart to [Bring your own agent](./bring-your-own-agent), which
leaves the agent where it runs and reaches it over A2A. Migrating instead
recreates the agent **on** Covia. Pick whichever fits: connect it, or move it
in.

:::note[What comes across today]
A migrated agent brings its **system prompt** and its **SKILL.md skills** (the
[Anthropic Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
format that Claude and a growing number of frameworks already use). Its
**tools** and **memory** are not migrated yet, and are on the roadmap.
:::

## In the dashboard

The quickest way is the **Port an agent** flow.

1. Open **Agents → Create**, and choose **Port an agent** under "Other options".
2. Give the agent a **name**. It is created at `g/<name>` in your namespace.
3. Paste its **system prompt**.
4. Paste each **SKILL.md** into the skills box and press **Add skill**. Covia
   reads the frontmatter and previews the skill's name and description, so you
   can see what will be imported before you commit.
5. Press **Port agent**. Covia imports each skill into your `w/skills`, creates
   the native agent that indexes them, and opens its chat so you can try it
   straight away.

## With the operation

The same thing is one operation, `agent:from-skills`, which you can call from
the SDK, the CLI, or any A2A or REST client. It composes the underlying
`skills:import` and `agent:create` operations, so both their capability checks
apply: importing needs write access to the skillset, and creating needs
agent-create authority in your namespace.

```bash
curl -X POST https://venue-3.covia.ai/api/v1/invoke \
  -H "Authorization: Bearer <your venue jwt>" -H "Content-Type: application/json" \
  -d '{"operation": "v/ops/agent/from-skills",
       "input": {
         "agentId": "refund-bot",
         "systemPrompt": "You are Acme'\''s support agent. Follow the refund policy skill exactly.",
         "skills": [
           { "text": "---\nname: refund-policy\ndescription: How to handle refund requests.\n---\n\n# Refund policy\n..." }
         ]
       }}'
```

Each entry in `skills` is either an inline SKILL.md as `{ "text": "..." }`, or a
reference to one as a string (`file://<root>/<dir>/SKILL.md`,
`dlfs/<drive>/<path>`, or an asset `a/<hash>`). The operation returns the
created agent along with `importedSkills` (where each skill now lives) and the
`skillset` they were imported into.

TypeScript:

```typescript
await venue.operations.run("v/ops/agent/from-skills", {
  agentId: "refund-bot",
  systemPrompt: "You are Acme's support agent. Follow the refund policy skill exactly.",
  skills: [{ text: skillMarkdown }],
});
```

Optional fields let you pick the transition (`operation`), the model
(`llmOperation` for bring-your-own-model, or `model`), a different `skillset`,
and any further `config` that `agent:create` accepts.

## What you get

Because the result is an ordinary native agent, it gets everything a native
agent gets:

- **Governed** so every task is a job with a verifiable receipt on your venue.
- **Discoverable and composable** as an ordinary asset other agents and
  workflows can reach.
- **Interoperable** over A2A and MCP with no rewrite.
- **Durable and resumable** with no framework timeout on its tasks.
- **Federated** across venues on the grid.

## Related

- [Bring your own agent](./bring-your-own-agent) — connect an agent over A2A
  instead of moving it in
- [Creating agents](./creating-agents) — the full agent configuration model
- [Tools and context](./tools-and-context) — how skills, tools and context
  shape an agent
