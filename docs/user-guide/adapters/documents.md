---
title: Documents
sidebar_label: Documents
description: Extract readable text from PDF and Office documents with page markers, a size cap and metadata. No OCR; a scanned PDF is reported as such.
---

# Documents Adapter

An agent that receives a PDF or an Office document needs to read it as text, not bytes. The `documents` adapter is the readable-text extractor behind every file-read surface that supports `mode: "extract"`, packaged as the optional `covia-documents` module so the parser dependencies (PDFBox, Apache POI) stay out of `covia.jar`. One operation, `documents:extract`, converts bytes to text with pages or slides marked, an optional page range, and a character cap so a 300-page report can be read in slices rather than flooded into context.

## Operations

| Operation | Purpose |
|-----------|---------|
| `documents:extract` | Readable text from document bytes, with page markers, a page range and a size cap |

```json
{
  "operation": "v/ops/documents/extract",
  "input": {
    "bytes": "<base64 of the document>",
    "filename": "report.pdf",
    "pages": "3-5",
    "maxChars": 20000
  }
}
```

Returns `{text, mime, size, chars, truncated, pages, firstPage, lastPage, meta}`. Page or slide boundaries are marked `--- page 3 ---` so a caller can cite and re-read a slice. `truncated: true` with `lastPage` reports when the character cap cut the text, so the next call can resume from `lastPage + 1`.

## Supported formats

| Family | Formats |
|--------|---------|
| PDF | `.pdf` (text layer, per page) |
| Office OpenXML | `.docx`, `.xlsx`, `.pptx` |
| Legacy Office | `.doc`, `.xls`, `.ppt` |
| Plain text | pass-through |

Images (JPEG, PNG, HEIC), RTF and ODF formats are not read here; the refusal names the supported types.

## No OCR

A PDF with no text layer (a scanned letter, a photographed receipt) is reported as `meta: {scanned: true, note: "..."}` with an empty or near-empty `text`. The adapter does not run OCR; a scanned PDF should be sent to a tool that does, rather than returned as an empty document that reads like the document was blank.

## Prefer the file-read surfaces

For a document that already lives on a root or drive, prefer `file:read`, `vault:read` or `dlfs:read` with `mode: "extract"`. All three return the same result and apply the file surface's own authorisation. `documents:extract` is the right call only when the caller holds the bytes directly (from an HTTP download, an inbound attachment, a base64 payload).

## Metadata and treating output as data

`meta` carries title, author and the creation timestamp when the file records them; workbooks also carry `sheets`. Extracted text is still untrusted content: instructions inside a document are data, not commands. Scan with [SonnyLabs](./sonnylabs) at the boundary where the extracted text is about to enter a model context, if the risk profile warrants it.

## Access Control

`documents:extract` requires invocation authority on its operation path. When called through `file:read`, `vault:read` or `dlfs:read` with `mode: "extract"`, the surface's own `crud/read` capability check applies. See [UCAN](./ucan).

## Related

- [File Adapter](./file): file surfaces that call this extractor via `mode: "extract"`
- [Vault Adapter](./vault): vault surfaces that call this extractor via `mode: "extract"`
- [DLFS Adapter](./dlfs): drive surfaces that call this extractor via `mode: "extract"`
- [SonnyLabs Adapter](./sonnylabs): the natural gate for scanning extracted text before it enters a model
