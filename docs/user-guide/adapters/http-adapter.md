---
id: http-adapter
title: HTTP Adapter
sidebar_label: HTTP
---

# HTTP Adapter

The HTTP adapter makes outbound HTTP requests to external APIs and web services, with built-in SSRF protection.

## Operations

### http:get — GET Request

```json
{
  "operation": "http:get",
  "input": {
    "url": "https://api.example.com/data",
    "headers": { "Accept": "application/json" },
    "queryParams": { "q": "test", "limit": 10 }
  }
}
```

### http:post — POST Request (and PUT, DELETE, PATCH)

```json
{
  "operation": "http:post",
  "input": {
    "url": "https://api.example.com/submit",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": { "name": "Alice", "role": "analyst" }
  }
}
```

The `method` parameter defaults to POST but can be set to `PUT`, `DELETE`, or `PATCH`.

### Response Format

Both operations return:

```json
{
  "status": 200,
  "body": "{\"result\": \"success\"}",
  "headers": { "content-type": "application/json" }
}
```

The `body` is always a string — JSON responses must be parsed by the caller.

## Input Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full URL (HTTP or HTTPS) |
| `method` | string | No | HTTP method (GET, POST, PUT, DELETE, PATCH) |
| `headers` | object | No | Request headers as key-value pairs |
| `queryParams` | object | No | Query parameters (URL-encoded automatically) |
| `body` | object | No | Request body (JSON-serialised automatically) |

## Timeouts

- Connection timeout: 10 seconds
- Request timeout: 30 seconds
- No automatic retries

## Security

The adapter includes SSRF (Server-Side Request Forgery) protection:

- Blocks requests to private/internal network addresses (loopback, site-local, link-local) by default
- Only HTTP and HTTPS schemes are permitted
- Venue operators can configure allow lists for specific internal hosts

## Related

- [Grid Adapter](./grid-adapter) — for invoking operations on other Covia venues (use Grid, not HTTP)
- [REST API](/docs/user-guide/api) — the venue's own HTTP API
