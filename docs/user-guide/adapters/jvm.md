---
title: JVM
sidebar_label: JVM
---

# JVM Adapter and Venue Modules

Sometimes the capability you need is code you already have, and it deserves the same catalog entry, capability checks, and audit trail as everything else. That is what the JVM story delivers, at two levels: this adapter ships a few pure in-process utility operations (`v/ops/jvm/string-concat`, `v/ops/jvm/url-encode`, `v/ops/jvm/url-decode`) as orchestration glue:

```json
{
  "operation": "v/ops/jvm/string-concat",
  "input": { "first": "apple", "second": "banana", "separator": "|" }
}
```

The more interesting story is the extension point behind it: **venue modules**, the mechanism by which arbitrary JVM code becomes first-class grid operations.

## Venue modules

A module is an external jar compiled against the venue API that declares its adapter classes via `META-INF/services`. The operator lists it in venue config:

```json
{
  "modules": [
    "modules/covia-sql-module.jar",
    { "path": "modules/custom.jar", "sha256": "9f2a...", "config": {} }
  ]
}
```

Modules load at boot, before catalog materialisation, so their operations appear in `v/ops/` alongside the built-ins, with the same catalog entries, capability checks, argument defaults, and audit trail. Each module gets its own isolating classloader for dependency separation; an optional `sha256` pins the exact jar content.

The security posture is deliberate: loading is **operator-only and fail-fast**: a missing jar or a bad hash is a boot error, and there is no runtime module-load operation, because in-process code is total compromise and deserves explicit, restart-gated intent.

The shipped [SQL](./sql) and [Python](./python) adapters are venue modules: working references for writing your own.

## Related

- [SQL (module)](./sql) · [Python (module)](./python): shipped module examples
- [Configuration](/docs/operator-guide/configuration): venue config reference
