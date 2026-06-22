---
sidebar_position: 3
---

# Python SDK

The Python SDK provides a Pythonic interface to the Covia Grid with full type safety, sync and async support, and idiomatic error handling.

- **Package:** `covia`
- **Python:** 3.11+
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
venue = Grid.connect("https://venue-3.covia.ai")

# Connect using a DID
venue = Grid.connect("did:web:venue-3.covia.ai")

# Use as a context manager for automatic cleanup
with Grid.connect("https://venue-3.covia.ai") as venue:
    status = venue.status()
    print(status.name)
```

### Invoking Operations

```python
with Grid.connect("https://venue-3.covia.ai") as venue:
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
from covia import Asset

# Register an Asset object (recommended)
asset = venue.register(
    Asset({
        "name": "My Dataset",
        "description": "Sample data for analysis",
        "content": {"contentType": "text/csv"},
    })
)
print(asset.id)    # server-assigned content-addressed ID
print(asset.name)  # "My Dataset"

# Or pass a plain dict
asset = venue.register({
    "name": "My Dataset",
    "description": "Sample data for analysis",
})
```

## Authentication

The SDK supports pluggable authentication via the `auth` parameter on `Grid.connect()`.

### Bearer Token

```python
from covia import Grid
from covia.auth import BearerAuth

venue = Grid.connect(
    "https://venue-3.covia.ai",
    auth=BearerAuth("your-token-here")
)
```

### HTTP Basic

```python
from covia.auth import BasicAuth

venue = Grid.connect(
    "https://venue-3.covia.ai",
    auth=BasicAuth("username", "password")
)
```

### No Authentication

```python
from covia.auth import NoAuth

venue = Grid.connect("https://venue-3.covia.ai", auth=NoAuth())
```

This is the default when `auth` is not specified.

### Ed25519 (Self-Issued JWT)

Authenticate with a self-issued EdDSA JWT using an Ed25519 key pair. This is the recommended method for programmatic access and agent-to-venue communication.

```python
from covia.auth import Ed25519Auth

# Generate a new key pair
auth = Ed25519Auth.generate(audience="https://venue-3.covia.ai")
print(auth.did)  # did:key:z6Mk...

# Or create from an existing seed (deterministic)
auth = Ed25519Auth.from_seed(
    seed=b"32-byte-seed-value-here-12345678",
    audience="https://venue-3.covia.ai"
)

venue = Grid.connect("https://venue-3.covia.ai", auth=auth)
```

The `audience` is automatically set from the venue URL when using `Grid.connect()`. Tokens are short-lived and refreshed automatically.

Requires the `signing` extra:

```bash
pip install covia[signing]
```

### Custom Authentication

Implement the `Auth` interface for custom schemes (OAuth 2.0, etc.):

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
op = venue.get_operation("v/ops/schema/infer")

# Invoke by operation name
job = venue.invoke("v/ops/schema/infer", {"value": {"name": "Ada", "age": 36}})

# Invoke by asset ID
job = venue.invoke("abc123def456...")

# Invoke by DID URL
job = venue.invoke("did:key:z6Mk.../a/abc123def456...")
```

## Agents, Secrets, Workspace & UCANs

The venue exposes typed managers for the `v/ops/*` operations as lazy
properties: `venue.agents`, `venue.secrets`, `venue.workspace`, `venue.ucan`.

### Agents

```python
# Create (or update in place with overwrite=True)
venue.agents.create("Alice", config={
    "systemPrompt": "You are a helpful assistant.",
    "model": "gpt-5.4-mini",
    "tools": ["v/ops/covia/read", "v/ops/covia/list"],
}, overwrite=True)

# Session-scoped chat — omit session_id on the first call, then reuse it
reply = venue.agents.chat("Alice", "Hi Alice")
follow = venue.agents.chat("Alice", "And the next step?", session_id=reply.sessionId)

# Task request (wait=True blocks for the result)
result = venue.agents.request("Alice", {"question": "Summarise the records"}, wait=True)

# Inspection and lifecycle
info = venue.agents.query("Alice")   # status, state, config, tasks
venue.agents.suspend("Alice")
venue.agents.resume("Alice")
venue.agents.delete("Alice")
```

### Secrets

```python
venue.secrets.set("OPENAI_API_KEY", "sk-...")
names = venue.secrets.list()
venue.secrets.delete("OPENAI_API_KEY")
# extract requires a UCAN capability grant
value = venue.secrets.extract("OPENAI_API_KEY").value
```

### Workspace (lattice)

```python
venue.workspace.write("w/config", {"theme": "dark"})
result = venue.workspace.read("w/config")
print(result.value)                       # {"theme": "dark"}
listing = venue.workspace.list("w/")      # keys / values under a path
venue.workspace.append("w/events", {"type": "invoice_received"})
venue.workspace.slice("w/events", offset=0, limit=10)
venue.workspace.delete("w/config")
```

Paths resolve against the caller's own DID; see [Capabilities](../capabilities)
for the cross-user access model.

### UCAN delegation

```python
from covia import UCANAttenuation

result = venue.ucan.issue(
    "did:key:z6MkBob...",                                       # audience (delegatee) DID
    [UCANAttenuation(with_="did:key:z6MkAlice.../w/shared", can="crud/read")],
    expiry=2_000_000_000,                                       # unix seconds
)
token = result["token"]
```

## Discovery

Venues expose standard discovery endpoints for interoperability.

```python
# DID Document (W3C Decentralized Identifier)
doc = venue.did_document()
print(doc.id)       # "did:key:z6MkovQ9..."
print(doc.context)  # "https://www.w3.org/ns/did/v1"

# Cached DID (fetched once, then cached)
did = venue.did     # "did:key:z6MkovQ9..."

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
    async with AsyncGrid.connect("https://venue-3.covia.ai") as venue:
        # All methods are awaitable
        status = await venue.status()
        result = await venue.run("my-operation", {"prompt": "hello"})
        print(result)

asyncio.run(main())
```

:::note Async property differences
Some sync properties become async methods. For example, `venue.did` (sync) becomes `await venue.get_did()` (async).
:::

### Concurrent Operations

```python
async def run_parallel():
    async with AsyncGrid.connect("https://venue-3.covia.ai") as venue:
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
    "https://venue-3.covia.ai",
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
    with Grid.connect("https://venue-3.covia.ai") as venue:
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
venue = Grid.connect("https://venue-3.covia.ai", timeout=60)
```

### Custom Headers

```python
venue = Grid.connect(
    "https://venue-3.covia.ai",
    headers={"X-Request-ID": "abc123"}
)
```

### Combining Options

```python
from covia.auth import BearerAuth

venue = Grid.connect(
    "did:web:venue-3.covia.ai",
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
├── Venue                # Venue interaction; typed managers: venue.agents,
│                        #   venue.secrets, venue.workspace, venue.ucan
├── Job                  # Job lifecycle (wait, result, cancel, stream)
├── Asset                # Asset metadata and content
├── JobStatus            # Status enum (PENDING, STARTED, COMPLETE, ...)
├── auth                 # Auth, NoAuth, BearerAuth, BasicAuth, Ed25519Auth
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
