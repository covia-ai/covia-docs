---
sidebar_position: 3
---

# Python SDK

:::info Coming Soon
The Python SDK is currently under development. This page documents the planned API.
:::

The Python SDK provides a Pythonic interface to the Covia Grid, designed for data science, ML workflows, and scripting.

## Installation

```bash
pip install covia
```

## Quick Start

### Connecting to a Venue

```python
import covia

# Connect using a DID
venue = covia.connect("did:web:venue-test.covia.ai")

# With authentication
venue = covia.connect(
    "did:web:venue-test.covia.ai",
    api_key="your-api-key"
)
```

### Discovering Assets

```python
# List all assets
assets = venue.list_assets()

# Get a specific asset
asset = venue.get_asset("0x119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607")

# Access metadata
print(asset.name)
print(asset.description)
print(asset.metadata)
```

### Invoking Operations

```python
# Find an operation
op = venue.get_asset("0x7a8b9c0d...")

# Invoke asynchronously
job = await op.invoke({
    "url": "https://example.com/data",
    "format": "json"
})

# Wait for result
await job.wait()

# Access output
if job.status == "completed":
    print(job.output)
else:
    print(f"Error: {job.error}")
```

### Synchronous Execution

```python
# Run and get result directly
result = op.run({"query": "hello world"})
```

### Working with Artifacts

```python
# Download artifact content
content = asset.get_content()

# As bytes
data = content.read()

# As pandas DataFrame (for CSV/JSON)
import pandas as pd
df = pd.read_csv(asset.get_content())

# Save to file
asset.download("local_file.csv")
```

### Uploading Assets

```python
# Create and upload an artifact
asset_id = venue.create_artifact(
    name="My Dataset",
    description="Sample data",
    content_type="text/csv",
    file_path="data.csv"
)

# Or with bytes
asset_id = venue.create_artifact(
    name="Processed Data",
    content_type="application/json",
    content=json.dumps(data).encode()
)
```

## Async Support

The SDK supports both sync and async patterns:

```python
import asyncio

async def main():
    venue = await covia.connect_async("did:web:venue-test.covia.ai")

    # Run multiple operations concurrently
    jobs = await asyncio.gather(
        op1.invoke({"input": "a"}),
        op2.invoke({"input": "b"}),
        op3.invoke({"input": "c"})
    )

    results = await asyncio.gather(*[job.wait() for job in jobs])

asyncio.run(main())
```

## Integration with ML Frameworks

### LangChain

```python
from covia.integrations import CoviaToolkit

# Create LangChain tools from Covia operations
toolkit = CoviaToolkit(venue)
tools = toolkit.get_tools()

# Use with LangChain agent
from langchain.agents import initialize_agent
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")
```

### Pandas

```python
import pandas as pd

# Load artifact directly as DataFrame
df = venue.get_artifact_as_dataframe("0x119e30db...")

# Save DataFrame as artifact
asset_id = venue.save_dataframe(df, name="Analysis Results")
```

## Error Handling

```python
from covia.exceptions import (
    CoviaConnectionError,
    AssetNotFoundError,
    OperationFailedError
)

try:
    result = op.run({"query": "test"})
except AssetNotFoundError:
    print("Operation not found")
except OperationFailedError as e:
    print(f"Operation failed: {e.error}")
except CoviaConnectionError as e:
    print(f"Connection error: {e}")
```

## Configuration

```python
import covia

# Global configuration
covia.configure(
    timeout=30,
    retries=3,
    verify_ssl=True
)

# Per-venue configuration
venue = covia.connect(
    "did:web:venue-test.covia.ai",
    timeout=60,
    headers={"X-Custom-Header": "value"}
)
```

## Related Documentation

- [API Reference](../api) - REST API documentation
- [LangChain Adapter](../adapters/langchain-adapter) - LangChain integration
