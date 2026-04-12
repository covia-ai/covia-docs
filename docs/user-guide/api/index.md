---
sidebar_position: 1
---

# Covia REST API

The Covia REST API provides HTTP endpoints for interacting with venues on the Grid. All venues expose a consistent API that enables clients to manage assets, invoke operations, and monitor jobs.

## Base URL

The API is available at `/api/v1/` on any Covia venue. For example:

```
https://venue-test.covia.ai/api/v1/
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
  "did": "did:web:venue-test.covia.ai",
  "url": "https://venue-test.covia.ai/api/v1/",
  "stats": {
    "assets": 42,
    "users": 101,
    "ops": 15
  }
}
```

---

### Assets

#### `GET /api/v1/assets`

Lists assets available on the venue.

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

### Operations

#### `POST /api/v1/invoke`

Invokes an operation and creates a job to track execution.

**Request Body:**
```json
{
  "operation": "0x7a8b9c0d...",
  "input": {
    "url": "https://example.com/data"
  }
}
```

The `operation` field can be:
- An Asset ID (hex string)
- An operation name registered with the venue
- An adapter reference (e.g., `"http:get"`)

**Response:** `201 Created`
```json
{
  "id": "0x12345678901234567890123456789012",
  "status": "pending",
  "created": 1706367600000,
  "operation": "0x7a8b9c0d..."
}
```

---

### Jobs

#### `GET /api/v1/jobs`

Lists all jobs on the venue.

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
  "status": "completed",
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
  "id": "did:web:venue-test.covia.ai",
  "service": [
    {
      "id": "did:web:venue-test.covia.ai#covia",
      "type": "Covia.API.v1",
      "serviceEndpoint": "https://venue-test.covia.ai/api/v1/"
    }
  ]
}
```

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

### Authentication

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
  "operation": "covia:write",
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
