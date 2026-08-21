---
sidebar_position: 1
---

# Covia REST API

The Covia REST API provides HTTP endpoints for interacting with venues on the Grid. All venues expose a consistent API that enables clients to manage assets, invoke operations, and monitor jobs.

## Base URL

The API is available at `/api/v1/` on any Covia venue. For example:

```
https://venue-3.covia.ai/api/v1/
```

## Authentication

Authentication requirements vary by venue. See [COG-3: Authentication](/docs/protocol/cogs/COG-003) for supported authentication methods.

Public venues may allow unauthenticated access to read operations, while write operations typically require authentication.

## Content Type

All API requests and responses use JSON:

```
Content-Type: application/json
```

## Endpoints

### Status

#### `GET /api/v1/status`

Returns venue status information including DID, available assets, and operational statistics.

**Response:**
```json
{
  "url": "https://venue-3.covia.ai",
  "ts": 1781255878753,
  "status": "OK",
  "name": "Covia Venue (EC2)",
  "did": "did:key:z6MkovQ9NpjTsbVrSaAKEX2d3zXztSnYHjNxTi5oFs8qcrwx",
  "stats": {
    "assets": 130,
    "users": 0,
    "ops": 116
  }
}
```

The `did` is the venue's persistent `did:key` identity, also published in its [DID document](#get-well-knowndidjson).

---

### Assets

Asset **references** resolve generally across the API and in operation inputs. A reference may be a bare hex hash, `a/<hash>`, `/a/<hash>`, a venue-namespace path (`v/`, `w/`, `o/`), or a DID URL — all of these address the same asset, and venue listings return owner-qualified references that round-trip without changing namespace.

Two canonical endpoints carry the two halves of an asset: `assets/<ref>` is its **metadata**, `content/<ref>` is its **bytes**.

#### `GET /api/v1/assets`

Lists the **venue-level asset catalog**, as fully-qualified asset references. The venue's operation catalog is discovered via `GET /api/v1/operations` (or the `covia:functions` / `covia:inspect` operations), not here.

**Query Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `scope` | string | `own` (or `mine`) lists the **authenticated caller's own** `a/` assets — those populated by `asset:store` / `asset:pin` — instead of the venue catalog. Requires authentication; persists no Job. |
| `offset` | integer | Starting index (0-based). Default: 0 |
| `limit` | integer | Maximum results (max 1000). Default: the first page |

**Response:**
```json
{
  "total": 42,
  "offset": 0,
  "limit": 10,
  "items": [
    "0x119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607",
    "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
  ]
}
```

#### `POST /api/v1/assets`

Registers a new asset with the venue.

**Request Body:** Asset metadata as JSON

```json
{
  "name": "My Dataset",
  "description": "A sample dataset",
  "content": {
    "contentType": "text/csv",
    "sha256": "119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607"
  }
}
```

**Response:** `201 Created`
```json
"0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
```

The response header includes `Location` pointing to the new asset.

#### `GET /api/v1/assets/{id}`

Retrieves metadata for a specific asset.

**Path Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | string | Asset ID (hex string) |

**Response:** `200 OK`

Returns the asset metadata JSON as originally registered.

#### `GET /api/v1/content/<ref>`

Retrieves an asset's **content bytes** by any asset reference — hash, `a/`, `v/`, `w/`, `o/`, a leading-slash form, or a DID URL.

**Query Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `inline` | boolean | Set Content-Disposition to inline |

**Response:** `200 OK`

Returns the binary content with a `Content-Type` taken from the asset metadata.

#### `GET /api/v1/assets/{id}/content`

The single-segment hash form, kept for compatibility. `GET /api/v1/content/<ref>` is the canonical route and accepts every reference form.

#### `PUT /api/v1/assets/{id}/content`

Uploads content for an artifact asset. The content hash must match the `content.sha256` value in the asset metadata.

**Path Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | string | Asset ID (hex string) |

**Request Body:** Binary content

**Response:** `200 OK`
```json
"0x119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607"
```

---

### Invocation

#### `POST /api/v1/invoke`

Invokes an operation and creates a job to track execution.

**Request Body:**
```json
{
  "operation": "v/ops/http/get",
  "input": {
    "url": "https://example.com/data"
  }
}
```

The `operation` field is a resolvable reference:
- A **catalog path** — `v/ops/<adapter>/<op>` (e.g. `v/ops/http/get`). The usual form; list them via `GET /api/v1/operations`.
- A **user pin** — `o/<name>` from your workspace
- An **Asset ID** — `a/<hash>` or bare hex
- A **DID URL** — an operation on a remote venue

