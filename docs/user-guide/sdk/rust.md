---
sidebar_position: 5
---

# Rust SDK

:::info Coming Soon
The Rust SDK is planned for future development. This page outlines the intended API design.
:::

The Rust SDK will provide a high-performance, memory-safe client for the Covia Grid, suitable for systems programming, embedded applications, and performance-critical workloads.

## Planned Features

- **Async-first** with Tokio runtime support
- **Zero-copy** deserialization where possible
- **Builder pattern** for configuration
- **Strong typing** with Rust's type system
- **`no_std` compatible** core for embedded use cases

## Installation

```toml
# Cargo.toml
[dependencies]
covia = "0.1"
```

## Planned API

### Connecting to a Venue

```rust
use covia::{Grid, Venue};

#[tokio::main]
async fn main() -> Result<(), covia::Error> {
    // Connect using a URL
    let venue = Grid::connect("https://venue.covia.ai").await?;

    // Connect using a DID
    let venue = Grid::connect("did:web:venue.covia.ai").await?;

    // With authentication
    let venue = Grid::builder("https://venue.covia.ai")
        .bearer_auth("your-token")
        .timeout(Duration::from_secs(30))
        .build()
        .await?;

    Ok(())
}
```

### Invoking Operations

```rust
use covia::Job;
use serde_json::json;

// Invoke and wait for result
let job = venue.invoke("my-operation", json!({"prompt": "hello"})).await?;
let result = job.result().await?;
println!("{:?}", result);

// Synchronous-style run
let output = venue.run("my-operation", json!({"prompt": "hello"})).await?;
```

### Working with Assets

```rust
// List assets
let assets = venue.list_assets().await?;

// Get an asset
let asset = venue.get_asset("abc123def456...").await?;
println!("Name: {}", asset.name().unwrap_or("unnamed"));

// Download content
let content: Vec<u8> = venue.get_asset_content("abc123def456...").await?;

// Upload content
let hash = venue.put_asset_content("abc123def456...", &content).await?;
```

### Error Handling

```rust
use covia::error::{CoviaError, GridError, AssetNotFoundError};

match venue.get_asset("missing").await {
    Ok(asset) => println!("Found: {}", asset.id()),
    Err(CoviaError::NotFound(e)) => println!("Not found: {}", e.asset_id()),
    Err(CoviaError::Grid(e)) => println!("API error {}: {}", e.status_code(), e.message()),
    Err(CoviaError::Connection(e)) => println!("Connection failed: {}", e),
    Err(e) => println!("Other error: {}", e),
}
```

### Streaming

```rust
use futures::StreamExt;

let mut stream = job.stream().await?;
while let Some(event) = stream.next().await {
    let event = event?;
    println!("Event: {:?}, Data: {}", event.event, event.data);
}
```

## Design Goals

| Goal | Approach |
|------|----------|
| Performance | Zero-copy deserialization, connection pooling via `hyper` |
| Safety | Rust ownership model, no `unsafe` in public API |
| Ergonomics | Builder pattern, `?` operator for error propagation |
| Compatibility | `serde` for serialization, `tokio` for async runtime |
| Portability | Optional `no_std` core crate for embedded targets |

## Related Documentation

- [SDK Overview](./) - Comparison of all Covia SDKs
- [REST API Reference](../api) - Direct HTTP API documentation
