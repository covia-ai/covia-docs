---
title: LLM Backends
sidebar_position: 7
---

# LLM Backends

The Level 3 LLM call is a stateless operation that sends messages and tool definitions to a language model and returns the response. Covia is **model-agnostic** — it talks to several providers through the LangChain adapter, and the choice of provider and model is yours. The default models below are what a backend uses when you don't set `model` — a fallback, not a recommendation.

## Available Backends

Each provider has its own named operation, so you select one by reference rather than by assembling a URL:

| Operation | Provider | Default model | Secret |
|-----------|----------|---------------|--------|
| `v/ops/langchain/openai` | OpenAI | `gpt-5.6-terra` | `OPENAI_API_KEY` |
| `v/ops/langchain/anthropic` | Anthropic | `claude-sonnet-5` | `ANTHROPIC_API_KEY` |
| `v/ops/langchain/gemini` | Google Gemini | `gemini-3.6-flash` | `GOOGLE_API_KEY` |
| `v/ops/langchain/xai` | xAI (Grok) | `grok-4.3` | `XAI_API_KEY` |
| `v/ops/langchain/deepseek` | DeepSeek | `deepseek-v4-flash` | `DEEPSEEK_API_KEY` |
| `v/ops/langchain/mistral` | Mistral | `mistral-medium-latest` | `MISTRAL_API_KEY` |
| `v/ops/langchain/openrouter` | OpenRouter | `openrouter/auto` | `OPENROUTER_API_KEY` |
| `v/ops/langchain/ollama` | Ollama (local) | `qwen` | *(none)* |

Pass any model the provider supports via the `model` field. OpenRouter takes any vendor-prefixed model id (`anthropic/claude-sonnet-5`, `google/gemini-3.5-flash`), and `openrouter/auto` delegates the choice to the router.

### Discovering what a venue offers

Rather than hard-coding the table above, ask the venue:

```json
{ "operation": "v/ops/langchain/models" }
```

`langchain:models` reports each provider, its models, its recommendations by intent (`balanced`, `quality`, `economical`, `coding`, `reasoning`, `highVolume`), and the [`model` facet](#what-a-model-declares-about-itself) each operation declares — verbatim. That is what an agent should use when choosing a model, since it reflects the venue actually answering.

### OpenAI-compatible endpoints

Any other OpenAI-compatible provider or local gateway is reachable through `v/ops/langchain/openai` by setting `url`:

```json
{
  "llmOperation": "v/ops/langchain/openai",
  "model": "some-model",
  "url": "https://api.example.com/v1"
}
```

The named operations above are this pattern packaged, with the provider's own defaults and declared traits attached.

## Configuration

Set the backend via `llmOperation` in agent config. The `model` is optional — omit it to use the backend default:

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "claude-agent",
    "config": {
      "llmOperation": "v/ops/langchain/anthropic",
      "model": "claude-sonnet-5",
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

### Sampling parameters

`temperature` and `topP` in the op input pass through to every backend —
`temperature: 0` gives (near-)deterministic output for extraction pipelines.
Omitted parameters use the provider's defaults. `maxTokens` bounds the output
on the Anthropic backend (its API requires a bound; the client default
applies otherwise).

### Where Ollama lives (Docker vs host)

When the op input carries no `url`, the Ollama base URL resolves venue-side:
`adapters.langchain.ollamaUrl` in venue config, then the `OLLAMA_BASE_URL`
environment variable, then `http://localhost:11434`. Keep agents
topology-agnostic — set the venue-level knob, not per-agent URLs:

| Topology | Setting |
|----------|---------|
| Host venue + host Ollama | nothing — the localhost default works |
| Docker venue + host Ollama | `adapters.langchain.ollamaUrl` (or `OLLAMA_BASE_URL`) = `http://host.docker.internal:11434`, and start Ollama with `OLLAMA_HOST=0.0.0.0 ollama serve` |
| Both in one compose network | `http://<ollama-service-name>:11434` |

A connect failure names the resolved URL and this knob — if you see
`Ollama not reachable at http://localhost:11434` from a containerised venue,
that's the second row.

### Structured outputs

When an agent uses typed outputs (Goal Tree `outputs` config, a per-request `responseSchema`, or `responseFormat`), the OpenAI backend enables strict JSON-schema mode so the response conforms to the schema. See [Creating Agents](./creating-agents) and [Goal Tree](./goal-tree).

## What a model declares about itself

Providers differ in ways that change how a prompt must be **shaped** and **sized**. Those facts are declared as data on the LLM operation asset — a `model` facet beside the `operation` facet — rather than branched on by provider name in code:

```json
{
  "name": "Anthropic Chat",
  "operation": { "adapter": "langchain:anthropic" },
  "model": {
    "options": { "systemMessages": "single", "requiresUserMessage": true, "cachePrefix": true },
    "budget": { "bytes": 400000 }
  }
}
```

| Option | Meaning |
|--------|---------|
| `systemMessages` | `"multiple"` (the norm), `"single"` (one system parameter, no system role in the message list), or `"none"` (system content folded into the first user message) |
| `requiresUserMessage` | The request is rejected without at least one non-system message |
| `cachePrefix` | The provider caches an explicitly marked stable prefix |
| `toolCalling` | `false` declares a model that cannot call tools — `agent:create` warns when an agent declares tools or skills against it |
| `toolCallingByModel` | Tool support varies per model, so it is probed where the provider advertises capabilities (Ollama) |
| `labels` | `"bracket"` (default), `"xml"` or `"header"` — the dialect context elements are labelled in |

`budget.bytes` is an estimate of the context size appropriate for the model, in UTF-8 bytes — what the assembler targets, not the hard window the provider enforces. It is the **only** context budget the agent runtime uses (see [Context Budgets](./tools-and-context#context-budgets)). `byModel` carries the same shape again, keyed by model id, layered over the provider-level values one key deep — which is how one OpenRouter or Ollama operation serves models of very different sizes.

Everything in the facet is optional: an absent facet means the OpenAI-compatible norm, so a provider declares only what *differs*.

## Prompt caching

On Anthropic, caching is end to end and automatic. The assembler marks its band boundaries — tool definitions, the system slot, the conversation as it stood when the cycle began, and the tool loop so far — and the backend turns those marks into per-message `cache_control` breakpoints alongside the system prompt and tools.

Because [the section sequence is ordered by change frequency](./tools-and-context#bands), the cacheable prefix is large and stable by construction rather than by careful prompt-writing.

Usage reports `cacheRead` and `cacheWrite` tokens, which also roll up into the agent's cycle tally and the session's token totals. Pass `cache: false` on a call to switch caching off for it.

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

`tokens` and `finishReason` are surfaced when the provider reports them, with `cacheRead` / `cacheWrite` alongside them where the provider reports caching. If `toolCalls` is present, the Level 2 adapter executes them and calls the LLM again.

## Related

- [Creating Agents](./creating-agents) — agent configuration reference
- [LLM Agent](./llm-agent) — how the Level 2 transition manages the tool call loop
