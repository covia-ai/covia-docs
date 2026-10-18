---
title: Remote Agent
sidebar_label: Remote Agent
description: Dispatch a task to a Covia agent on this or another venue. Mirrors the destination task as a local Job with continuation, progress, and cancellation.
---

# Remote Agent Adapter

A Covia agent is useful because it has durable state, tools, memory, and a working context. The `remoteagent` adapter lets another agent call it as a worker. `remoteagent:request` runs a task on a Covia agent that lives either on this venue or on a different one, mirrors the destination task as a local [Job](../../operator-guide/) so the caller can observe progress, continue an interrupted conversation, and cancel if needed, and returns the agent's output when it completes. The caller's identity, capability tokens, and session context all travel with the request.

Agent IDs in the examples below use the placeholder convention `g/my-<role>` (`my-agent`, `my-support-bot`, etc.) to signal "an agent you created". Substitute your own agent IDs.

## Operations

| Operation | Purpose |
|-----------|---------|
| `remoteagent:request` | Dispatch a task to a Covia agent. The adapter also handles `chat`-style invocations where the input is a message rather than a structured payload |

```json
{
  "operation": "v/ops/remoteagent/request",
  "input": {
    "agentId": "g/my-agent",
    "input": {
      "task": "Extract line items from w/my-inputs/invoice.pdf",
      "format": "structured"
    }
  }
}
```

Returns the worker's output when the destination task completes, with a local Job that mirrors the destination task's lifecycle. If the local Job is interrupted (venue restart, cancellation), the destination task's status is preserved and recoverable: see the local Job's record before retrying.

## Addressing a remote agent

The `agentId` field accepts four forms:

| Form | Meaning |
|------|---------|
| `my-agent` | A bare name resolves to the caller's own agent at `g/my-agent` |
| `g/my-agent` | Explicit path to the caller's agent |
| `/g/my-agent` | Equivalent explicit path |
| `did:web:venue-2.covia.ai/g/my-agent` | An agent on a different venue, addressed by its owner's DID |

The last form is how one venue invokes an agent on another. The remote venue resolves the DID, authenticates the caller through standard Covia federation, and runs the task under the caller's capability grants on the destination side.

## Session continuity

Pass `sessionId` to continue an existing conversation with the agent:

```json
{
  "operation": "v/ops/remoteagent/request",
  "input": {
    "agentId": "g/my-support-bot",
    "sessionId": "0x7a3f...",
    "input": {
      "message": "What was the resolution on the previous ticket?"
    }
  }
}
```

Omitting `sessionId` starts a fresh conversation. The returned Job carries the destination session ID in its data, so subsequent calls can thread back into the same conversation.

## Structural output handoff

For large or structured results, pass `outputPath`:

```json
{
  "input": {
    "agentId": "did:web:venue-1.covia.ai/g/my-transcriber",
    "input": { "task": "Transcribe a/0x3f.../audio.wav" },
    "outputPath": "w/my-pipeline/transcript"
  }
}
```

On successful completion, the framework writes the worker's full result to `w/my-pipeline/transcript` under the requester's captured authority and returns a small `{status, outputPath, bytes}` receipt instead of the payload. The payload itself never passes through the caller's job output, which keeps model context clean when the result is bulky. Failed or cancelled tasks write nothing. Remote `did:web` paths resolve through federation on the destination side.

## Response shape

Pass `responseSchema` to tell the worker the shape you expect:

```json
{
  "input": {
    "agentId": "g/my-analyst",
    "input": { "task": "Summarise w/my-notes/calls" },
    "responseSchema": {
      "type": "object",
      "properties": {
        "summary": { "type": "string" },
        "action_items": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["summary", "action_items"]
    }
  }
}
```

The schema is shown to the worker as the target output shape. It is advisory, not enforced: the worker's output is returned as-is; whether to validate against the schema is the caller's choice.

## Local vs remote protocols

Internally, the adapter uses two protocols: `covia-agent-local` when the destination agent lives on the same venue (optimised path, no network hop) and `covia-agent` when the destination is a different venue (federated). Both share the same interaction lifecycle, so caller code doesn't branch on destination.

## Access Control

The caller must have invoke authority on `remoteagent:request`. On the destination side (local or remote), the caller's capability token travels with the request and gates every tool the worker invokes. A remote agent that calls back into the caller's namespace does so under the capabilities the caller granted, not the destination venue's own authority.

## Related

- [Covia Venue Adapter](./covia): the lattice interface the worker uses to read inputs and write outputs
- [UCAN Adapter](./ucan): capability tokens that travel with every remote request
- [Agents on the Grid](../agents/): what a Covia agent is and how it processes a request
- [Bring your own agent](../agents/bring-your-own-agent): the counterpart for non-Covia agents reached over A2A or MCP
