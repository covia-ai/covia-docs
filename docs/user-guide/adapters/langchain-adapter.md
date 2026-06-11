---
id: langchain-adapter
title: LangChain Adapter
sidebar_label: LangChain
---

# LangChain Adapter

The LangChain adapter provides unified access to multiple LLM providers — OpenAI, Anthropic, Ollama, and xAI, plus any OpenAI-compatible endpoint — with a consistent interface for messages, tool calling, and structured output.

This adapter powers the Level 3 (LLM call) layer in the [agent architecture](/docs/user-guide/agents/#architecture). It can also be invoked directly for one-shot LLM calls. Covia is model-agnostic; the default models below are what a backend uses when you don't set `model`, not a recommendation.

## Backends

| Operation | Provider | Default Model | API Key Secret |
|-----------|----------|---------------|----------------|
| `langchain:openai` | OpenAI | `gpt-5.4-mini` | `OPENAI_API_KEY` |
| `langchain:anthropic` | Anthropic | `claude-sonnet-4-5` | `ANTHROPIC_API_KEY` |
| `langchain:ollama` | Ollama (local) | `qwen` | None required |
| `langchain:xai` | xAI (Grok) | `grok-4` | `XAI_API_KEY` |

Other OpenAI-compatible providers (DeepSeek, Google Gemini, gateways) work through `langchain:openai` by setting the `url` field — e.g. `"url": "https://api.deepseek.com/v1"`.

### Setting API Keys

Store API keys via the secrets manager:

```json
{ "operation": "secret:set", "input": { "key": "OPENAI_API_KEY", "value": "sk-..." } }
{ "operation": "secret:set", "input": { "key": "ANTHROPIC_API_KEY", "value": "sk-ant-..." } }
```

Keys are resolved from the caller's secret store at invocation time. A backend that requires a key but can't resolve one fails fast with an error naming the secret it expected — it does not silently continue.

## Usage

### Simple Prompt

```json
{
  "operation": "langchain:openai",
  "input": {
    "prompt": "What is the capital of France?",
    "model": "gpt-5.4-mini"
  }
}
```

**Response:** `{ "response": "The capital of France is Paris." }`

### Messages with System Prompt

```json
{
  "operation": "langchain:anthropic",
  "input": {
    "model": "claude-sonnet-4-5",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "Explain lattice technology in one paragraph." }
    ]
  }
}
```

**Response:**

```json
{
  "role": "assistant",
  "content": "Lattice technology is a mathematical framework..."
}
```

### Tool Calling

Provide tool definitions and the LLM can request tool calls:

```json
{
  "operation": "langchain:openai",
  "input": {
    "model": "gpt-5.4-mini",
    "messages": [
      { "role": "user", "content": "What's the weather in London?" }
    ],
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string" }
          },
          "required": ["city"]
        }
      }
    ]
  }
}
```

**Response:**

```json
{
  "role": "assistant",
  "toolCalls": [
    { "id": "call_abc123", "name": "get_weather", "arguments": { "city": "London" } }
  ]
}
```

To continue the conversation, execute the tool and send the result back:

```json
{
  "messages": [
    { "role": "user", "content": "What's the weather in London?" },
    { "role": "assistant", "toolCalls": [{ "id": "call_abc123", "name": "get_weather", "arguments": { "city": "London" } }] },
    { "role": "tool", "id": "call_abc123", "name": "get_weather", "content": "{\"temp\": 15, \"condition\": \"cloudy\"}" }
  ],
  "tools": [...]
}
```

### Structured Output

Request JSON output conforming to a schema:

```json
{
  "operation": "langchain:openai",
  "input": {
    "model": "gpt-5.4-mini",
    "messages": [
      { "role": "user", "content": "Extract the person's name and age from: 'Alice is 30 years old'" }
    ],
    "responseFormat": {
      "name": "PersonInfo",
      "schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "age": { "type": "integer" }
        },
        "required": ["name", "age"],
        "additionalProperties": false
      }
    }
  }
}
```

The OpenAI backend enables **strict mode** by default — the response is guaranteed to conform to the schema.

## Input Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | — | Simple prompt (alternative to `messages`) |
| `systemPrompt` | string | — | System message (with `prompt` mode) |
| `messages` | array | — | Conversation messages (system, user, assistant, tool) |
| `tools` | array | — | Tool definitions for function calling |
| `model` | string | Backend default | Model name override |
| `responseFormat` | string or object | `"text"` | `"text"`, `"json"`, or `{name, schema}` |
| `apiKey` | string | From secret store | Override API key |
| `url` | string | Backend default | Override API endpoint (use for OpenAI-compatible providers) |

Assistant responses also carry `tokens` (`{input, output, total}`) and `finishReason` when the provider reports them.

## Related

- [Agents: LLM Backends](/docs/user-guide/agents/llm-backends) — configuring backends for agents
- [Agents Overview](/docs/user-guide/agents/) — how LangChain fits in the agent architecture
