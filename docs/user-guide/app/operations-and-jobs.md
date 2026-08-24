---
sidebar_position: 3
title: Running operations and jobs
---

# Running operations and jobs

Operations are the venue's callable capabilities; jobs are the records of calling them. The app gives both a full UI, and everything maps one-to-one onto the [REST API](../api/).

## Finding an operation

**Grid → Operations** lists the venue's catalog as cards with search and adapter filters; the catalog view groups the same operations by adapter. Every operation is self-describing, so its detail page shows the input and output JSON Schema, keywords, and, for composite operations, a read-only diagram of the orchestration steps.

Discovery is a job-free read of the catalog trees (`v/ops`, and your own `w/ops` pins when signed in); the REST equivalents are `GET /api/v1/operations` and `GET /api/v1/values/read?path=v/ops`.

## Running one

The operation page renders a form from the input schema: one field per property, with types respected, required fields marked, example values as placeholders, secret fields masked, and asset-reference fields backed by an asset picker. Running the form is exactly:

```json
POST /api/v1/invoke
{ "operation": "v/ops/schema/infer", "input": { "value": { "name": "Ada" } } }
```

The app then takes you to the job page to watch execution. Scripts that only want the result can use `POST /api/v1/run` (see the [REST API reference](../api/)) instead; the app always goes via a job so the run is inspectable afterwards.

## Watching a job

The job page shows status, timing, schema-annotated input and output tables, any error, and the child jobs a composite operation spawned. Updates stream over [SSE](../api/#get-apiv1jobsidsse) with the app's credentials attached; if a stream drops, the page falls back to polling the job-free job read.

While a job is live you can **cancel**, **pause**, and **resume** it (where the operation supports pausing). A job in `INPUT_REQUIRED` shows a reply box: your answer is delivered with `POST /api/v1/jobs/{id}` and the job carries on. Jobs asking for authority instead land in the [Inbox](./data-and-inbox#the-inbox-human-in-the-loop) as human-in-the-loop requests.

## The jobs list

**Grid → Jobs** is your `j/` namespace: every job you have created on the venue, sortable and filterable by status and date, with success-rate and duration tiles. The list reads through `GET /api/v1/values/slice?path=j`, and refreshes automatically while any listed job is still active.

A job record is immutable once terminal, and its `prev` chain preserves every state it passed through: the list is also your audit trail. See [COG-8: Jobs](../../protocol/cogs/COG-008) for the record's guarantees.
