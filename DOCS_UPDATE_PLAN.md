# Covia Docs Update Plan

> **Status:** Draft for review · **Date:** 2026-06-10
> **Baseline:** docs last meaningfully updated 2026-04-12; ~168 commits to `covia` (`develop`) since.
> **Goal:** bring `covia-docs` into line with the current Covia engine — accurate, complete, and free of pre-OSS-push placeholders — without losing the parts that are already good (SDK reference, REST API reference, DLFS, orchestrator).

This is a working plan, executed in **phases**. Each phase is independently shippable. British English throughout (per workspace convention: *decentralised*, *organisational*).

---

## 1. Why this is needed

The docs were written, in large part, before three things landed in the engine:

1. The **sessions** model for agents (replacing the older `inbox` / `transcript` / `history` design).
2. The default LLM moving to **`gpt-5.4-mini`** and the addition of new backends (xAI Grok).
3. A wave of new adapters and protocol surfaces — **FileAdapter**, **SchedulerAdapter**, the **A2A v1.0** rewrite, **AuthAdapter**, expanded **UCAN/capability** enforcement.

The covia repo's own [`DX_PLAN.md`](https://github.com/covia-ai/covia/blob/develop/DX_PLAN.md) (Milestone 1) independently calls out the stub pages — *"the Venues and Grid overviews, the A2A adapter page… let's finish them or remove them from the nav until they're ready."* This plan is aligned with that roadmap and the new developer-facing `README.md`.

---

## 2. Guiding principles

These apply to every phase:

- **Terminology is locked in Phase 0 and then held.** The biggest source of drift is vocabulary (`inbox` vs `session.pending`, `transcript`/`history` vs sessions, `gpt-4o` vs `gpt-5.4-mini`). Decide once, then sweep.
- **One obvious path.** Where multiple ways exist, the docs lead with one (mirrors `DX_PLAN.md` principle 3).
- **Verify against a live venue, not memory.** Every code example and operation name is confirmed against the **source code** and a **running local venue built from `develop`** before it ships. Commit messages and old docs are *leads*, not ground truth — they have hidden real API shapes before.
- **Honest about maturity.** Experimental surfaces (COGs, agent lifecycle) stay labelled as such; we don't dress drafts up as stable.
- **Additive, not destructive.** Keep the strong existing pages; finish or hide stubs rather than leaving "coming soon" on central concepts.

---

## Execution status (2026-06-11) — ✅ complete

All five phases executed; `pnpm build` is clean (no broken links or anchors). Every operation name, field, and schema was verified against `covia` `develop` source (adapter classes + `resources/adapters/*.json`), not commit messages — this caught one error in the research notes (`defaultTools` actually defaults to **true**, not false). New pages: `agents/sessions.md`, `adapters/file.md`, `adapters/scheduler.md`, `user-guide/capabilities.md`, `adapters/index.md`. A2A page rewritten; model/sessions sweeps applied; UCAN/auth/persistence/asset-API gaps closed; overview stubs and quick-start rebuilt.

Two deliberate deviations from the plan letter:
- **`operator-guide/index.md`** was rewritten into a concise real landing (links to venue-start/auth/persistence) rather than hidden from nav — strictly better than a hidden/empty category landing, and it removes the "coming soon" content as intended.
- **COG-011** (exploratory draft, still inbox-based) got a prominent banner pointing to the new user-guide sessions docs rather than a full protocol rewrite, which is a larger spec-authoring effort best done separately.

Not validated against a live venue this pass (source-schema-accurate; live invocation is a good follow-up — see §2 principles).

## 3. Decisions resolved (2026-06-11)

| # | Decision | Resolution |
|---|---|---|
| 1 | **Stub pages** | **Hybrid** — replace the overview stubs (`grid`, `venues`, `sdk`) with short real content that links into the deeper existing pages; **hide `operator-guide/index` from nav** until proper operator content exists. |
| 2 | **Model references** | **Illustrative, not prescriptive.** Covia is model-agnostic; choice of model is the user's. Show concrete ids only as "e.g." examples, lean on the venue default where one applies, and let the backends page list what's *supported*. No "Covia recommends X". |
| 3 | **Sessions docs** | **Dedicated `agents/sessions.md`** covering the model end-to-end; other agent pages get light edits to purge `inbox`/`transcript` and link to it. |
| 4 | **UCAN / capabilities** | **Dedicated `user-guide/capabilities` page** (UCAN model, `{with,can}`, agent `caps`, cross-user sharing — spec ref COG-013) **+ an operator section** in `auth.md` for the venue-config/token side. |
| 5 | **MCP duplication** | **Keep both, distinct scopes.** `adapters/covia-with-mcp.md` = the MCP *adapter* (calling external MCP tools as grid ops); the `mcp/` section = venue-as-MCP-server. Rewrite to remove the overlap. |
| 6 | **Quick-start lead language** | **Lead with TypeScript** (`@covia/covia-sdk`); Python shown as secondary. |
| 7 | **COG-003 vs COG-010** | Identified as a drifted **spec/implementation split**. Retitle **COG-3 → "Authentication Mechanisms"**, **COG-10 → "Venue Authentication & Access Control"**; cross-reference; COG-10 references COG-3 for Ed25519 detail; document the chain COG-3 → COG-10 → COG-13. |
| 8 | **Java SDK version** | **Defer this pass.** Leave `sdk/java.md` as-is until `DX_PLAN.md` Milestone 2 settles the versioning story; revisit then. |

