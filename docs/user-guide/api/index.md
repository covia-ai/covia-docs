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

### Bearer tokens

Authenticated requests carry a JWT in the standard header:

```
Authorization: Bearer <jwt>
```

A venue accepts three bearer forms: a **self-issued EdDSA JWT** (signed with the caller's own Ed25519 key, identifying a `did:key` or a named venue user), a **venue-signed JWT** (issued after OAuth login), or an **external provider JWT** (verified against the provider's JWKS). See the [operator authentication guide](../../operator-guide/auth) for how venues configure these.

### Presenting UCAN capability proofs

Delegated authority is presented as [UCAN](../capabilities) proof tokens alongside the caller's identity. There are three transport channels, merged by the venue:

| Channel | Where it works | Form |
| ------- | -------------- | ---- |
| `Authorization: Bearer <ucan-jwt>` | Any request | A UCAN JWT as the bearer token itself |
| `ucans` body field | `POST` requests (`/invoke`, `/run`) | JSON array of UCAN JWT strings |
| `X-Covia-Ucans` header | Body-less requests (`GET` reads, SSE) | Comma-separated UCAN JWTs |

The `X-Covia-Ucans` header exists because a `GET` has no body to carry the `ucans` array: it is how delegated job observation and delegated lattice reads present their proofs. Capability enforcement is identical on every channel.

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

Across the API and in operation inputs (e.g. `asset:get`, the `file:write` `asset` field, grid operation references), an asset can be referenced by **bare hex hash**, by `a/<hash>`, or by `/a/<hash>`; these are equivalent. The `a/` form matches the per-user namespace convention used elsewhere (`w/`, `o/`).

#### `GET /api/v1/assets`

Lists the **caller's own pinned assets** (the per-user `a/` namespace), not every asset on the venue. The venue's operation catalog is discovered via `GET /api/v1/operations` (or the `covia:functions` / `covia:inspect` operations), not here.

**Query Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `offset` | integer | Starting index (0-based). Default: 0 |
| `limit` | integer | Maximum results (max 1000). Default: all |

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

#### `GET /api/v1/assets/{id}/content`

Retrieves the content of an artifact asset.

**Path Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `id` | string | Asset ID (hex string) |

**Query Parameters:**

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `inline` | boolean | Set Content-Disposition to inline |

**Response:** `200 OK`

Returns the binary content with appropriate `Content-Type` header based on the asset metadata.

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
- A **catalog path**: `v/ops/<adapter>/<op>` (e.g. `v/ops/http/get`). The usual form; list them via `GET /api/v1/operations`.
- A **user pin**: `o/<name>` from your workspace
- An **Asset ID**: `a/<hash>` or bare hex
- A **DID URL**: an operation on a remote venue

The short `adapter:op` style (e.g. `http:get`) is the operation's *name* as used in documentation and adapter metadata; it is **not** a resolvable reference and will be rejected.

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
| absent / `false` | Asynchronous: `201` with a job record to poll (the default) |
| `true` | Block up to the 120s cap; return the finished record with `200` if it completes |
| `<integer>` | Block up to that many **milliseconds** (clamped to the 120s cap) |

If the job finishes within the window you get the completed record (`200`); otherwise the current record (`201`) and you continue polling. A malformed `wait` value is rejected with `400`. The 120s cap is a server resource limit; for longer waits, poll or use SSE.

```bash
# Fire-and-poll (default)
curl -X POST .../api/v1/invoke -d '{"operation":"v/ops/http/get","input":{"url":"..."}}'

# Wait inline, up to 30 seconds
curl -X POST '.../api/v1/invoke?wait=30000' -d '{"operation":"...","input":{...}}'
```

#### `POST /api/v1/run`

Runs an operation and returns its **result**, with no job handle in the response. Use this when you only want the output; use `/invoke` when you need to track, stream, pause, or cancel the execution.