The short `adapter:op` style (e.g. `http:get`) is the operation's *name* as used in documentation and adapter metadata — it is **not** a resolvable reference and will be rejected.

**Response:** `201 Created`
```json
{
  "id": "0x12345678901234567890123456789012",
  "status": "PENDING",
  "created": 1706367600000,
  "operation": "0x7a8b9c0d..."
}
```

Invocation is **asynchronous by default**: the response is the job record, and you poll `GET /api/v1/jobs/{id}` (or subscribe via `.../sse`) until the job reaches a terminal status carrying its output. The `Location` header names the job to poll.

**Waiting for the result inline.** Pass `wait` (query parameter `?wait=…` or a body field) for a synchronous response:

| `wait` | Behaviour |
|--------|-----------|
| absent / `false` | Asynchronous — `201` with a job record to poll (the default) |
| `true` | Block up to the 120s cap; return the finished record with `200` if it completes |
| `<integer>` | Block up to that many **milliseconds** (clamped to the 120s cap) |

If the job finishes within the window you get the completed record (`200`); otherwise the current record (`201`) and you continue polling. A malformed `wait` value is rejected with `400`. The 120s cap is a server resource limit — for longer waits, poll or use SSE.

```bash
# Fire-and-poll (default)
curl -X POST .../api/v1/invoke -d '{"operation":"v/ops/http/get","input":{"url":"..."}}'

# Wait inline, up to 30 seconds
curl -X POST '.../api/v1/invoke?wait=30000' -d '{"operation":"...","input":{...}}'
```

---

### Jobs

#### `GET /api/v1/jobs`

Lists the caller's own job ids (the per-user `j/` namespace).

**Response:**
```json
[
  "0x12345678901234567890123456789012",
  "0xabcdef01234567890abcdef012345678"
]
```

#### `GET /api/v1/jobs/{id}`

Gets the current status of a job.

**Path Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | string | Job ID |

**Response:** `200 OK`
```json
{
  "id": "0x12345678901234567890123456789012",
  "status": "COMPLETE",
  "created": 1706367600000,
  "updated": 1706367601000,
  "operation": "0x7a8b9c0d...",
  "output": {
    "result": "Success",
    "data": {}
  }
}
```

**Job Status Values:**

| Status | Category | Description |
| ------ | -------- | ----------- |
| `PENDING` | Active | Job created, waiting to execute |
| `STARTED` | Active | Job is currently executing |
| `COMPLETE` | Terminal | Job finished successfully with output |
| `FAILED` | Terminal | Job finished with an error |
| `CANCELLED` | Terminal | Job was cancelled by client or venue |
| `REJECTED` | Terminal | Job was rejected before execution (e.g. policy violation) |
| `PAUSED` | Interactive | Job execution suspended, awaiting resume |
| `INPUT_REQUIRED` | Interactive | Job requires additional input from the client |
| `AUTH_REQUIRED` | Interactive | Job requires authorisation or credentials |

#### `GET /api/v1/jobs/{id}/sse`

Server-Sent Events endpoint for real-time job status updates.

**Response:** SSE stream with job status events.

#### `PUT /api/v1/jobs/{id}/cancel`

Cancels a running job.

**Response:** `200 OK` with final job status, or `404 Not Found`.

#### `PUT /api/v1/jobs/{id}/pause`

Pauses a running job. Only valid when the job is in a non-terminal, non-paused state (`PENDING`, `STARTED`, `INPUT_REQUIRED`, `AUTH_REQUIRED`).

**Response:** `200 OK` with updated job status, `404 Not Found`, or `409 Conflict` if the job is already finished or paused.

#### `PUT /api/v1/jobs/{id}/resume`

Resumes a paused job. Only valid when the job is in `PAUSED` state. The venue re-engages the adapter to continue execution.

**Response:** `200 OK` with updated job status, `404 Not Found`, or `409 Conflict` if the job is not paused.

#### `PUT /api/v1/jobs/{id}/delete`

Deletes a job record.

**Response:** `200 OK` or `404 Not Found`.

---

### Operations

#### `GET /api/v1/operations`

Lists all registered operations across all adapters.

**Response:**
```json
[
  {
    "name": "covia:read",
    "description": "Read a value at any lattice path",
    "adapter": "covia",
    "input": { ... }
  }
]
```

