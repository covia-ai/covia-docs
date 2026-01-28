---
sidebar_position: 3
---

# Python SDK

The Python SDK provides a Pythonic interface to the Covia Grid with full type safety, sync and async support, and idiomatic error handling.

- **Package:** `covia`
- **Python:** 3.10+
- **License:** Apache-2.0
- **Source:** [covia-ai/covia-sdk-py](https://github.com/covia-ai/covia-sdk-py)

## Installation

```bash
pip install covia
```

For development:

```bash
pip install covia[dev]
```

## Quick Start

### Connecting to a Venue

```python
from covia import Grid

# Connect using a URL
venue = Grid.connect("https://venue.covia.ai")

# Connect using a DID
venue = Grid.connect("did:web:venue.covia.ai")

# Use as a context manager for automatic cleanup
with Grid.connect("https://venue.covia.ai") as venue:
    status = venue.status()
    print(status.name)
```

### Invoking Operations

```python
with Grid.connect("https://venue.covia.ai") as venue:
    # Invoke and get a Job for tracking
    job = venue.invoke("my-operation", {"prompt": "hello"})
    job.wait(timeout=60)
    print(job.output)

    # Or use run() for synchronous one-shot execution
    result = venue.run("my-operation", {"prompt": "hello"}, timeout=60)
```

### Discovering Assets

```python
# List all assets
assets = venue.list_assets()
print(f"Total: {assets.total}")

# With pagination
assets = venue.list_assets(offset=10, limit=20)

# Get a specific asset by ID
asset = venue.get_asset("abc123def456...")
print(asset.name)
print(asset.description)
print(asset.metadata)
```

### Working with Asset Content

```python
# Download binary content
content = venue.get_asset_content("abc123def456...")

# Upload content
content_hash = venue.put_asset_content("abc123def456...", b"file contents")

# Or use the Asset object directly
asset = venue.get_asset("abc123def456...")
content = asset.get_content()
asset.put_content(b"updated content")
```

### Registering Assets

```python
asset_id = venue.register_asset({
    "name": "My Dataset",
    "description": "Sample data for analysis",
    "content": {
        "contentType": "text/csv"
    }
})
```

## Authentication

The SDK supports pluggable authentication via the `auth` parameter on `Grid.connect()`.

### Bearer Token

```python
from covia import Grid
from covia.auth import BearerAuth

venue = Grid.connect(
    "https://venue.covia.ai",
    auth=BearerAuth("your-token-here")
)
```

### HTTP Basic

```python
from covia.auth import BasicAuth

venue = Grid.connect(
    "https://venue.covia.ai",
    auth=BasicAuth("username", "password")
)
```

### No Authentication

```python
from covia.auth import NoAuth

venue = Grid.connect("https://venue.covia.ai", auth=NoAuth())
```

This is the default when `auth` is not specified.

### Custom Authentication

Implement the `Auth` interface for custom schemes (OAuth 2.0, Ed25519 signing, etc.):

```python
from covia.auth import Auth

class OAuth2Auth(Auth):
    def __init__(self, access_token: str):
        self._token = access_token

    def apply(self, headers: dict[str, str]) -> None:
        headers["Authorization"] = f"Bearer {self._token}"

    def __repr__(self) -> str:
        return "OAuth2Auth(***)"
```

## Job Lifecycle

Jobs represent the execution of an operation. They progress through a lifecycle:

```
PENDING → STARTED → COMPLETE | FAILED | CANCELLED | REJECTED | TIMEOUT
```

Jobs may also enter interactive states: `PAUSED`, `INPUT_REQUIRED`, `AUTH_REQUIRED`.

### Tracking Jobs

```python
job = venue.invoke("my-operation", {"x": 1})

# Check status
print(job.status)       # JobStatus.PENDING
print(job.is_finished)  # False
print(job.is_complete)  # False

# Poll for latest status
job.refresh()

# Wait for completion with exponential backoff
job.wait(timeout=120)

# Access the result
if job.is_complete:
    print(job.output)
else:
    print(job.error)
```

### Convenience Methods

```python
# wait + output in one call
output = job.result(timeout=60)

# invoke + wait + output in one call
output = venue.run("my-operation", {"x": 1}, timeout=60)
```

### Cancelling Jobs

```python
job = venue.invoke("long-running-op", {"data": "..."})
# ... later
job.cancel()
```

### SSE Streaming

```python
for event in job.stream():
    print(f"Event: {event.event}, Data: {event.data}")
```

### Managing Jobs

```python
# List all job IDs
job_ids = venue.list_jobs()

# Get a specific job
job = venue.get_job("job-id-here")

# Delete a job record
venue.delete_job("job-id-here")
```

## Operations

Operations are named capabilities exposed by a venue.

```python
# List all available operations
operations = venue.list_operations()
for op in operations:
    print(f"{op.name}: {op.description}")

# Get details of a specific operation
op = venue.get_operation("test:echo")

# Invoke by operation name
job = venue.invoke("test:echo", {"message": "hello"})

# Invoke by asset ID
job = venue.invoke("abc123def456...")

# Invoke by DID URL
job = venue.invoke("did:key:z6Mk.../a/abc123def456...")
```

## Discovery

Venues expose standard discovery endpoints for interoperability.

```python
# DID Document (W3C Decentralized Identifier)
doc = venue.did_document()
print(doc.id)       # "did:web:venue.covia.ai"
print(doc.context)  # "https://www.w3.org/ns/did/v1"

# Cached DID (fetched once, then cached)
did = venue.did     # "did:web:venue.covia.ai"

# MCP Discovery (Model Context Protocol)
mcp = venue.mcp_discovery()
print(mcp.mcp_version)

# A2A Agent Card
card = venue.agent_card()
print(card.agentProvider)
```

## Async API

The SDK provides a full async mirror of the sync API via `covia.async_api`.

```python
import asyncio
from covia.async_api import AsyncGrid

async def main():
    async with AsyncGrid.connect("https://venue.covia.ai") as venue:
        # All methods are awaitable
        status = await venue.status()
        result = await venue.run("my-operation", {"prompt": "hello"})
        print(result)

asyncio.run(main())
```

### Concurrent Operations

```python
async def run_parallel():
    async with AsyncGrid.connect("https://venue.covia.ai") as venue:
        # Launch multiple operations concurrently
        jobs = await asyncio.gather(
            venue.invoke("op-a", {"x": 1}),
            venue.invoke("op-b", {"x": 2}),
            venue.invoke("op-c", {"x": 3}),
        )

        # Wait for all results
        results = await asyncio.gather(
            *[job.result(timeout=60) for job in jobs]
        )
        return results
```

### Async Authentication

Authentication works identically with the async API:

```python
from covia.async_api import AsyncGrid
from covia.auth import BearerAuth

async with AsyncGrid.connect(
    "https://venue.covia.ai",
    auth=BearerAuth("token")
) as venue:
    ...
```

## Error Handling

The SDK provides a structured exception hierarchy:

```
CoviaError                          # Base for all SDK errors
├── GridError                       # HTTP error responses (4xx/5xx)
│   └── NotFoundError               # 404 responses
│       ├── AssetNotFoundError      # Asset not found
│       └── JobNotFoundError        # Job not found
├── CoviaConnectionError            # Connection failures (also: ConnectionError)
├── CoviaTimeoutError               # Timeouts (also: TimeoutError)
└── JobFailedError                  # Job finished with non-COMPLETE status
```

`CoviaConnectionError` and `CoviaTimeoutError` also subclass Python's built-in `ConnectionError` and `TimeoutError`, so you can catch them idiomatically:

```python
from covia import (
    Grid,
    CoviaError,
    GridError,
    NotFoundError,
    AssetNotFoundError,
    JobNotFoundError,
    CoviaConnectionError,
    CoviaTimeoutError,
    JobFailedError,
)

try:
    with Grid.connect("https://venue.covia.ai") as venue:
        result = venue.run("my-operation", {"x": 1}, timeout=30)
except AssetNotFoundError as e:
    print(f"Asset not found: {e.asset_id}")
except JobNotFoundError as e:
    print(f"Job not found: {e.job_id}")
except NotFoundError:
    print("Resource not found")
except GridError as e:
    print(f"API error {e.status_code}: {e.message}")
except JobFailedError as e:
    print(f"Job failed: {e.job_data.error}")
except CoviaConnectionError:
    print("Cannot connect to venue")
except CoviaTimeoutError:
    print("Operation timed out")

# Or catch all SDK errors
except CoviaError:
    print("Something went wrong")

# Or use Python built-in exception types
except TimeoutError:
    print("Timed out")
except ConnectionError:
    print("Connection failed")
```

## Configuration

### Timeouts

```python
# Custom timeout (applies to connect, read, and write)
venue = Grid.connect("https://venue.covia.ai", timeout=60)
```

### Custom Headers

```python
venue = Grid.connect(
    "https://venue.covia.ai",
    headers={"X-Request-ID": "abc123"}
)
```

### Combining Options

```python
from covia.auth import BearerAuth

venue = Grid.connect(
    "did:web:venue.covia.ai",
    timeout=30,
    headers={"X-Tenant": "acme"},
    auth=BearerAuth("token"),
)
```

## Logging

The SDK uses Python's standard `logging` module. By default, no output is produced (the library registers a `NullHandler`).

Enable debug logging to trace HTTP requests, job polling, and DID resolution:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Or target just the SDK:

```python
import logging
logging.getLogger("covia").setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(name)s %(levelname)s %(message)s"))
logging.getLogger("covia").addHandler(handler)
```

### Log Levels

| Level | What's Logged |
|-------|---------------|
| `DEBUG` | HTTP requests/responses, job polling cycles, DID resolution, connections |
| `WARNING` | Plain HTTP connections (no TLS) |

## Module Structure

```
covia
├── Grid                 # Entry point — Grid.connect()
├── Venue                # Venue interaction (assets, jobs, operations, discovery)
├── Job                  # Job lifecycle (wait, result, cancel, stream)
├── Asset                # Asset metadata and content
├── JobStatus            # Status enum (PENDING, STARTED, COMPLETE, ...)
├── auth                 # Auth, NoAuth, BearerAuth, BasicAuth
├── exceptions           # CoviaError, GridError, NotFoundError, ...
├── models               # Pydantic data models (VenueStatus, JobData, ...)
└── async_api            # Full async mirror
    ├── AsyncGrid
    ├── AsyncVenue
    └── AsyncJob
```

## Related Documentation

- [SDK Overview](./) - Comparison of all Covia SDKs
- [REST API Reference](../api) - Direct HTTP API documentation
- [COG-003: Authentication](/docs/protocol/cogs/COG-003) - Authentication specification
- [COG-007: Operations](/docs/protocol/cogs/COG-007) - Operation specification
