---
title: DLFS
sidebar_label: DLFS
sidebar_position: 8
---

# DLFS (Decentralised Lattice File System)

DLFS provides self-sovereign, decentralised file storage on Covia venues. Each user gets per-user drives that are cryptographically signed with their own Ed25519 key, stored in an independent lattice region, and portable across venues.

## Key Properties

- **User-signed** — every write is signed by the user's own key, not the venue's
- **Lattice-backed** — drives use CRDT merge semantics for conflict-free cross-venue synchronisation
- **Portable** — users can migrate drives to another venue by exporting their key
- **Isolated** — DLFS occupies a separate lattice region from venue state; the venue operator cannot forge modifications

## Drives

Each user can create and manage multiple named drives. A drive is a named file system root.

```json
// Create a drive
{ "operation": "dlfs:createDrive", "input": { "name": "documents" } }

// List your drives
{ "operation": "dlfs:listDrives" }
// → { "drives": ["documents", "health-vault", "archive"] }

// Delete a drive and all its contents
{ "operation": "dlfs:deleteDrive", "input": { "name": "archive" } }
```

Drive creation is idempotent — creating the same drive twice succeeds without error. The first write to a drive also auto-creates it if needed.

## File Operations

All file operations take a `drive` name and a `path` within that drive.

### Reading Files

```json
{ "operation": "dlfs:read", "input": { "drive": "documents", "path": "report.json" } }
```

**Response:**

```json
{ "content": "{\"title\": \"Q1 Report\"...}", "encoding": "utf-8", "size": 2048 }
```

Text files are returned as UTF-8 strings. Binary files (images, PDFs) are returned as Base64-encoded strings with `"encoding": "base64"`.

### Writing Files

```json
// Write inline text content
{
  "operation": "dlfs:write",
  "input": {
    "drive": "documents",
    "path": "report.json",
    "content": "{\"title\": \"Q1 Report\", \"status\": \"draft\"}"
  }
}

// Write from a Covia asset (for binary files)
{
  "operation": "dlfs:write",
  "input": {
    "drive": "documents",
    "path": "logo.png",
    "asset": "/a/0x7a8b9c0d..."
  }
}
```

Creates the file if absent, overwrites if it exists. Returns `{written: <bytes>, created: <boolean>}`.

### Listing Directories

```json
{ "operation": "dlfs:list", "input": { "drive": "documents", "path": "reports" } }
```

**Response:**

```json
{
  "entries": [
    { "name": "q1-report.json", "type": "file", "size": 2048 },
    { "name": "q2-report.json", "type": "file", "size": 3100 },
    { "name": "attachments", "type": "directory" }
  ]
}
```

Omit `path` to list the drive root.

### Creating Directories

```json
{ "operation": "dlfs:mkdir", "input": { "drive": "documents", "path": "reports/2026" } }
```

Parent directories must already exist.

### Deleting Files

```json
{ "operation": "dlfs:delete", "input": { "drive": "documents", "path": "reports/draft.json" } }
```

Cannot delete non-empty directories — delete contents first.

## Operations Reference

| Operation | Input | Description |
|-----------|-------|-------------|
| `dlfs:listDrives` | — | List all drives for the caller |
| `dlfs:createDrive` | `name` | Create a named drive (idempotent) |
| `dlfs:deleteDrive` | `name` | Delete a drive and all contents |
| `dlfs:list` | `drive`, `path?` | List directory entries |
| `dlfs:read` | `drive`, `path` | Read file content |
| `dlfs:write` | `drive`, `path`, `content?` or `asset?` | Write file content |
| `dlfs:mkdir` | `drive`, `path` | Create a directory |
| `dlfs:delete` | `drive`, `path` | Delete a file or empty directory |

## WebDAV

DLFS drives can be mounted as network file systems via WebDAV, enabling drag-and-drop access from native file managers and desktop applications.

### Enabling WebDAV

WebDAV must be enabled in venue configuration:

```json
{
  "webdav": { "enabled": true }
}
```

### Endpoint

WebDAV is served at `/dlfs/` on the venue:

```
https://your-venue.example.com/dlfs/{drive-name}/{path}
```

Standard WebDAV verbs are supported:

| Verb | Example | Effect |
|------|---------|--------|
| `GET` | `/dlfs/documents/report.json` | Read file |
| `PUT` | `/dlfs/documents/report.json` | Write file |
| `PROPFIND` | `/dlfs/documents/` | List directory |
| `MKCOL` | `/dlfs/documents/new-folder` | Create directory |
| `DELETE` | `/dlfs/documents/temp.txt` | Delete file |

### Mounting as a Network Drive

DLFS drives can be mounted as a native network drive on Windows, macOS, and Linux. Authentication uses your venue credentials (username/password or API token).

#### Windows (File Explorer)

1. Open **File Explorer** → right-click **This PC** → **Map network drive…**
2. Choose a drive letter (e.g. `Z:`)
3. In **Folder**, enter:
   ```
   https://your-venue.example.com/dlfs/documents
   ```
4. Tick **Connect using different credentials**, click **Finish**
5. Enter your venue username and password when prompted

From PowerShell or `cmd`:

```
net use Z: https://your-venue.example.com/dlfs/documents /user:alice
```

:::tip
If Windows refuses `https://` URLs, ensure the **WebClient** service is running (`services.msc` → WebClient → Start, set to Automatic). Windows also enforces a default 50 MB WebDAV file-size limit — raise `FileSizeLimitInBytes` under `HKLM\SYSTEM\CurrentControlSet\Services\WebClient\Parameters` if you transfer larger files.
:::

#### macOS (Finder)

1. In Finder, press `⌘K` (or **Go → Connect to Server…**)
2. Enter the server URL:
   ```
   https://your-venue.example.com/dlfs/documents
   ```
3. Click **Connect** and authenticate with your venue credentials

The drive appears under **Locations** in Finder.

#### Linux (davfs2)

```bash
sudo apt install davfs2
sudo mkdir -p /mnt/dlfs
sudo mount -t davfs https://your-venue.example.com/dlfs/documents /mnt/dlfs
```

For unattended mounts, add credentials to `/etc/davfs2/secrets` and an entry to `/etc/fstab`.

#### rclone (cross-platform)

Configure a WebDAV remote once with `rclone config` (vendor: `other`), then:

```bash
rclone mount dlfs:documents ~/dlfs --vfs-cache-mode writes
```

## Security

### Key Management

When a user first accesses DLFS, the adapter generates a unique Ed25519 keypair. The private key is encrypted and stored in the venue's secret store. Every operation on that user's drives is signed with this key.

### Access Control

- Each user can only access their own drives
- The venue operator cannot modify a user's drives (modifications require the user's signature)
- Anonymous requests are rejected — all DLFS operations require authentication

### Cross-Venue Portability

Because drives are signed by the user's key rather than the venue's:
1. Export the DLFS key seed
2. Import it on another venue
3. Access your drives unchanged

The venue cannot lock users in via cryptographic ownership.

## Merge Semantics

DLFS uses timestamp-wins CRDT merge:
- When two venues modify the same file, the newest version wins
- Changes made offline are stored locally and sync when reconnected
- No manual conflict resolution — merging is automatic and deterministic

## Related

- [Vault](./vault) — simplified DLFS wrapper for health vault access
- [REST API](/docs/user-guide/api) — HTTP endpoints
