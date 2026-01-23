---
sidebar_position: 4
---

# TypeScript SDK

:::info Coming Soon
The TypeScript SDK is currently under development. This page documents the planned API.
:::

The TypeScript SDK provides a fully-typed interface to the Covia Grid, perfect for web applications, Node.js backends, and full-stack development.

## Installation

```bash
npm install @covia/sdk
# or
yarn add @covia/sdk
# or
pnpm add @covia/sdk
```

## Quick Start

### Connecting to a Venue

```typescript
import { Covia, Venue } from '@covia/sdk';

// Connect using a DID
const venue: Venue = await Covia.connect("did:web:venue-test.covia.ai");

// With authentication
const venue = await Covia.connect("did:web:venue-test.covia.ai", {
  apiKey: "your-api-key"
});
```

### Discovering Assets

```typescript
import { Asset } from '@covia/sdk';

// List all assets
const assets: Asset[] = await venue.listAssets();

// Get a specific asset
const asset = await venue.getAsset("0x119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607");

// Access typed metadata
console.log(asset.name);
console.log(asset.description);
console.log(asset.metadata);
```

### Invoking Operations

```typescript
import { Job, Operation } from '@covia/sdk';

// Get an operation
const op = await venue.getOperation("0x7a8b9c0d...");

// Invoke with typed input
const job: Job = await op.invoke({
  url: "https://example.com/data",
  format: "json"
});

// Wait for result
const result = await job.wait();

if (result.status === "completed") {
  console.log(result.output);
} else {
  console.error(result.error);
}
```

### Synchronous-Style Execution

```typescript
// Run and get result directly (still async under the hood)
const result = await op.run({ query: "hello world" });
```

### Working with Artifacts

```typescript
import { Artifact } from '@covia/sdk';

// Get artifact content
const content: ArrayBuffer = await artifact.getContent();

// As text
const text: string = await artifact.getText();

// As JSON
const data = await artifact.getJson<MyDataType>();

// Download to file (Node.js)
await artifact.download("./local_file.csv");
```

### Uploading Assets

```typescript
// Create artifact from file (Node.js)
const assetId = await venue.createArtifact({
  name: "My Dataset",
  description: "Sample data",
  contentType: "text/csv",
  file: "./data.csv"
});

// Create artifact from data
const assetId = await venue.createArtifact({
  name: "Processed Data",
  contentType: "application/json",
  content: JSON.stringify(data)
});

// Create artifact from Blob (browser)
const assetId = await venue.createArtifact({
  name: "User Upload",
  contentType: file.type,
  content: file
});
```

## Type Safety

The SDK provides full TypeScript support with generics for typed operations:

```typescript
// Define input/output types
interface SearchInput {
  query: string;
  limit?: number;
}

interface SearchOutput {
  results: Array<{ title: string; url: string }>;
  total: number;
}

// Get typed operation
const searchOp = await venue.getOperation<SearchInput, SearchOutput>("0x...");

// Invoke with type checking
const result = await searchOp.run({
  query: "typescript",
  limit: 10
});

// result is typed as SearchOutput
console.log(result.results[0].title);
```

## Browser Usage

```typescript
// React example
import { useCovia, useJob } from '@covia/sdk/react';

function SearchComponent() {
  const venue = useCovia("did:web:venue-test.covia.ai");
  const [result, setResult] = useState(null);

  const handleSearch = async (query: string) => {
    const op = await venue.getOperation("search");
    const job = await op.invoke({ query });
    const result = await job.wait();
    setResult(result.output);
  };

  return (
    <div>
      <input onChange={e => handleSearch(e.target.value)} />
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## Node.js Usage

```typescript
import { Covia } from '@covia/sdk';
import { readFile } from 'fs/promises';

async function main() {
  const venue = await Covia.connect("did:web:venue-test.covia.ai");

  // Upload a file
  const data = await readFile("./data.csv");
  const assetId = await venue.createArtifact({
    name: "Uploaded Data",
    contentType: "text/csv",
    content: data
  });

  console.log(`Created asset: ${assetId}`);
}

main();
```

## Streaming Results

```typescript
// Stream job updates
const job = await op.invoke(input);

for await (const update of job.stream()) {
  console.log(`Status: ${update.status}`);
  if (update.progress) {
    console.log(`Progress: ${update.progress}%`);
  }
}

console.log("Final result:", job.output);
```

## Error Handling

```typescript
import {
  CoviaError,
  ConnectionError,
  AssetNotFoundError,
  OperationFailedError
} from '@covia/sdk';

try {
  const result = await op.run({ query: "test" });
} catch (error) {
  if (error instanceof AssetNotFoundError) {
    console.error("Operation not found");
  } else if (error instanceof OperationFailedError) {
    console.error(`Operation failed: ${error.message}`);
  } else if (error instanceof ConnectionError) {
    console.error(`Connection error: ${error.message}`);
  } else {
    throw error;
  }
}
```

## Configuration

```typescript
import { Covia } from '@covia/sdk';

// Global configuration
Covia.configure({
  timeout: 30000,
  retries: 3,
  baseHeaders: {
    "X-Custom-Header": "value"
  }
});

// Per-venue configuration
const venue = await Covia.connect("did:web:venue-test.covia.ai", {
  timeout: 60000,
  fetch: customFetch // Custom fetch implementation
});
```

## Related Documentation

- [API Reference](../api) - REST API documentation
- [MCP Adapter](../adapters/covia-with-mcp) - MCP integration for AI tools