#### `GET /api/v1/operations/{name}`

Gets details for a specific operation by name.

**Path Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `name` | string | Operation name (e.g., `covia:read`, `agent:create`) |

---

### Values — job-free lattice reads

Reads are pure, so they should not mint durable audit records. These `GET` routes read lattice state **synchronously, capability-checked, and without persisting a Job** — the same accessors the `covia:read` / `list` / `slice` / `inspect` / `aggregate` operations use, so read semantics cannot drift between the two forms. The operation forms remain available for callers that want a job record.

| Route | Returns |
| ----- | ------- |
| `GET /api/v1/values/read` | The literal value at a path |
| `GET /api/v1/values/list` | The keys / structure of a node |
| `GET /api/v1/values/slice` | A paginated slice of a sequence |
| `GET /api/v1/values/inspect` | A rendered view (`{result}`) |
| `GET /api/v1/values/aggregate` | A count, optionally grouped |
| `GET /api/v1/values/count` | Cardinality at a path |

**Common query parameters:**

| Parameter | Description |
| --------- | ----------- |
| `path` | *(required)* Lattice path — `w/notes`, `g/my-agent/status`, `v/info/adapters` |
| `agent` | Required for `n/`, `t/` and `c/` paths: a bare agent id under the caller, or a full agent DID |
| `task` | Required for `t/`: the task id (the `agent:request` Job id) |
| `session` | Required for `c/`: the session id |
| `maxSize` | Byte guard (default 1,000,000) — a larger value is withheld and the response carries `truncated: true` with its size |

Data routes answer `{exists, …}`; **absence is `200 {exists: false}`**, not a 404. `values/read` supports conditional reads — an `ETag` over the value hash, and `304 Not Modified`.

Reads resolve against **local** lattice state only: they never speculatively fetch from a remote venue.

```bash
curl "$VENUE/api/v1/values/read?path=w/notes" -H "Authorization: Bearer $TOKEN"
```

#### Field projection on `list`

`values/list` accepts `fields` — a comma-separated list of subpaths to read from each listed child — and adds a `values` map to the response, one entry per key on the page:

```bash
curl "$VENUE/api/v1/values/list?path=w/orders&limit=20&fields=status,meta/updated"
```

This fixes the collection-view N+1 (a list followed by N reads) in one round trip, against one snapshot of the parent. Projection applies **after** the `limit`/`offset` page, and is capped at 16 fields — exceeding that is a `400`, never a silent truncation. A non-keyed node with `fields` is a `400`. There is deliberately no filtering or ordering here: this is output shape only.

---

### Agents

#### `GET /api/v1/agents`

Lists the authenticated caller's agents. Job-free.

#### `GET /api/v1/agents/{id}`

One of the caller's agents — the same payload as `agent:info`. Job-free.

---

### Schedules

#### `GET /api/v1/schedules`

The authenticated caller's pending scheduled events, each `{handle, op, time}`, time-ordered — including events queued by the caller's agents. Job-free, so a scheduler view can refresh without writing a Job per read. The `scheduler:list` operation remains available.

**Response:** `200 OK`
```json
{ "events": [ { "handle": "0x4f3a...", "op": "v/ops/agent/trigger", "time": 1749650400000 } ] }
```

---

### Secrets

#### `GET /api/v1/secrets`

Lists secret names for the authenticated user. Values are never returned.

**Response:**
```json
["OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
```

#### `PUT /api/v1/secrets/{name}`

Stores a secret value (encrypted per-user).

**Request Body:**
```json
"sk-proj-abc123..."
```

**Response:** `200 OK`

#### `DELETE /api/v1/secrets/{name}`

Deletes a secret.

**Response:** `200 OK` or `404 Not Found`.

---

### Discovery Endpoints

#### `GET /.well-known/did.json`

Returns the DID document for the venue, following W3C DID specification.

**Response:** `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:key:z6MkovQ9NpjTsbVrSaAKEX2d3zXztSnYHjNxTi5oFs8qcrwx",
  "service": [
    {
      "type": "Covia.API.v1",
      "serviceEndpoint": "https://venue-3.covia.ai/api/v1"
    }
  ],
  "verificationMethod": [
    {
      "id": "did:key:z6MkovQ9...#z6MkovQ9...",
      "type": "Multikey",
      "controller": "did:key:z6MkovQ9...",
      "publicKeyMultibase": "z6MkovQ9NpjTsbVrSaAKEX2d3zXztSnYHjNxTi5oFs8qcrwx"
    }
  ],
  "authentication": ["did:key:z6MkovQ9...#z6MkovQ9..."]
}
```

