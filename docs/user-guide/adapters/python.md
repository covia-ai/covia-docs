---
title: Python (module)
sidebar_label: Python
---

# Python Adapter

The Python adapter — the optional [`ai.covia:covia-python-adapter`](https://central.sonatype.com/artifact/ai.covia/covia-python-adapter) venue module — publishes operator-configured Python functions as grid operations. CPython runs **in-process** via the Java FFM API (Java 22+, CPython 3.10–3.14), with Convex values converting natively across the boundary — no subprocess, no serialisation tax.

The security model is deliberate: **there is no `eval`**. Callers can never submit Python source, host paths, or function names — the operator selects every script and allowlists every callable. Caller-selected code would turn venue invocation into host code execution, so the surface simply doesn't exist. Python runs with the venue process's authority; scripts are trusted operator code (use containers for anything else).

## Configured operations

Each operation declared in the module config installs at `v/ops/python/<id>` with the JSON Schemas the operator gives it, and behaves like any native operation — discoverable, capability-checked, audited, callable as an MCP tool:

```json
{
  "operation": "v/ops/python/health/score",
  "input": { "x": 41 }
}
```

The configured function (default `main`) receives the whole input as one argument and its return value converts back to the result.

## Stateful instances

For session-style work, the module can also expose **instances**: isolated, stateful Python namespaces created from operator-approved templates, each with an explicit allowlist of callable functions.

```json
{ "operation": "v/ops/python/instances/create", "input": { "template": "worker" } }
```

```json
{
  "operation": "v/ops/python/instances/call",
  "input": { "id": "<instance id>", "function": "add", "args": [5, 7] }
}
```

`instances/list` shows your live instances; `instances/close` releases one. State (module globals) persists across calls until close or venue restart. Instances are owned by the calling user — other users' instances are invisible, agents share their owner's, and anonymous callers are refused. `maxPerUser` (default 8) and `maxTotal` (default 128) bound retained native state.

## Enabling the module

Unlike SQL, Python's configuration lives in the module entry itself:

```json
{
  "modules": [{
    "path": "modules/covia-python-adapter-<version>-module.jar",
    "config": {
      "library": "/usr/lib/libpython3.13.so",
      "operations": {
        "health/score": { "script": "/opt/venue/python/health_score.py" }
      },
      "instances": {
        "templates": {
          "worker": {
            "script": "/opt/venue/python/worker.py",
            "functions": ["add", "summary", "reset"]
          }
        }
      }
    }
  }]
}
```

Omit `instances` and no instance surface exists at all. If FFM or CPython is unavailable the module degrades gracefully — the venue starts, the adapter stays inactive with a warning.

## Related

- [Venue modules](/docs/operator-guide/configuration) — loading and pinning module jars
- [SQL (module)](./sql) — the other shipped extension module
- [MCP integration](../mcp/) — configured operations as MCP tools
