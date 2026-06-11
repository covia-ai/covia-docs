---
title: LLM Backends
sidebar_position: 7
---

# LLM Backends

The Level 3 LLM call is a stateless operation that sends messages and tool definitions to a language model and returns the response. Covia is **model-agnostic** — it talks to several providers through the LangChain adapter, and the choice of provider and model is yours. The models shown below are illustrative examples, not recommendations.

## Available Backends

| Operation | Provider | Notes |
|-----------|----------|-------|
| `v/ops/langchain/openai` | OpenAI | Supports structured outputs (strict JSON schema). Also the route for any OpenAI-compatible endpoint (see below). |
| `v/ops/langchain/anthropic` | Anthropic | Claude models via the native Anthropic API. |
| `v/ops/langchain/ollama` | Ollama | Local models. Requires Ollama running and reachable from the venue host. No API key. |
| `v/ops/langchain/xai` | xAI (Grok) | Pre-configured OpenAI-compatible operation pointed at `https://api.x.ai/v1`. |

Each operation supplies a **default model** when you don't set one, but you can pass any model the provider supports via the `model` field. Current defaults are:

| Backend | Default model | Secret |
|---------|---------------|--------|
| OpenAI | `gpt-5.4-mini` | `OPENAI_API_KEY` |
| Anthropic | `claude-sonnet-4-5` | `ANTHROPIC_API_KEY` |
| Ollama | `qwen` | _(none)_ |
| xAI | `grok-4` | `XAI_API_KEY` |

### OpenAI-compatible providers

Many providers (xAI, DeepSeek, Google Gemini, local gateways) expose an OpenAI-compatible API. Reach them through `v/ops/langchain/openai` by setting the `url` (and the appropriate secret):

```json
{
  "llmOperation": "v/ops/langchain/openai",
  "model": "deepseek-chat",
  "url": "https://api.deepseek.com/v1"
}
```

`v/ops/langchain/xai` is simply this pattern packaged as a named operation.

## Configuration

Set the backend via `llmOperation` in agent config. The `model` is optional — omit it to use the backend default:

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "claude-agent",
    "config": {
      "llmOperation": "v/ops/langchain/anthropic",
      "model": "claude-sonnet-4-5",
      "systemPrompt": "You are a helpful assistant."
    }
  }
}
```

### Secrets

API keys are resolved from the per-user secret store at invocation time — they are never stored in job records. Set one with:

```json
{ "operation": "v/ops/secret/set", "input": { "key": "OPENAI_API_KEY", "value": "sk-..." } }
```

A backend that needs a key but can't resolve one **fails fast** with a clear error naming the secret it looked for (e.g. `s/OPENAI_API_KEY`) — it does not silently fall back. Ollama needs no key.

### Structured outputs

When an agent uses typed outputs (Goal Tree `outputs` config, a per-request `responseSchema`, or `responseFormat`), the OpenAI backend enables strict JSON-schema mode so the response conforms to the schema. See [Creating Agents](./creating-agents) and [Goal Tree](./goal-tree).

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

You may pass a single `prompt` string and/or `systemPrompt` instead of a full `messages` array.

**Response:**

```json
{
  "role": "assistant",
  "content": "The weather is sunny.",
  "toolCalls": null,
  "tokens": { "input": 42, "output": 128, "total": 170 },
  "finishReason": "stop"
}
```

`tokens` and `finishReason` are surfaced when the provider reports them. If `toolCalls` is present, the Level 2 adapter executes them and calls the LLM again.

## Related

- [Creating Agents](./creating-agents) — agent configuration reference
- [LLM Agent](./llm-agent) — how the Level 2 transition manages the tool call loop