---

## 4. Findings inventory

### 🔴 Undocumented new tech (no page exists)

| Feature | Surface to document (confirm exact schemas in code) | Target |
|---|---|---|
| **Sessions model** | `sessionId`, `session.pending` (replaces `inbox`), `session.frames`, per-session history; task-Jobs vs chat-Jobs; one-session-per-cycle run loop; per-session/`task.wakeTime` scheduling | rewrite across `user-guide/agents/*`; consider new `agents/sessions.md` |
| **FileAdapter** (`file:`) | `file:roots`, `file:list`, `file:read`, `file:write`, `file:append`, `file:delete`, `file:mkdir`, `file:stat`, `file:tree`; root-jailing, host/temp/DLFS-backed roots, read-only roots, symlink/prefix safety | new `user-guide/adapters/file.md` |
| **SchedulerAdapter** (`scheduler:`) | `scheduler:schedule`, `scheduler:cancel`, `scheduler:trigger`, `scheduler:list`; handle tokens; **authority captured at schedule time and replayed** (caller caps/UCAN, no escalation); agent wake integration | new `user-guide/adapters/scheduler.md` |
| **A2A v1.0** | Inbound JSON-RPC (`MessageSend`, `GetTask`, `CancelTask`, agent card; streaming `SendStreamingMessage` / `SubscribeToTask`); outbound `a2a:*` ops invoking remote agents as grid operations; Job-per-Task mirroring | flesh out `user-guide/adapters/covia-with-a2a.md` (currently "coming soon") |

### 🟠 Stale content (page exists, describes old behaviour)

| Issue | Files |
|---|---|
| `gpt-4o`/`gpt-4o-mini` examples throughout; default is now **`gpt-5.4-mini`**; Anthropic default moved; **xAI Grok** backend (OpenAI-compatible route, `XAI_API_KEY`) missing entirely | `agents/llm-backends.md`, `agents/creating-agents.md`, `adapters/langchain-adapter.md`, `agents/llm-agent.md`, `agents/goal-tree.md` |
| `inbox` / `g/<agentId>/inbox` / `transcript` / `history` terminology — superseded by sessions | `agents/operations.md`, `agents/index.md`, `agents/tools-and-context.md`, `api/index.md` |
| Tool naming not stated as **snake_case**; harness tools (`complete_task`, `fail_task`, `subgoal`, `compact`, `more_tools`, `context_load/unload`) not catalogued in one place | `agents/tools-and-context.md`, `agents/creating-agents.md` |

### 🟡 Partial coverage (exists, needs completion)

- **UCAN / capabilities** — `Authorization: Bearer <ucan-jwt>` on REST/MCP; cross-user reads via verified proofs; `CapabilityChecker` gating `file:`/`dlfs:` ops; agent `caps` field semantics; `{with, can}` ability shape. → `operator-guide/auth.md` (+ consider a user-facing capabilities page; **COG-013** already specs the model).
- **AuthAdapter** — `auth:whoami` (`{caller, authenticated, internal}`); HTTP adapter `bearerSecret` + `s/NAME` secret resolution. → `operator-guide/auth.md`, `adapters/http-adapter.md`.
- **Typed outputs** — per-request `responseSchema` on `agent:request`; OpenAI strict mode; `strictTools` deliberately off. → `agents/operations.md` (the Goal Tree `outputs.complete/fail` case is already covered).
- **Agent templates** — asset (`a/<hash>`) and DID-URL template references beyond `template:*` and `w/templates/`; template discovery. → `agents/creating-agents.md`.
- **Asset / Job API** — `a/<hash>` / bare-hex ref forms; `asset:list` scoped to caller's **pinned** assets; `grid:run`/`grid:invoke` accept **any JSON** input value. → `api/index.md`, `adapters/grid-adapter.md`, `adapters/venue-adapter.md`.
- **Operator / deploy** — Azure VM provisioning + deploy workflow; CloudWatch logging; periodic fsync sweep / `PersistenceHandler.flush()` (~10s unclean-shutdown bound); "store unconfigured → temp" warning. → `operator-guide/persistence.md`, `operator-guide/venue-start.md`.

