---
title: Archive
sidebar_label: Archive
---

# Archive Adapter

Real workflows exchange bundles (datasets, document packs, build outputs), and an archive from outside should never be trusted blindly. The archive adapter handles zip and jar files as governed operations: `archive:list` inspects without extracting, `archive:extract` unpacks into a jailed directory, and `archive:zip` builds an archive from files, written to a jailed file or published as a content-addressed [asset](./asset).

## Operations

```json
{
  "operation": "v/ops/archive/zip",
  "input": {
    "root": "work",
    "path": "data",
    "destRoot": "work",
    "destPath": "out.zip"
  }
}
```

Sources for `list` and `extract` are exactly one of: `root` + `path` (a file under a configured [File adapter](./file) root), `asset` (a content-addressed reference), or `bytes` (inline base64). Omit `destRoot`/`destPath` on `zip` and the result is published as an asset in your `a/` namespace instead of written to disk: `{entries, bytes, asset: "did:.../a/<hash>"}`.

## Built for hostile inputs

Archives are a classic attack surface, so the guards are structural:

- **Nothing escapes a root.** Sources and destinations are confined to the File adapter's configured roots; there are no arbitrary filesystem paths.
- **Zip-slip protection.** Every extracted entry is resolved inside the destination's real path; an escaping entry (`../…`) fails the whole job and writes nothing.
- **Zip-bomb guards.** Extraction caps at 100,000 entries and 2 GiB uncompressed; listings cap at 5,000 entries with an explicit `truncated` flag.

## Access Control

Checks are per resource rather than blanket: sources require `crud/read`, destinations require `crud/write` on a writable root, and zip-to-asset requires `asset/store`.

## Related

- [File Adapter](./file): the root jail this builds on
- [Assets](./asset): archives as immutable artifacts
