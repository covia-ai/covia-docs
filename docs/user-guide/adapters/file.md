---
id: file
title: File Adapter
sidebar_label: File
---

# File Adapter

The File adapter gives agents and operations **root-jailed access to a local filesystem**. An operator configures one or more named *roots*; every `file:` operation works relative to a root and cannot escape it. Roots can be host directories, ephemeral temp directories, or [DLFS](./dlfs)-backed drives.

## Operations

| Operation | Ability | Purpose |
|-----------|---------|---------|
| `file:roots` | read | List the configured roots |
| `file:list` | read | List the entries in a directory |
| `file:tree` | read | Tab-indented text tree of a directory (for LLM consumption) |
| `file:read` | read | Read a file (text, bytes, or JSON) |
| `file:stat` | read | File metadata |
| `file:write` | write | Write/replace a file |
| `file:append` | write | Append to a file |
| `file:mkdir` | write | Create a directory |
| `file:delete` | delete | Delete a file or directory |

Every operation except `file:roots` takes a `root` (the configured root name) and a `path` relative to it.

## Configuring roots

Roots are declared in the venue config under `file.roots`. A root is either a bare host-path string or a map:

```json5
{
  "file": {
    "roots": {
      // string form → a host directory (must already exist)
      "workspace": "/srv/agent-workspace",

      // map form → explicit options
      "data":  { "path": "/srv/reference", "readOnly": true, "description": "Shared reference data" },
      "scratch": { "temp": true },                 // ephemeral, removed on JVM exit
      "notes": { "dlfs": "user-notes" }            // backed by a DLFS drive
    }
  }
}
```

Per-root options:

| Option | Meaning |
|--------|---------|
| `path` | Host filesystem path (canonicalised; must exist) |
| `temp` | `true` creates an ephemeral directory, auto-removed on shutdown |
| `dlfs` | Name of a [DLFS](./dlfs) drive to back the root (per-user, signed) |
| `readOnly` | Reject all writes/deletes through this root |
| `description` | Operator note, surfaced to agents via `file:roots` |
| `prefix` | Name prefix for a temp directory (default `covia-<name>-`) |

Exactly one of `path`, `temp`, or `dlfs` must be set. If no roots are configured, the venue provides a single ephemeral `tmp` root.

`file:roots` returns each root's `name`, `path` (or `dlfs:<drive>`), `kind` (`host` / `temp` / `dlfs`), `readOnly`, and optional `description`.

## Reading

`file:read` decodes by `mode` — `auto` (default; UTF-8 text when it looks like text, otherwise base64), `text`, `bytes` (base64), or `json` (parsed value returned in `value`):

```json
{ "operation": "file:read", "input": { "root": "workspace", "path": "notes/daily.md" } }
```

```json
{ "content": "# Daily notes\n...", "encoding": "utf-8", "size": 1280, "mime": "text/markdown" }
```

`file:tree` renders a compact, tab-indented walk that's cheap for an LLM to read. It is bounded by `maxDepth` (default 3, max 10) and `maxEntries` (default 500, max 5000); `truncated: true` signals the cap was hit. Pass `info: "size"` to annotate files with a human-readable size:

```json
{ "operation": "file:tree", "input": { "root": "workspace", "maxDepth": 2, "info": "size" } }
```

```
workspace/
	notes/
		daily.md (1.2 KB)
	report.pdf (2.3 MB)
```

## Writing

`file:write` and `file:append` take exactly one content source: `content` (UTF-8 text), `value` (written as JSON), `bytes` (base64), or `asset` (an asset reference streamed to the file). Writing requires the file's parent directory to exist; `file:mkdir` with `parents: true` creates intermediates. Writes through a `readOnly` root are rejected.

```json
{ "operation": "file:write", "input": { "root": "workspace", "path": "out/result.json", "value": { "ok": true } } }
```

`file:delete` removes a file or empty directory; pass `recursive: true` to delete a non-empty directory. It never deletes the root itself.

## Safety

Every path is **root-jailed**. Absolute paths, drive-rooted or UNC paths, and `..` escapes are rejected before any filesystem access. For host roots the adapter additionally resolves symlinks (`toRealPath`) and rejects any path — including one reached through a symlink or a dangling link — that would resolve outside the root. A leading `/` on a path is treated as "relative to the root", not the host root.

## Capabilities

`file:` operations are capability-gated. When an agent has a `caps` list (or a request carries UCAN proofs), each call is checked against the required ability and a `file://<root>/<path>` resource:

```json
"caps": [
  { "with": "file://workspace/", "can": "crud/write" },
  { "with": "file://data/",      "can": "crud/read" }
]
```

Reads map to `crud/read`, writes/mkdir/append to `crud/write`, and delete to `crud/delete`. A denied call returns a structural error explaining what was required and what the agent holds — see [Capabilities](../capabilities).

## Related

- [DLFS](./dlfs) — the decentralised file system that can back a root
- [Capabilities](../capabilities) — the UCAN model gating `file:` operations
- [Creating Agents](../agents/creating-agents) — giving an agent `file:` tools and caps
