---
title: Vault
sidebar_label: Vault
sidebar_position: 9
---

# Vault Adapter

The Vault adapter provides simplified file access for agents and users by wrapping [DLFS](./dlfs) with a fixed drive name. Instead of specifying a drive on every call, vault operations always target the `"health-vault"` drive.

## Why Use Vault?

When agents need file access, giving them the full DLFS API means they must know which drive to use. The Vault adapter removes that decision — agents get simple `read`, `write`, `list`, `mkdir`, and `delete` tools without needing to manage drive names.

This is especially useful for:
- **Health data agents** that store and retrieve personal health documents
- **Any domain** where agents should work in a single, well-known file space

## Operations

All operations work on the `"health-vault"` drive. Only a `path` is needed.

### Read

```json
{ "operation": "vault:read", "input": { "path": "documents/referral.json" } }
```

Returns `{content, encoding, size}` — identical to `dlfs:read`.

### Write

```json
// Inline content
{ "operation": "vault:write", "input": { "path": "profile.json", "content": "{...}" } }

// From asset
{ "operation": "vault:write", "input": { "path": "scan.pdf", "asset": "/a/0x1234..." } }
```

### List

```json
{ "operation": "vault:list", "input": { "path": "documents" } }
```

Omit `path` to list the vault root.

### Mkdir

```json
{ "operation": "vault:mkdir", "input": { "path": "documents/lab-results" } }
```

### Delete

```json
{ "operation": "vault:delete", "input": { "path": "documents/temp.txt" } }
```

## Operations Reference

| Operation | Input | Description |
|-----------|-------|-------------|
| `vault:read` | `path` | Read file content |
| `vault:write` | `path`, `content?` or `asset?` | Write file content |
| `vault:list` | `path?` | List directory entries |
| `vault:mkdir` | `path` | Create a directory |
| `vault:delete` | `path` | Delete a file or empty directory |

## Giving Agents Vault Access

Add vault operations to an agent's tool list:

```json
{
  "operation": "agent:create",
  "input": {
    "agentId": "health-assistant",
    "config": {
      "systemPrompt": "You are a health data assistant...",
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

## Example: Agent Processing Health Data

```
1. Agent calls vault:list → discovers available health documents
2. Agent calls vault:read path="lab-results/blood-panel.json" → retrieves data
3. Agent processes content, produces analysis
4. Agent calls vault:write path="analysis/blood-panel-summary.json" → stores result
```

All operations are traced to the agent's identity and signed by the user's DLFS key.

## Related

- [DLFS](./dlfs) — full decentralised file system with multi-drive support and WebDAV
- [Agents](/docs/user-guide/agents/) — creating and configuring agents with tools