### ⚪ Stubs & hygiene (DX_PLAN Milestone 1)

- `overview/grid.md`, `overview/venues.md`, `overview/sdk.md` — pure "Documentation coming soon".
- `operator-guide/index.md` — role-description template only, no instructions.
- `user-guide/quick-start.md` — mostly links elsewhere; should mirror the runnable quickstart in the new `README.md`.
- `adapters/covia-with-mcp.md` overlaps `mcp/venues-as-mcp-servers.md` — de-duplicate / cross-link.
- COG hygiene: **COG-003** and **COG-010** are both titled "Authentication". Identified intent — it's a spec/implementation split that drifted because both kept the bare title: **COG-3 = authentication *mechanisms* catalogue** (standards-based menu: public/bearer/Basic/OAuth/Ed25519 JWT, client + SDK facing); **COG-10 = the venue's implemented auth + access-control model** (caller classes, middleware verification order, venue-signed tokens, OAuth provider endpoints, user-DID derivation, `auth` config). Resolution: retitle **COG-3 → "Authentication Mechanisms"**, **COG-10 → "Venue Authentication & Access Control"**; cross-reference both; have COG-10 reference COG-3 for the Ed25519 detail rather than re-specifying it; note the chain COG-3 (mechanisms) → COG-10 (identity + coarse access) → **COG-13 (capability authorization, UCAN)**. Confirm no new COGs need landing.
- `sdk/java.md` shows `0.0.2-SNAPSHOT`; reconcile with the versioning story once `DX_PLAN.md` Milestone 2 settles it.

---

## 5. Phased plan

### Phase 0 — Foundation & terminology lock
*Goal: a single source of truth so the rest of the sweep is mechanical.*

- [ ] Confirm the canonical terms from source: sessions vocabulary, current default models, snake_case tool convention, the live operation/field names for the new adapters.
- [ ] Write a short internal "concepts & terminology" note (can live as a section in `overview/index.md` or a `CONTRIBUTING`-style doc note) capturing: **session / session.pending / session.frames / task-Job vs chat-Job**, **default model `gpt-5.4-mini`**, **snake_case tools**, **asset reference forms**.
- [ ] Lock the adapter list and sidebar shape (what new pages exist, where they sit).

### Phase 1 — Stale-content sweep (high ROI, low risk)
*Goal: nothing in the docs describes behaviour that no longer exists.*

- [ ] Replace all `gpt-4o`/`gpt-4o-mini` examples with `gpt-5.4-mini` (and correct Anthropic defaults) across the 5 model-bearing files.
- [ ] Add **xAI Grok** to `agents/llm-backends.md` and `adapters/langchain-adapter.md` (OpenAI-compatible route, `XAI_API_KEY`, model ids).
- [ ] Purge `inbox` / `transcript` / `g/<agentId>/inbox` language; replace with sessions equivalents in `agents/operations.md`, `agents/index.md`, `agents/tools-and-context.md`, `api/index.md`.
- [ ] State the snake_case tool-naming convention and catalogue the harness tools once, cross-linked from the agent pages.
- [ ] **Validate** each changed example against a local venue built from `develop`.

### Phase 2 — New-tech pages
*Goal: every shipped adapter/protocol has a page authored from the actual code.*

- [ ] `adapters/file.md` — operations table, root configuration (venue config), safety model, agent usage example.
- [ ] `adapters/scheduler.md` — operations, handle lifecycle, authority-replay semantics, agent wake integration, worked example.
- [ ] `adapters/covia-with-a2a.md` — rewrite: inbound methods + streaming, agent card/discovery, outbound `a2a:*` ops, Job-per-Task mirroring.
- [ ] Sessions documentation — rewrite the agent run-loop/state narrative; add `agents/sessions.md` if a dedicated page reads better than threading it through existing pages.
- [ ] Add all new pages to `sidebars.ts` / `_category_.json`; verify nav.

### Phase 3 — Complete the partials
*Goal: close the half-covered surfaces.*

- [ ] UCAN/capabilities in `operator-guide/auth.md` (+ user-facing capabilities page if warranted); document agent `caps`.
- [ ] `auth:whoami` and HTTP `bearerSecret` / `s/NAME` resolution.
- [ ] Per-request `responseSchema` on `agent:request` in `agents/operations.md`.
- [ ] Template asset/DID-URL references in `agents/creating-agents.md`.
- [ ] Asset reference forms, `asset:list` scoping, any-JSON grid input in `api/index.md` + adapter pages.
- [ ] Operator/deploy: Azure, CloudWatch, fsync/flush, fallback-to-temp warning.

### Phase 4 — Stubs & hygiene
*Goal: no "coming soon" on a central concept; clean nav; consistent protocol set.*

