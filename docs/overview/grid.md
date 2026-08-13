---
sidebar_position: 2
---

# Grid

The **Grid** is the federated network that Covia venues form together. Each [venue](./venues) is a node that hosts operations and persists state; venues talk to each other, so a workflow running on one venue can invoke an operation on another — in a different cloud or jurisdiction — while the data stays where it's governed and only results cross the boundary.

There is no central coordinator. A venue has a DID identity, exposes the same multi-protocol surface (REST, MCP, A2A), and federates with peers directly.

## What the Grid gives you

- **Federated execution** — call an operation on a remote venue exactly as you'd call a local one, with caller identity propagated for audit and access control. See the [Grid adapter](../user-guide/adapters/grid-adapter) (`grid:run`, `grid:invoke`).
- **Content-addressed assets** — operations, artifacts, and data are identified by the cryptographic hash of their metadata (see [COG-5](../protocol/cogs/COG-005)), so the same asset is the same everywhere on the Grid.
- **Verifiable state** — built on [lattice technology](https://docs.convex.world/docs/overview/lattice), state merges deterministically and every job leaves an auditable record.
- **Governance at the edge** — each venue enforces its own [authentication](../operator-guide/auth) and [capabilities](../user-guide/capabilities); trust is established between venues, not delegated to a centre.

## Where to go next

- [Venues](./venues) — what a single node is and does
- [Grid adapter](../user-guide/adapters/grid-adapter) — invoking operations across venues
- [Federation tutorial](../user-guide/tutorials/federation) — run two venues and call across them
- [COG-15: Cross-Venue Federation](../protocol/cogs/COG-015) — how caller identity and authority cross the venue boundary
- [Quick Start](../user-guide/quick-start) — call a live venue in a few minutes
- [Protocol](../protocol/) — the COG specifications behind the Grid
