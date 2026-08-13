---
sidebar_position: 5
---

# Rust SDK

:::info Planned
The Rust SDK is on the roadmap but has not yet been implemented. No package is available.
:::

A Rust SDK for the Covia Grid is planned with the following design goals:

- **Async-first** with Tokio runtime support
- **Zero-copy** deserialisation where possible
- **Builder pattern** for configuration
- **Strong typing** with Rust's type system

## In the Meantime

Use the [REST API](../api) directly from Rust with `reqwest` or any HTTP client. The API is straightforward and well-documented.

## Related Documentation

- [SDK Overview](./) — comparison of all Covia SDKs
- [REST API Reference](../api) — direct HTTP API documentation