- [ ] Finish or hide `overview/grid.md`, `overview/venues.md`, `overview/sdk.md`.
- [ ] Write a real `operator-guide/index.md`.
- [ ] Align `user-guide/quick-start.md` with the new README quickstart (one language, zero-to-first-operation).
- [ ] De-duplicate the two MCP "venue-as-server" pages.
- [ ] Reconcile COG-003/COG-010; confirm COG set is complete and correctly statused.
- [ ] Reconcile `sdk/java.md` version with the agreed versioning story.

---

## 6. Per-file work breakdown

| File | Action | Phase |
|---|---|---|
| `overview/index.md` | Light edit; anchor terminology | 0 |
| `overview/grid.md` | **Finish or hide** (stub) | 4 |
| `overview/venues.md` | **Finish or hide** (stub) | 4 |
| `overview/sdk.md` | **Finish or hide** (stub) | 4 |
| `user-guide/quick-start.md` | Rewrite to mirror README quickstart | 4 |
| `user-guide/sdk/java.md` | Version reconciliation | 4 |
| `user-guide/api/index.md` | inbox→sessions; asset ref forms; `asset:list` scoping; any-JSON grid input | 1, 3 |
| `user-guide/agents/index.md` | inbox→sessions narrative | 1 |
| `user-guide/agents/operations.md` | inbox→sessions; `agent:chat`; `responseSchema`; complete/fail-task | 1, 3 |
| `user-guide/agents/creating-agents.md` | models; templates (asset/DID); snake_case tools | 1, 3 |
| `user-guide/agents/tools-and-context.md` | sessions terms; snake_case + harness-tool catalogue | 1 |
| `user-guide/agents/llm-agent.md` | models; transcript→sessions | 1 |
| `user-guide/agents/goal-tree.md` | models | 1 |
| `user-guide/agents/llm-backends.md` | default `gpt-5.4-mini`; Anthropic default; **add xAI Grok** | 1 |
| `user-guide/agents/sessions.md` *(new)* | Sessions model end-to-end | 2 |
| `user-guide/adapters/file.md` *(new)* | FileAdapter | 2 |
| `user-guide/adapters/scheduler.md` *(new)* | SchedulerAdapter | 2 |
| `user-guide/adapters/covia-with-a2a.md` | Full A2A v1.0 rewrite | 2 |
| `user-guide/adapters/langchain-adapter.md` | models; xAI Grok | 1 |
| `user-guide/adapters/http-adapter.md` | `bearerSecret`, `s/NAME` | 3 |
| `user-guide/adapters/grid-adapter.md` | any-JSON input | 3 |
| `user-guide/adapters/venue-adapter.md` | asset ref forms / scoping touch-ups | 3 |
| `user-guide/adapters/covia-with-mcp.md` | De-dupe vs `mcp/` section | 4 |
| `user-guide/adapters/_category_.json` + `sidebars.ts` | Add file/scheduler pages | 2 |
| `operator-guide/index.md` | Write real content | 4 |
| `operator-guide/auth.md` | UCAN/caps; `auth:whoami` | 3 |
| `operator-guide/venue-start.md` | store-unconfigured warning; deploy pointers | 3 |
| `operator-guide/persistence.md` | fsync sweep/flush; Azure/CloudWatch | 3 |
| `protocol/cogs-overview.md` + `COG-003`/`COG-010` | Reconcile auth COGs | 4 |

*(DLFS, Vault, JSON, Orchestrator, MCP section, and the SDK Python/TypeScript pages were checked and are currently accurate — no action beyond terminology touch-ups.)*

---

## 7. Verification & done criteria

- [ ] Every code sample and operation name confirmed against `covia` `develop` source.
- [ ] Examples executed against a local venue (`java -jar venue/target/covia.jar local-dev.json`) where feasible.
- [ ] `pnpm build` is clean (no broken links / broken anchors).
- [ ] No "coming soon" / "more information coming soon" strings remain on a central concept (grep check).
- [ ] No `gpt-4o`, `inbox`, or `transcript` references remain except where historically accurate.
- [ ] New adapters appear in the sidebar and the README "What can a venue do?" table matches the docs.

---

## 8. To confirm in code during execution

These are deliberately *not* asserted from commit messages — confirm exact names/schemas when writing each page:

- Exact `file:` and `scheduler:` operation names and input/output schemas (resource files under `venue/src/main/resources/adapters/{file,scheduler}/`, plus the adapter classes).
- A2A method names and the agent-card shape as implemented in the v1.0 server rewrite.
- Sessions field names as persisted in `AgentState` / session records (`venue/src/main/java/covia/lattice/Covia.java` and the agent adapters).
- Current default model constants and the full xAI/Grok model id list.
- Whether capabilities warrant a dedicated user-guide page or just an `operator-guide/auth.md` section (COG-013 is the spec reference).
