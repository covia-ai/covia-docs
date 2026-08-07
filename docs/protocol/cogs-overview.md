---
sidebar_position: 4
---

# COG Specifications

COGs (Covia Open Grid specifications) are formal documents that define the technical standards, protocols, and governance mechanisms of the grid ecosystem. Each COG specifies one aspect of the system and progresses through the [community governance process](./governance). All COGs are currently at Draft status; none has yet been formally approved.

## What are COGs?

COGs are the formal technical specifications that define:

- **Protocol Standards**: Core protocol specifications and message formats
- **Security Standards**: Cryptographic primitives, authentication, and authorisation
- **Network Standards**: Federation, discovery, and cross-venue routing
- **Data Standards**: Asset formats, artifacts, and metadata

## Available COGs

COG numbers identify topics, not chronology: numbers are assigned when a topic enters the process, and the specifications are written and revised at different times — a lower number does not imply an earlier or more mature document.

### Core Protocol Specifications

- **[COG-1](./cogs/COG-001)** - Architecture
- **[COG-2](./cogs/COG-002)** - Decentralised ID
- **[COG-3](./cogs/COG-003)** - Authentication Mechanisms
- **[COG-4](./cogs/COG-004)** - Grid Lattice
- **[COG-5](./cogs/COG-005)** - Asset Metadata
- **[COG-6](./cogs/COG-006)** - Artifacts
- **[COG-7](./cogs/COG-007)** - Operations
- **[COG-8](./cogs/COG-008)** - Jobs
- **[COG-9](./cogs/COG-009)** - Agent Messaging
- **[COG-10](./cogs/COG-010)** - Venue Authentication & Access Control
- **[COG-11](./cogs/COG-011)** - Agent Lifecycle *(exploratory draft — superseded in practice by session-based agents; see [Sessions](../user-guide/agents/sessions))*
- **[COG-12](./cogs/COG-012)** - Orchestrations
- **[COG-13](./cogs/COG-013)** - Agent Capabilities
- **[COG-14](./cogs/COG-014)** - A2A Agent Interoperability *(not yet implemented)*
- **[COG-15](./cogs/COG-015)** - Cross-Venue Federation
- **[COG-16](./cogs/COG-016)** - Human-in-the-Loop Requests
- **[COG-17](./cogs/COG-017)** - Capability Granting
- **[COG-18](./cogs/COG-018)** - Agent Skills
- **[COG-19](./cogs/COG-019)** - HITL Self-Sovereign Token Transport

## COG Development Process

Each COG follows a structured development process:

1. **Proposal**: Community members propose new COGs or updates to existing ones
2. **Discussion**: Open community discussion and technical analysis
3. **Drafting**: Formal specification drafting with community input
4. **Review**: Technical and security review of reference implementations by experts
5. **Acceptance**: Approval for official adoption across the ecosystem

## Contributing to COGs

To contribute to COG development:

1. **Join the community** on Discord and GitHub
2. **Review existing COGs** to understand the current specifications
3. **Propose improvements** or new specifications through the governance process
4. **Participate in discussions** and technical reviews
5. **Help implement** and test COG specifications

## COG Status

Each COG carries a status indicating its development stage. The stages currently in use are:

- **Exploratory Draft**: An early sketch that may be substantially revised or superseded
- **Draft (Work in Progress)**: Actively being written; sections may be incomplete
- **Draft**: A complete draft under community review

Later stages — **Proposed** (ready for community decision), **Approved** (formally adopted), and **Deprecated** (superseded) — are defined by the [governance process](./governance); no COG has yet reached them.

*Note: COG specifications are expected to evolve based on community feedback and real-world implementation experience.*