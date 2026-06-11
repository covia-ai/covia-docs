---
title: Persistence
sidebar_position: 3
---

# Persistence

Covia venues persist all state — assets, jobs, agents, secrets, workspace data, and DLFS drives — to an on-disk Etch store backed by lattice technology. This page explains how persistence works, what operators need to configure, and what to expect during shutdown and recovery.

## How It Works

Venue state is persisted via a two-phase background sweep:

```
Component writes → in-memory fork → (every 100ms) → signed root cursor → Etch store (disk)
```

1. **Writes accumulate in a fork** — all mutations (API calls, MCP operations, agent runs, jobs) write to an in-memory fork of the lattice
2. **Daemon sweep (every 100ms)** — a background thread merges the fork into the root cursor with a single Ed25519 signature
3. **Periodic fsync (~every 10s)** — the sweep forces a store-level `fsync` only when at least ~10 seconds have elapsed since the last flush, bounding the data-loss window on an *unclean* host shutdown (kernel panic, power loss, hard VM stop)
4. **Critical writes flush immediately** — job completion, secret rotation, agent termination, and OAuth login trigger a synchronous flush that bypasses the background queue and resets the periodic-fsync timer

No operator configuration is needed for the sweep — it runs automatically.

## Store Configuration

The `store` field in venue configuration controls where state is persisted:

```json
{
  "store": "/path/to/venue.etch"
}
```

| Value | Behaviour |
|-------|-----------|
| `"/path/to/venue.etch"` | **Persistent file store** — state survives restarts. Recommended for production. |
| `"temp"` | **Temporary store** — deleted on exit. Default; suitable for development. |
| `"memory"` | **In-memory only** — no persistence at all. Fastest, but all state lost on exit. |

If `store` is **omitted entirely**, the venue falls back to an ephemeral temp store and logs a warning that data will be deleted on exit. Set `store` to a file path for persistence, or to `"temp"` / `"memory"` to make the choice explicit and silence the warning.

### Venue Identity

When using a persistent file store and no explicit `seed` is configured, the venue auto-generates an Ed25519 keypair and saves it to `venue.key` in the same directory as the Etch store file. On restart with the same store path, the same venue DID is restored — identity is stable across restarts.

## Shutdown

On graceful shutdown, the venue follows a strict ordering to ensure no writes are lost:

1. **Engine closes first** — stops accepting new sweep tasks, waits up to 2 seconds for any in-flight sweep to finish, then runs a final synchronous flush (merges fork, persists to root cursor)
2. **Node server closes second** — reads the root cursor (now guaranteed to contain the engine's final writes), broadcasts final state, and flushes the Etch store

This ordering is critical. The fork pattern means writes sit in memory until explicitly merged. Without the engine-first flush, the node server's shutdown drain would read stale state.

## Recovery

On restart, all state is automatically restored:

1. Etch store restores the lattice root cursor from the last persisted value
2. Engine creates a fresh fork for subsequent writes
3. Job manager scans for PENDING/STARTED jobs and restores their records (jobs that were mid-execution are marked as recoverable; they do not automatically re-execute)
4. Agents with pending work wake automatically via the scheduler
5. DLFS drives are recovered from the independent `:dlfs` lattice region

No manual recovery is needed — restart is idempotent.

## Durability Window

Two intervals matter, because they fail differently:

- **Process kill (SIGKILL):** only writes still in the fork — at most one sweep interval (~100ms) — are at risk. Writes the sweep has already merged and written to the store survive a process kill, because the OS flushes them from its page cache.
- **Unclean host shutdown (kernel panic, power loss, hard VM stop):** writes that reached the store but haven't been `fsync`ed can be lost — up to the periodic-fsync interval (~10s).

Critical operations (job completion, secrets, agent termination, OAuth login) always flush synchronously and are not subject to either window.

## Failure Modes

| Scenario | Behaviour | Recovery |
|----------|-----------|----------|
| **Abrupt process kill (SIGKILL)** | Writes in the fork since the last sweep (≤100ms) are lost; writes already swept to the store survive. | Restart venue; recovered state appears immediately. |
| **Power loss / kernel panic** | Unsynced store writes since the last fsync (≤~10s) may be lost. | Restart venue; state is restored to the last fsync. |
| **Disk full** | Etch store write fails. Sweep logs a warning and retries next cycle. In-memory fork accumulates. | Free disk space; sweep resumes automatically. |
| **Graceful shutdown (SIGTERM)** | Final flush runs; all in-flight writes are persisted. | Clean restart with full state. |

## Monitoring

Watch for these in venue logs:

- **Sweep warnings** — indicate the background sync is failing (disk issues, lock contention)
- **Flush timeouts** — indicate the synchronous barrier is taking longer than expected
- **Recovery messages** on startup — confirm how many jobs and agents were restored

## Related

- [Venue Quick Start](./venue-start) — launching and configuring a venue
- [Authentication](./auth) — configuring authentication for your venue
