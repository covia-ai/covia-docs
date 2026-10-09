---
title: Migrate an Agent's Skills
sidebar_position: 3
---

# Migrate an agent's skills

Use `v/ops/agent/from-skills` to create a native Covia agent from a system prompt
and existing `SKILL.md` files. The operation imports the skills into your
workspace and configures the new agent to discover them on Covia's run loop.
It does not migrate a source framework's tools, memory or running sessions.

You need an authenticated caller authorised to create an agent and write the
destination skillset. Choose an unused agent name. Imported skill instructions
do not grant permissions: tools still need valid Covia operation bindings and
the caller's capabilities.

## Create the agent

Send this to `POST /api/v1/invoke` with your usual venue authentication:

```json
{
  "operation": "v/ops/agent/from-skills",
  "wait": true,
  "input": {
    "agentId": "support-agent",
    "systemPrompt": "Help customers using the refund and greeting skills.",
    "operation": "v/ops/llmagent/chat",
    "skillset": "w/skills/support",
    "skills": [
      {"text": "---\nname: refunds\ndescription: Explain the refund window.\n---\nRefunds are allowed within 30 days.\n"},
      {"text": "---\nname: greeting\ndescription: Greet customers.\n---\nGreet the customer by name when known.\n"}
    ]
  }
}
```

Each skill can instead be a source reference, for example
`file://work/refunds/SKILL.md`, `dlfs/drive/refunds/SKILL.md` or `a/<asset-hash>`.
File references require a configured and authorised file root. Inline entries
use `text`, not `content`, for the SKILL.md body.

The result includes the agent's address, `skillset` and `importedSkills` paths.
The agent discovers skill summaries and can load their instructions when useful.
Imports are sequential: a failure can leave previously imported skills, even
though no agent is created. Existing agent names are rejected.

## Choose a model and send a turn

Add `llmOperation` to the creation input to choose an available model operation;
otherwise the venue's configured default applies. See [LLM Backends](./llm-backends)
for provider setup and [Creating Agents](./creating-agents) for additional `config`
options. Provider credentials are supplied separately through the venue's secret
mechanism; never copy them into the system prompt or skill text.

```json
{
  "operation": "v/ops/agent/chat",
  "wait": true,
  "input": {
    "agentId": "support-agent",
    "message": "Hello, I am Sam. What is the refund window?"
  }
}
```

## Verify migration without an LLM

On a development venue with test operations enabled, set
`llmOperation: "v/test/ops/llm"` during creation. The deterministic stub echoes a
turn through the native agent loop without API keys or provider calls. It checks
wiring, not whether a model follows the imported instructions.

Covia's `AgentFromSkillsTest` imports two skills, checks their discovery and runs
a chat turn using this stub. Run it from the Covia checkout:

```shell
mvn test -pl venue -am -Dtest=AgentFromSkillsTest -Dsurefire.failIfNoSpecifiedTests=false
```