**Request Body:** identical to `/invoke`: `operation` (resolvable reference), optional `input`, optional `ucans` proof array.

```bash
curl -X POST .../api/v1/run \
  -H "Content-Type: application/json" \
  -d '{"operation": "v/ops/schema/infer", "input": {"value": {"name": "Ada"}}}'
```

**Response:** `200 OK` with the operation output as the body, `400` for a malformed request, `403` if the operation is not authorised.

Execution still uses the normal job lifecycle internally: mutating or unclassified operations are recorded as durable jobs, while an operation marked `readOnly: true` may run as a transient job that is never persisted. The HTTP request remains open until the operation completes, so bound long-running work with `/invoke` and polling instead.

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

**Response:** an SSE stream. Each event is named `job-update` and its `data` payload is the **full JSON job record** (the same shape as `GET /api/v1/jobs/{id}`), sent on every state change. When the job reaches a terminal status the final record is sent and the stream closes; subscribing to an already-terminal job yields one final frame, then close.

```
event: job-update
data: {"id":"0x1234...","status":"COMPLETE","output":{...}}
```

Delegated or federated observation presents proofs via the `X-Covia-Ucans` header (see [Authentication](#presenting-ucan-capability-proofs)). Note that the browser `EventSource` API cannot set an `Authorization` header. The SDKs therefore stream over `fetch` and parse the SSE body themselves, carrying normal auth headers (TypeScript `venue.jobs.stream()`, SDK 1.9.0); plain `EventSource` clients work unauthenticated on public venues, and otherwise poll `GET /api/v1/jobs/{id}`.

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

### Values (job-free lattice reads)

Six `GET` routes read the venue's lattice directly, **without creating a job**. They exist so that dashboards, pollers, and agents can read state repeatedly without minting an audit record per read; capability enforcement is identical to the operation path. Clients that poll (such as the Covia web app) should always read through these routes and reserve `/invoke` for explicit actions.

Every route takes a `path` query parameter addressing the lattice:

| Prefix | Contents | Notes |
| ------ | -------- | ----- |
| `a/` | The caller's content-addressed assets | |
| `o/` | The caller's named operation pins | |
| `j/` | The caller's job records | |
| `g/` | The caller's agents | e.g. `g/my-agent/status` |
| `w/` | The caller's durable workspace | e.g. `w/notes`, `w/memory` |
| `s/` | The caller's secret **names** | Values are never readable |
| `h/` | The caller's human-in-the-loop inbox | |
| `n/` | Agent-scoped notes | Requires `agent` parameter |
| `t/` | Job-scoped temporary state | Requires `agent` and `task` parameters |
| `c/` | Session-scoped scratch | Requires `agent` and `session` parameters |
| `v/` | Venue globals: `v/ops`, `v/info`, `v/agents` | Public read |

The scoping parameters accompany the virtual namespaces: `agent` is a bare agent id under the caller (or a full agent DID), `task` is the `agent:request` job id, and `session` is the session id. Delegated reads of another user's paths present UCAN proofs via the `X-Covia-Ucans` header.

#### `GET /api/v1/values/read`

Reads the literal value at a path.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** Lattice path, e.g. `w/notes`, `v/info/adapters` |
| `maxSize` | integer | Byte guard (default 1,000,000): a larger value is withheld |

**Response** always carries an explicit existence flag, so a stored `null` is distinguishable from an absent path:

```json
{ "exists": true, "value": { "theme": "dark" } }
```

| Shape | Meaning |
| ----- | ------- |
| `{"exists": true, "value": <value>}` | Path has data |
| `{"exists": true, "value": null}` | Path holds a stored null |
| `{"exists": false, "value": null}` | Path is absent |
| `{"exists": true, "value": null, "truncated": true, "size": <bytes>}` | Value exceeds `maxSize`; use `slice`, `list`, or a larger guard |

#### `GET /api/v1/values/list`

Lists the keys and structure of a lattice node.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** Node to list, e.g. `g`, `w` |
| `limit` | integer | Maximum keys to return (default 1000) |
| `offset` | integer | Keys to skip (default 0) |
| `fields` | string | Field projection: comma-separated subpaths (max 16) read from each listed child, returned as a `values` map of per-key `{exists, value, truncated?}` results. Keyed nodes only; applies after `limit`/`offset` |
| `maxSize` | integer | Per-projected-field byte guard when `fields` is given (default 1,000,000) |

The `fields` projection lets a list view fetch each child's display fields (for example `fields=status,meta/updated` over `g`) in one request instead of an N+1 fan-out.

#### `GET /api/v1/values/slice`

Reads a paginated slice of a lattice sequence (for example a job history or an agent timeline).

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** The vector to slice, e.g. `g/my-agent/timeline` |
| `offset` | integer | Starting element index (default 0) |
| `limit` | integer | Maximum elements (default 100) |
| `maxSize` | integer | Maximum encoded bytes of the returned page (default 1,000,000). An oversize page is a `400`: reduce `limit`. Slice returns exact values, never summaries |

#### `GET /api/v1/values/inspect`

Budget-controlled JSON5 render of a value: shape and sample content within a byte budget, for previewing large or unknown structures.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** Path to render, e.g. `g/my-agent` |
| `budget` | integer | Render budget in bytes (default 500) |
| `compact` | boolean | Compact rendering, no whitespace |

#### `GET /api/v1/values/count`

Fast-path count of entries below a path.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** Collection path, e.g. `j` |
| `depth` | integer | Steps below the path to count at (default 1) |

**Response:** `{"exists": true, "count": 1287}`

#### `GET /api/v1/values/aggregate`

Counts entries at a depth, optionally partitioned by a field.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `path` | string | **Required.** Collection path, e.g. `j` |
| `depth` | integer | Steps below the path to count at (default 1) |
| `groupBy` | string | Field (relative subpath) to partition by; adds a `groups` breakdown |

**Response:**

```json
{ "exists": true, "count": 42, "groups": { "COMPLETE": { "count": 37 }, "FAILED": { "count": 5 } } }
```

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

### Schedules (job-free read)

#### `GET /api/v1/schedules`

Lists the authenticated caller's pending scheduled events, time-ordered, without creating a job (covia 0.9.2). Includes events queued by the caller's agents. Requires authentication (`401` otherwise).

**Response:** an array of `{handle, op, time}` entries, where `handle` identifies the schedule for `scheduler:cancel`/`scheduler:trigger`, `op` is the target operation reference, and `time` is the next run in epoch milliseconds.

---

### Agents (job-free reads)

Two `GET` routes read agent state without creating a job. Agent **actions** (create, chat, request, suspend, and the rest) remain operations under `v/ops/agent/`; see [Agent Operations](../agents/operations).

#### `GET /api/v1/agents`

Lists the authenticated caller's agents. Requires authentication (`401` otherwise).

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `status` | boolean | `false` returns bare agent ids instead of the default annotated form |
| `includeTerminated` | boolean | `true` includes terminated agents (hidden by default) |

**Response** (default annotated form):

```json
[
  { "agentId": "researcher", "status": "SLEEPING", "tasks": 2 },
  { "agentId": "assistant", "status": "RUNNING", "tasks": 0 }
]
```

Entries carry `agentId`, `status`, `tasks`, and `error` when present, so a list view needs no per-agent fan-out.

#### `GET /api/v1/agents/{id}`

Gets one of the caller's agents: the same payload as the `agent:info` operation. Requires authentication.

**Response:** `200 OK` with the agent info record, or `404 Not Found` for a missing agent id.

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

The document `id` is the venue's persistent `did:key`; the same key is also listed under `assertionMethod`, `capabilityDelegation` and `capabilityInvocation`. The venue remains reachable by `did:web:<host>` references; this endpoint is what resolves them to the API `serviceEndpoint`.

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
