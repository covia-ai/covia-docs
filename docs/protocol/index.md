---
sidebar_position: 1
---

# Grid Protocol

The **Covia Open Grid** protocol is the foundational specification that enables federated AI orchestration and execution across organisational boundaries. A note on names: **Covia Grid** is the product, the live federated network of venues; **Covia Open Grid (COG)** is the open specification series that defines how any implementation joins it. The reference runtime is open source under EPL-2.0, the SDKs are Apache-2.0, and the overall model is open core: the protocol and runtime are open, and commercial offerings build on top without gatekeeping the standard.

## Protocol Components

### Core Specifications

- **[Whitepaper](./whitepaper)** - Outline of the grid protocol design, architecture, and key implementation details
- **[Governance](./governance)** - Protocol governance model, decision-making processes, and community participation guidelines
- **[COG Specifications](./cogs-overview)** - Formal specification documents for the Covia Open Grid

### Key Protocol Features

#### Identity and Trust
- Decentralised identifiers for venues and assets ([COG-2](./cogs/COG-002))
- Authentication mechanisms: bearer tokens, OAuth, self-issued Ed25519 JWTs ([COG-3](./cogs/COG-003), [COG-10](./cogs/COG-010))
- Capability-based authorisation with UCAN delegation and attenuation ([COG-13](./cogs/COG-013), [COG-17](./cogs/COG-017))
- Cross-venue federation with relayed caller identity ([COG-15](./cogs/COG-015))

#### Assets and Data
- Content-addressed, cryptographically verifiable assets and metadata ([COG-5](./cogs/COG-005), [COG-6](./cogs/COG-006))
- Conflict-free state replication on the Grid lattice ([COG-4](./cogs/COG-004))
- Immutable provenance via content-addressed Merkle verification

#### Execution
- Self-describing, invocable operations ([COG-7](./cogs/COG-007))
- Auditable jobs with an immutable state chain ([COG-8](./cogs/COG-008))
- Multi-step orchestrations across venues ([COG-12](./cogs/COG-012))

#### Agents and Humans
- Stateful agent lifecycle and messaging ([COG-11](./cogs/COG-011), [COG-9](./cogs/COG-009))
- A2A interoperability ([COG-14](./cogs/COG-014)) and portable agent skills ([COG-18](./cogs/COG-018))
- Human-in-the-loop requests, consent, and capability granting ([COG-16](./cogs/COG-016), [COG-19](./cogs/COG-019))

## Getting Started

To understand and work with the Covia protocol:

1. **Explore the [Overview section](../overview)** for high-level concepts and architecture
2. **Read the [COG specifications](./cogs-overview)**, the normative protocol documents
3. **Review the [Governance Model](./governance)** to understand how the protocol evolves
4. **Join the community** on [GitHub Discussions](https://github.com/orgs/covia-ai/discussions) or [Discord](https://discord.gg/fywdrKd8QT) to contribute to protocol development and governance

