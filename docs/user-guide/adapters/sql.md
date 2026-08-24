---
title: SQL (module)
sidebar_label: SQL
---

# SQL Adapter

Most of the world's operational data lives in SQL databases — and agents become far more useful the moment they can reach it safely. The SQL adapter — the optional [`ai.covia:covia-sql`](https://central.sonatype.com/artifact/ai.covia/covia-sql) venue module — makes that safe reach real, turning SQL databases into governed grid operations: `sql:query` for reads, `sql:execute` for DDL/DML. Any JDBC database can sit behind it, and every call passes through Covia's capability checks and lands in the audit trail like any other operation.

Callers name a **database, never a JDBC URL** — connection strings live only in operator config, which removes the whole class of attacks where a caller points the venue at an internal host or local file.

## Operations

### sql:query — Read Rows

```json
{
  "operation": "v/ops/sql/query",
  "input": {
    "db": "warehouse",
    "statement": "SELECT id, reading FROM readings WHERE id = ?",
    "params": [7]
  }
}
```

Returns `{columns, rows, count}` — plus `truncated: true` whenever rows were dropped by the cap (`maxRows`, default 1000, hard cap 10,000). Truncation is never silent. Always pass values via `params` and `?` placeholders rather than interpolating into the statement.

### sql:execute — Write

```json
{
  "operation": "v/ops/sql/execute",
  "input": {
    "db": "warehouse",
    "statement": "INSERT INTO readings VALUES (?, ?)",
    "params": [7, "healthy"]
  }
}
```

Returns `{updateCount}` (0 for DDL).

## Databases: shared or personal

A `db` name resolves in one of two ways:

- **Operator-registered connection** — an entry under `adapters.sql.databases.<name>` in venue config, shared by all callers. Any JDBC driver on the classpath works; passwords should be [secret references](./secret) (`s/<name>`), resolved at connect time.
- **Venue-local database** — when no registered entry matches, the venue creates a lattice-backed database scoped to the calling user on first use. Two users using the same `db` name get two isolated databases; an agent shares its owner's. Persistent when `adapters.sql.path` is set, in-memory otherwise.

```json
{
  "modules": ["modules/covia-sql-<version>-module.jar"],
  "adapters": {
    "sql": {
      "path": "storage/sql.etch",
      "databases": {
        "warehouse": {
          "url": "jdbc:postgresql://db.internal:5432/warehouse",
          "user": "covia",
          "password": "s/warehouse-db"
        }
      }
    }
  }
}
```

## Capability precision

Beyond the standard `invoke` check, every call requires the ability `sql/query` or `sql/execute` on the resource **`sql/<db>`**. A [UCAN grant](../capabilities) can therefore delegate exactly one database, read-only — to an agent, or across a trust boundary — and nothing else.

## Agent-ready

The module ships its own [skill](./skills), installed at `v/skills/sql` when loaded: any agent on the venue can discover and pick up governed SQL mid-task, with the parameterisation rules included in what it learns.

## Related

- [Venue modules](/docs/operator-guide/configuration) — loading and pinning module jars
- [Secrets](./secret) — secret references for connection passwords
- [Capabilities (UCAN)](../capabilities) — per-database delegation
