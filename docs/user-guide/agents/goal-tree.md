---
title: Goal Tree
sidebar_position: 5
---

# Goal Tree

The Goal Tree adapter (`goaltree:chat`) provides hierarchical goal decomposition for complex agent tasks. The agent pursues goals via a **frame stack** — each subgoal opens a child frame with its own scoped conversation, and results propagate back to the parent.

## How It Works

```
Root Goal: "Process this invoice"
├── Subgoal: "Extract line items"        → complete({items: [...]})
├── Subgoal: "Look up vendor"            → complete({vendor: {...}})
└── Subgoal: "Validate totals"           → complete({valid: true})
→ complete({invoice: {...}, status: "validated"})
```

Each frame has its own conversation with the LLM. When a `subgoal` tool is called:

1. A new child frame opens with the subgoal description
2. The child frame runs its own tool call loop
3. The child calls `complete` or `fail` (or returns text for implicit complete)
4. Control returns to the parent with the result

Ancestor frames are visible as progressively summarised context — the parent at ~300 bytes, the grandparent at ~150 bytes, and so on.

## Configuration

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "processor",
    "config": {
      "operation": "v/ops/goaltree/chat",
      "systemPrompt": "You are an invoice processor...",
      "model": "gpt-4o",
      "tools": ["v/ops/covia/read", "v/ops/covia/write"],
      "defaultTools": false,
      "outputs": {
        "complete": {
          "schema": {
            "type": "object",
            "properties": {
              "invoice": { "type": "object" },
              "status": { "type": "string", "enum": ["validated", "rejected"] }
            },
            "required": ["invoice", "status"],
            "additionalProperties": false
          }
        }
      }
    }
  }
}
```

## Harness Tools

The Goal Tree provides built-in harness tools that the agent opts in to via `config.tools`:

### subgoal

Open a child frame to pursue a sub-task.

```json
{ "name": "subgoal", "input": { "description": "Extract line items from the invoice" } }
```

The child inherits all parent tools, loaded context paths, and tool definitions. Its conversation is independent — the parent doesn't see it. Returns `{status: "complete", result: ...}` or `{status: "failed", error: ...}`.

### complete

Finish the current goal with a result.

```json
{ "name": "complete", "input": { "invoice": {...}, "status": "validated" } }
```

If `config.outputs.complete.schema` is defined, the input is validated against that schema using the LLM's strict structured output mode.

A text-only response (no tool calls) implicitly completes the goal — no explicit `complete` call needed.

### fail

Finish the current goal with an error.

```json
{ "name": "fail", "input": { "reason": "Vendor not found", "details": "..." } }
```

If `config.outputs.fail.schema` is defined, the input is validated against that schema.

### compact

Checkpoint a long conversation to free context space.

```json
{ "name": "compact", "input": { "summary": "Extracted 12 line items totalling £4,250..." } }
```

Archives the current live turns into a segment with the LLM's summary. The conversation starts fresh while the archived segment remains accessible at reduced detail.

The harness manages compaction pressure automatically:
- At **70%** of context budget: suggests compaction
- At **90%**: warns compaction is required
- Beyond 90%: truncates oldest live turns (still in lattice, just not in active context)

### context_load / context_unload

Load or unload lattice paths into persistent context. Same behaviour as in [LLM Agent](./llm-agent).

### more_tools

Discover additional operations available on the venue beyond what's in the agent's config.

## Typed Outputs

When `config.outputs` is set, the `complete` and `fail` tools enforce strict JSON schemas. This uses the LLM's structured output mode (e.g., OpenAI's `strict: true`) to guarantee the output conforms to the schema.

```json
"outputs": {
  "complete": {
    "schema": {
      "type": "object",
      "properties": {
        "decision": { "type": "string", "enum": ["approve", "reject", "escalate"] },
        "reason": { "type": "string" },
        "amount": { "type": "number" }
      },
      "required": ["decision", "reason", "amount"],
      "additionalProperties": false
    }
  }
}
```

Without `outputs`, the `complete` tool accepts any JSON object.

## Differences from LLM Agent

| Feature | LLM Agent | Goal Tree |
|---------|-----------|-----------|
| Conversation model | Flat history | Hierarchical frame stack |
| Subgoals | Not supported | Built-in `subgoal` tool |
| Context from ancestors | N/A | Progressive summarisation |
| Typed outputs | Not supported | `complete`/`fail` with JSON Schema |
| Compaction | Not supported | Built-in `compact` tool |
| Implicit complete | N/A | Text response auto-completes |
| Best for | Simple conversation | Complex multi-step tasks |

## Patterns

### Divide and Conquer

The agent breaks a complex task into subgoals, each handled independently:

```
Root: "Audit the quarterly report"
├── Subgoal: "Check revenue figures"
├── Subgoal: "Verify expense categories"
├── Subgoal: "Cross-reference with bank statements"
└── Synthesise results → complete({...})
```

### Iterative Refinement

The agent uses subgoals to try different approaches:

```
Root: "Classify this document"
├── Subgoal: "Try keyword-based classification" → fail("ambiguous")
├── Subgoal: "Try semantic analysis" → complete({category: "invoice"})
└── Use successful result → complete({...})
```

### Long-Running Analysis

For tasks that generate extensive conversation, use `compact` to manage context:

```
Root: "Analyse all 50 vendor records"
├── Process vendors 1-10, compact("Processed 10 vendors, 3 flagged...")
├── Process vendors 11-20, compact("Processed 20 vendors, 5 flagged...")
├── ... continue with full context budget available each batch
└── complete({flagged: [...], summary: "..."})
```

## Related

- [LLM Agent](./llm-agent) — simpler conversational model
- [Creating Agents](./creating-agents) — configuration and templates
- [Tools and Context](./tools-and-context) — tool resolution, budgets, context loading
