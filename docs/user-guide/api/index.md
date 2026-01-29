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

| Status | Description |
| ------ | ----------- |
| `pending` | Job created, waiting to execute |
| `running` | Job currently executing |
| `completed` | Job finished successfully |
| `failed` | Job finished with an error |
| `cancelled` | Job was cancelled |

#### `GET /api/v1/jobs/{id}/sse`

Server-Sent Events endpoint for real-time job status updates.

**Response:** SSE stream with job status events.

#### `PUT /api/v1/jobs/{id}/cancel`

Cancels a running job.

**Response:** `200 OK` with final job status, or `404 Not Found`.

#### `PUT /api/v1/jobs/{id}/delete`

Deletes a job record.

**Response:** `200 OK` or `404 Not Found`.

---

### DID Documents

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

#### `GET /a/{id}/did.json`

Returns the DID document for a specific asset.

**Response:** `200 OK`
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:web:venue-test.covia.ai/a/119e30db..."
}
```

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
| `404` | Resource not found |
| `500` | Server error |

## Related Documentation

- [COG-5: Asset Metadata](/docs/protocol/cogs/COG-005) - Metadata format specification
- [COG-6: Artifacts](/docs/protocol/cogs/COG-006) - Data asset specification
- [COG-7: Operations](/docs/protocol/cogs/COG-007) - Operation specification