The document `id` is the venue's persistent `did:key`; the same key is also listed under `assertionMethod`, `capabilityDelegation` and `capabilityInvocation`. The venue remains reachable by `did:web:<host>` references — this endpoint is what resolves them to the API `serviceEndpoint`.

#### `GET /.well-known/mcp.json`

MCP server discovery endpoint.

#### `GET /.well-known/agent-card.json`

A2A agent card discovery endpoint.

#### `GET /a/{id}/did.json`

Returns the DID document for a specific asset.

#### `GET /u/{id}/did.json`

Returns the DID document for a user (did:web resolution).

---

### MCP Endpoints

#### `POST /mcp`

MCP JSON-RPC endpoint for tool listing, tool calls, and notifications. See [Venues as MCP Servers](/docs/user-guide/mcp/venues-as-mcp-servers) for details.

#### `GET /mcp`

MCP SSE session establishment for server-to-client notifications.

#### `DELETE /mcp`

Close an MCP session.

---

### A2A Endpoint

#### `POST /a2a`

Agent-to-Agent JSON-RPC endpoint for federated agent operations.

---

### DLFS (WebDAV)

When WebDAV is enabled (`webdav.enabled: true` in venue config), DLFS drives are accessible via standard WebDAV at `/dlfs/`:

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/dlfs/{drive}/{path}` | Read file |
| `PUT` | `/dlfs/{drive}/{path}` | Write/upload file |
| `DELETE` | `/dlfs/{drive}/{path}` | Delete file |
| `MKCOL` | `/dlfs/{drive}/{path}` | Create directory |
| `PROPFIND` | `/dlfs/{drive}/{path}` | List directory |
| `MOVE` | `/dlfs/{drive}/{path}` | Move/rename file |
| `COPY` | `/dlfs/{drive}/{path}` | Copy file |
| `OPTIONS` | `/dlfs/*` | WebDAV capability discovery |

See [DLFS Adapter](/docs/user-guide/adapters/dlfs) for details.

---

### Documentation Endpoints

| Endpoint | Description |
| -------- | ----------- |
| `GET /openapi` | OpenAPI 3.0 JSON schema |
| `GET /swagger` | Swagger UI (interactive API docs) |
| `GET /redoc` | ReDoc UI |
| `GET /llms.txt` | LLM capabilities file |

---

### Authentication Endpoints

#### Login

| Endpoint | Description |
| -------- | ----------- |
| `GET /login` | Login page listing configured OAuth providers |
| `GET /auth/{provider}` | Initiate OAuth login |
| `GET /auth/{provider}/callback` | OAuth callback URL |

#### Bearer Token

```
Authorization: Bearer <JWT>
```

Supported token types:
- EdDSA self-issued tokens (did:key)
- Venue-signed JWTs
- OAuth provider RS256 tokens

See [COG-10: Authentication](/docs/protocol/cogs/COG-010) for details.

#### UCAN Proofs

Operations can include UCAN capability proofs:

```json
{
  "operation": "v/ops/covia/write",
  "input": { "path": "w/data", "value": {...} },
  "ucans": ["<ucan-token>"]
}
```

See [COG-13: Agent Capabilities](/docs/protocol/cogs/COG-013) for the capability model.

## Error Responses

Errors return appropriate HTTP status codes with a JSON body:

```json
{
  "error": "Asset not found: 0x1234..."
}
```

| Status | Description |
| ------ | ----------- |
| `400` | Bad request (invalid parameters) |
| `401` | Authentication required |
| `403` | Forbidden (insufficient capabilities) |
| `404` | Resource not found |
| `409` | Conflict (invalid state transition, e.g. pausing a finished job) |
| `500` | Server error |

## Related Documentation

- [COG-5: Asset Metadata](/docs/protocol/cogs/COG-005) - Metadata format specification
- [COG-6: Artifacts](/docs/protocol/cogs/COG-006) - Data asset specification
- [COG-7: Operations](/docs/protocol/cogs/COG-007) - Operation specification
- [COG-10: Authentication](/docs/protocol/cogs/COG-010) - Authentication specification
- [COG-13: Agent Capabilities](/docs/protocol/cogs/COG-013) - Capability model
