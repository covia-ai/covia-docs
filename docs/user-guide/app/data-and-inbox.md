---
sidebar_position: 4
title: Workspace, secrets, and the inbox
---

# Workspace, secrets, and the inbox

Three signed-in surfaces manage what you and your agents share: your lattice workspace, your encrypted secrets, and the human-in-the-loop inbox where agents ask you for answers and authority.

## Workspace

**Manage → Workspace** is a three-pane browser over your slice of the venue's lattice: pick a namespace, walk its tree, and view or edit values with a structured JSON editor. It shows all your namespaces even when empty:

| Namespace | Contents | Editable in the app |
| --------- | -------- | ------------------- |
| `w/` | Your durable workspace: notes, pins, skills, memory | Yes, one level deep and below |
| `j/` | Job records | Read-only (immutable audit trail) |
| `g/` | Your agents' state, sessions, timelines | Read-only |
| `a/` | Your content-addressed assets | Read-only |
| `o/` | Your named operation pins | Read-only |
| `s/` | Secret names | Values are never readable |
| `h/` | Human-in-the-loop requests | Via the Inbox |

Browsing is job-free (`GET /api/v1/values/*`); edits go through `covia:write` and `covia:delete` operations, so every mutation leaves a job record. That asymmetry is deliberate: look freely, change accountably.

## Secrets

**Manage → Secrets** stores per-user encrypted values (AES-256-GCM, decryptable only by the venue that stored them): API keys for LLM providers, tokens for HTTP operations. The app lists **names only**; values are write-only from the UI and are referenced by operations as `s/NAME` without ever entering a prompt or a job record. The page suggests the standard LLM key names (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and so on) that agent creation looks for.

REST equivalents: `GET /api/v1/secrets` (names), `PUT /api/v1/secrets/{name}`, `DELETE /api/v1/secrets/{name}`.

## The Inbox: human-in-the-loop

**Grid → Inbox** is where running work waits for you. When an operation or agent needs a human, it files a [HITL request](../../protocol/cogs/COG-016) and its job holds in `INPUT_REQUIRED`; the inbox badge counts what is waiting. Three kinds of ask arrive:

- **Answers**: a question or an approval; simple asks offer one-click responses.
- **Choices**: pick from options the requester supplied.
- **Authority**: the request asks for capabilities. The app shows exactly which grants (`with` + `can`) are being requested and lets you narrow them before consenting. Two consent modes exist: the venue mints a grant from capabilities you hold, or, with a device key, the app signs a **self-sovereign UCAN token** locally with your own key ([COG-19](../../protocol/cogs/COG-019)), so the venue never holds your signing authority.

Every response is recorded against the requesting job, so the audit trail shows what was asked, what was granted, and by whom. Nothing in the app can widen a grant beyond what you approve.

## Where this section grows next

The app tracks venue capability closely, and two adjacent surfaces are in active development on the same principles: a memory panel over `memory:manage` (durable user facts at `w/memory`) and a scheduler view for deferred and recurring runs (`scheduler:*`). Until they land, both are fully usable today from the [operations](./operations-and-jobs) surface and the SDKs.
