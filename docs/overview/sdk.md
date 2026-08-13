---
sidebar_position: 7
---

# SDK

Covia SDKs are **embeddable Grid clients**. Drop one into an application, a service, or an agent and it becomes a first-class participant on the [Grid](./grid): a single client works with any number of connected [venues](./venues), addressed by URL or DID (`did:web:…`), authenticated with Ed25519 keypairs or bearer tokens, and carries the full Covia capability surface: operations, jobs, assets, agents, secrets, and UCAN capabilities.

| SDK | Package | Install |
|-----|---------|---------|
| [TypeScript / JavaScript](../user-guide/sdk/typescript) | [`@covia/covia-sdk`](https://www.npmjs.com/package/@covia/covia-sdk) | `npm install @covia/covia-sdk` |
| [Python](../user-guide/sdk/python) | [`covia`](https://pypi.org/project/covia/) | `pip install covia` |
| [Java](../user-guide/sdk/java) | [`ai.covia:covia-core`](https://central.sonatype.com/artifact/ai.covia/covia-core) | Maven Central |
| [Rust](../user-guide/sdk/rust) | Not yet published | Planned |

The Java SDK is the reference implementation. Each language page carries full setup, authentication, and the complete API surface.

## The shape of the API

Connect once (`Grid.connect(urlOrDid)`) and every operation in the venue's catalog is a call away. A single call gives your application durable memory on a venue you control:

```python
venue.run("v/ops/covia/write", {
    "path": "w/memory/preferences",
    "value": "British English, concise replies",
})
```

The call looks the same in every language; see the language pages above for the exact idiom.

That value now lives in the venue's governed workspace: it survives restarts, any authorised client or agent can read it back, and the write itself is recorded as an auditable [job](../user-guide/api/). Because operations are self-describing, the same pattern covers everything a venue can do (LLM calls, agent tasks, scheduled work, federated invocations on remote venues), with no per-integration client to generate.

No SDK for your language? Every venue speaks the same [REST API](../user-guide/api/); the SDKs are ergonomic bindings over it, so anything they do, any HTTP client can do.

## Compatibility

SDKs version independently of the platform. Pre-1.0 the REST surface is additive: older SDKs generally keep working against newer venues, while newly added operations and fields need a current SDK release.

## Where to go next

- [SDK reference](../user-guide/sdk/): full surface for each language (operations, jobs, assets, agents, secrets, UCAN)
- [Quick Start](../user-guide/quick-start): zero to your first operation
- [REST API](../user-guide/api/): the underlying HTTP interface
