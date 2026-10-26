---
title: Architecture
sidebar_label: Architecture
sidebar_position: 3
---

# Architecture

This page is the technical evaluator's tour: the problem the architecture answers, the system model, the substrate it stands on, and why the guarantees hold. Each section links to the reference material that goes deeper.

## The problem, stated precisely

AI systems are becoming distributed, multi-party workforces spanning APIs, clouds, internal services, and external data. In practice every multi-agent deployment today is a bespoke integration: orchestration logic embedded in each agent, credentials shared across trust boundaries, no durable state, and no verifiable record of what an agent did. That becomes acute the moment regulators, partners, or your own incident review demand evidence.

Covia treats this as an infrastructure-layer problem and approaches it the way prior coordination layers were built: an open protocol (the [Covia Open Grid specifications](../protocol/cogs-overview), under open governance), a reference runtime (the venue, open source under EPL-2.0), and a state substrate chosen so that federation, provenance, and fine-grained authority are structural properties rather than bolted-on features. Four goals drive the design:

- **Federation without centralised control**: workflows span organisations, clouds, and jurisdictions with no central coordinator.
- **Verifiable provenance**: every result can be traced and cryptographically validated back to the code and inputs that produced it.
- **Fine-grained authority**: permissions that are scoped, delegable, attenuable, and auditable.
- **Ecosystem compatibility**: native support for the protocols and frameworks the AI ecosystem already uses.

The design lineage is the modularity of HTTP, the operational consistency of Kubernetes, and the verifiability of Git.

## System model

The grid is built from a small set of abstractions. Each is hosted and executed by a venue and addressed under one unified scheme (`<DID>/<namespace>/<path>`):

| Concept | Definition |
| ------- | ---------- |
| **Venue** | A grid node: an execution environment with its own DID identity, trust scope, and policy. Deploys as a single JAR or container. |
| **Asset** | An immutable resource (data, model, or service description) identified by the hash of its metadata, the root of a Merkle tree over its content. |
| **Operation** | An invocable asset, self-describing via JSON Schema input/output, dispatched to a pluggable adapter. |
| **Job** | The execution record of an invocation: long-lived (no framework timeout), streamed over SSE, frozen to an immutable record on completion. The unit of accountability and cost. |
| **Agent** | A persistent actor hosted by a venue, with durable state, a message inbox, an auditable timeline, and a pluggable transition function (LLM, rules, or code). |

Inside a venue, a layered runtime (HTTP server → engine → adapters → lattice storage) dispatches operations to nearly thirty [adapters](../user-guide/adapters/): LLM inference, agents, multi-step orchestration, MCP bridging, cross-venue federation, HTTP, file systems, secrets, and capability issuance. Adapters are the extension mechanism: new execution backends are added without touching the core, and the engine resolves all references to concrete values before dispatch, which is also where authority checks attach.

## The lattice substrate

The most consequential design decision is what sits at the bottom. Distributed systems conventionally choose between a central coordinator and global consensus in the blockchain style. The coordinator is efficient but a single point of trust and failure; global consensus is trustless but expensive and totally ordered, which most workloads do not require.

Covia's substrate is a [lattice](https://docs.convex.world/docs/overview/lattice): a data structure whose merge operation is commutative, associative, and idempotent. Replicas merged in any order converge to the same state (the CRDT property), so venue state replicates peer-to-peer, tolerates partition and reconnection, and cannot diverge. There is no coordinator and no global ledger as a single point of failure.

All values are content-addressed (CAD3 canonical encoding, SHA3-256), so grid state forms Merkle trees verifiable by any peer. The system pairs mutable names with immutable snapshots: operations are authored and iterated under stable paths, pinned to an exact content hash at the moment of invocation; completed jobs freeze into immutable records capturing the pinned operation version, inputs, outputs, executor, and cost. The consequence worth noting: provenance and reproducibility are properties of the data structure, not an audit subsystem that must be maintained per feature.

The architecture separates planes:

- **Data plane**: workloads, agent state, and bulk replication via [DLFS](../user-guide/adapters/dlfs) (a lattice-based decentralised file system) flow entirely over peer-to-peer replication, at conventional infrastructure cost.
- **Trust plane**: identity anchoring, settlement, and tokenisation of AI services can optionally anchor to a public consensus network built on the same lattice mathematics. Globally verifiable consensus is paid for only where it is actually needed.

