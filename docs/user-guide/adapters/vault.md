---
title: Vault
sidebar_label: Vault
sidebar_position: 9
---

# Vault Adapter

The vault is a **protected, venue-hosted file system for each user** — a private space for documents and files that agents can be given controlled access to. Every user's vault is their own: operations always target the caller's personal drive, access is governed by [capabilities](../capabilities) like every other operation, and every read and write is traced to the identity that made it and signed with the user's DLFS key.

Under the hood it is a thin wrapper over [DLFS](./dlfs) bound to a single well-known drive (`vault` by default, operator-configurable below). The drive is created automatically on first access, and the user's signing key is generated for them — no setup step.

## Why Use Vault?

Handing an agent the full DLFS API means it must manage drive names; handing it the vault means five simple tools — `read`, `write`, `list`, `mkdir`, `delete` — that always land in its owner's protected space. Access is as controlled as you choose to make it: give a summarising agent only `vault:read` and `vault:list` and it can never modify a document; every operation it performs lands in the audit trail under its own identity.

## Operations

Only a `path` is needed — the drive is implicit.

### Read

```json
{ "operation": "v/ops/vault/read", "input": { "path": "documents/referral.json" } }
```

Returns `{content, encoding, size}` — identical to `dlfs:read`.

### Write

```json
// Inline content
{ "operation": "v/ops/vault/write", "input": { "path": "profile.json", "content": "{...}" } }

// From asset
{ "operation": "v/ops/vault/write", "input": { "path": "scan.pdf", "asset": "/a/0x1234..." } }
```

### List

```json
{ "operation": "v/ops/vault/list", "input": { "path": "documents" } }
```

Omit `path` to list the vault root.

### Mkdir

```json
{ "operation": "v/ops/vault/mkdir", "input": { "path": "documents/lab-results" } }
```

### Delete

```json
{ "operation": "v/ops/vault/delete", "input": { "path": "documents/temp.txt" } }
```

## Operations Reference

| Operation | Input | Description |
|-----------|-------|-------------|
| `vault:read` | `path` | Read file content |
| `vault:write` | `path`, `content?` or `asset?` | Write file content |
| `vault:list` | `path?` | List directory entries |
| `vault:mkdir` | `path` | Create a directory |
| `vault:delete` | `path` | Delete a file or empty directory |

## Configuration

The operator can rename the backing drive in venue config — useful when a deployment wants a domain-specific vault (a health product might use `health-vault`, for instance):

```json
{
  "adapters": {
    "vault": { "drive": "health-vault" }
  }
}
```

The name must be a valid DLFS drive name — non-empty, with no `/`, `\`, or `:`.

:::caution Encrypt sensitive vaults
Vault data is only as protected as the venue's storage. If the venue has no encrypted storage policy configured, vault contents persist unencrypted — the venue logs a warning at startup. Configure `etch.cipher` and key management before storing sensitive data. See [Persistence](/docs/operator-guide/persistence).
:::

## Giving Agents Vault Access

Add vault operations to an agent's tool list:

```json
{
  "operation": "v/ops/agent/create",
  "input": {
    "agentId": "records-assistant",
    "config": {
      "systemPrompt": "You manage the user's document vault...",
      "tools": [
        "v/ops/vault/read",
        "v/ops/vault/write",
        "v/ops/vault/list",
        "v/ops/vault/mkdir"
      ],
      "defaultTools": false
    }
  }
}
```

## Example: Agent Processing Vault Documents

```
1. Agent calls vault:list → discovers available documents
2. Agent calls vault:read path="reports/q1.json" → retrieves data
3. Agent processes content, produces analysis
4. Agent calls vault:write path="analysis/q1-summary.json" → stores result
```

All operations are traced to the agent's identity and signed by the user's DLFS key.

## Related

- [DLFS](./dlfs) — full decentralised file system with multi-drive support and WebDAV
- [Agents](/docs/user-guide/agents/) — creating and configuring agents with tools
