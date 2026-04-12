---
title: LLM Backends
sidebar_position: 7
---

# LLM Backends

The Level 3 LLM call is a stateless operation that sends messages and tool definitions to a language model and returns the response. Covia supports multiple backends via the LangChain adapter.

## Available Backends

| Operation | Provider | Notes |
|-----------|----------|-------|
| `v/ops/langchain/openai` | OpenAI | Default. Supports structured outputs (`strict: true`). |
| `v/ops/langchain/anthropic` | Anthropic | Claude models via native Anthropic API. |
| `v/ops/langchain/ollama` | Ollama | Local models. Requires Ollama running on the venue host. |
| `v/ops/langchain/ollama_qwen3` | Ollama (Qwen3) | Qwen3-specific configuration for Ollama. |

## Configuration

Set the backend via `llmOperation` in agent config:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "claude-agent",
    "config": {
      "llmOperation": "v/ops/langchain/anthropic",
      "model": "claude-sonnet-4-20250514",
      "systemPrompt": "You are a helpful assistant."
    }
  }
}
```

### OpenAI

The default backend. Supports all OpenAI models and structured outputs.

```json
{
  "llmOperation": "v/ops/langchain/openai",
  "model": "gpt-4o"
}
```

**Structured outputs:** When an agent uses typed outputs (Goal Tree `outputs` config) or `responseFormat`, the OpenAI backend enables `strictJsonSchema` and `strictTools` to guarantee schema conformance.

**Secrets required:** `OPENAI_API_KEY` — set via the secrets manager:

```json
{ "operation": "secret:set", "input": { "key": "OPENAI_API_KEY", "value": "sk-..." } }
```

### Anthropic

Native Anthropic API integration for Claude models.

```json
{
  "llmOperation": "v/ops/langchain/anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

**Secrets required:** `ANTHROPIC_API_KEY`

### Ollama

Run local models via Ollama. The Ollama server must be accessible from the venue host.

```json
{
  "llmOperation": "v/ops/langchain/ollama",
  "model": "llama3.1"
}
```

No API key required — Ollama runs locally.

## Message Format

All backends use the same message format:

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is the weather?" },
    { "role": "assistant", "content": "I'll check that for you.", "toolCalls": [...] },
    { "role": "tool", "id": "call_123", "name": "weather_check", "content": "{...}" }
  ],
  "tools": [...],
  "responseFormat": { "name": "Response", "schema": {...} }
}
```

**Response:**

```json
{
  "role": "assistant",
  "content": "The weather is sunny.",
  "toolCalls": null
}
```

If `toolCalls` is present, the Level 2 adapter executes them and calls the LLM again.

## Related

- [Creating Agents](./creating-agents) — agent configuration reference
- [LLM Agent](./llm-agent) — how the Level 2 transition manages the tool call loop