## Federated execution and provenance

A workflow may span venues operated by different organisations in different jurisdictions. The execution model moves computation to the data: an operation on restricted data (patient records, proprietary datasets) executes inside the venue that governs it, and only results cross the boundary. Output assets carry metadata that chains back to the pinned operations and inputs that produced them, so any party can validate the full lineage of a result across organisational lines without access to the underlying data.

Because a workflow is itself an operation, composition is recursive: a multi-step workflow published by one venue can be invoked as a single step in another's. Combined with content addressing (the same asset ID resolves identically from any venue holding a copy), this is what allows independent deployments to interoperate as one grid rather than as point integrations. See [Cross-Venue Federation (COG-15)](../protocol/cogs/COG-015) and the [federation tutorial](../user-guide/tutorials/federation).

## Authority model

Identity is DID-based and method-agnostic (`did:key` for self-certifying identities, `did:web` for server-backed ones). Authorisation is capability-based using [UCAN tokens](../user-guide/capabilities): signed grants naming a specific resource (`with`) and action (`can`), attenuable and delegable. Capabilities scope down to individual paths: invoke one named operation, decrypt one specific secret, message one specific agent. A delegating agent can pass on a strictly narrower power, so delegation chains mirror organisational authority. Nothing is reachable by default; every action is authorised and recorded.

- **Secrets**: agents reference credentials by path only; the runtime is the single decryption point and injects plaintext at the adapter layer. The LLM-driven reasoning loop never observes credentials.
- **Dual audit**: the job record answers what happened to a given request (the basis for billing, SLAs, and dispute resolution); the agent timeline answers what a given agent did and why. Both are append-only and replayable.
- **Humans in the loop**: a running job can pause for a human answer, approval, or an explicit capability grant ([COG-16](../protocol/cogs/COG-016)), inside the same audit trail, including self-sovereign grants the human signs with their own key ([COG-19](../protocol/cogs/COG-019)).

Venue-signed UCAN issuance, per-request proof presentation, cross-user access verification, and adversarial tests (forged signatures, expired tokens, wrong audience or ability) are implemented; completing enforcement across all namespaces is scheduled work on the open roadmap.

## Interoperability

The runtime separates the substrate from the agent and the agent from the model: agent behaviour is a pluggable transition function (LLM-backed, rule-based, or custom code), and model access is an executor binding that can be swapped without changing callers. Externally, a venue exposes the same capabilities over every major protocol simultaneously:

- **MCP, in both directions**: any MCP client can use a venue as a tool server; the venue can consume any external MCP server as a grid operation. See [MCP integration](../user-guide/mcp/).
- **A2A**: agent-to-agent workflows across vendors and frameworks. See [Covia with A2A](../user-guide/adapters/covia-with-a2a).
- **REST + DID**: the full [API](../user-guide/api/) with interactive OpenAPI docs; venue discovery via standard DID documents.
- **Models**: LangChain4j bindings for OpenAI, Anthropic, Gemini, DeepSeek, xAI, Mistral, OpenRouter, and local models via Ollama.
- **SDKs**: [TypeScript](../user-guide/sdk/typescript) (npm), [Python](../user-guide/sdk/python) (PyPI), and [Java](../user-guide/sdk/java), with Ed25519 keypair and bearer authentication.

The positioning is deliberate: Covia sits beneath existing frameworks, so its integration surface grows with each protocol's ecosystem.

## Deployment model

A venue is one artifact (`docker run` or `java -jar`) that comes up self-describing, with interactive API documentation and working built-in operations. Hosted venues are live on the public internet today, and self-hosting requires no further infrastructure: see the [venue quick start](../operator-guide/venue-start).

The self-hosted agent wave of 2025 and 2026 showed unusually fast bottom-up adoption of self-sovereign agents, and the consequences of running them without an authority model: broad system access, publicised security incidents, and no safe way for agents operated by different parties to interact. Covia fits the same deployment pattern while supplying capability-scoped authority, verifiable provenance, and governed federation. Because the protocol is an open standard, each new venue extends what every participant can reach.

What does your current agent stack record when something goes wrong, and whose signature is on the authority it acted under?
