---
sidebar_position: 4
---

# TypeScript SDK

The TypeScript SDK provides a fully-typed client for the Covia Grid, with manager classes for agents, workspace, assets, jobs, secrets, and UCAN capabilities.

- **Package:** `@covia/covia-sdk`
- **Node.js:** 18+
- **License:** MIT
- **Source:** [covia-ai/covia-sdk](https://github.com/covia-ai/covia-sdk)

## Installation

```bash
npm install @covia/covia-sdk
```

## Quick Start

### Connecting to a Venue

```typescript
import { Grid, BearerAuth, KeyPairAuth } from "@covia/covia-sdk";

// Connect using a URL
const venue = await Grid.connect("https://venue-test.covia.ai");

// Connect using a DID
const venue = await Grid.connect("did:web:venue-test.covia.ai");

// With bearer token
const venue = await Grid.connect("https://venue-test.covia.ai",
  new BearerAuth("your-token")
);

// With Ed25519 key pair (self-issued JWT)
const auth = KeyPairAuth.generate();
console.log(`Your DID: ${auth.getDID()}`);
const venue = await Grid.connect("https://venue-test.covia.ai", auth);
```

`Grid.connect()` caches venue connections — calling it twice with the same ID returns the same instance.

### Running Operations

```typescript
// Run synchronously (invoke + wait + return output)
const result = await venue.operations.run("test:echo", { message: "hello" });
console.log(result);

// Invoke asynchronously
const job = await venue.operations.invoke("langchain:openai", {
  prompt: "Summarise this document..."
});
const output = await job.result({ timeout: 60000 });
```

### Venue Properties

```typescript
const status = await venue.status();
console.log(status.did);     // "did:web:venue-test.covia.ai"
console.log(status.name);    // "Test Venue"
console.log(status.stats);   // { assets: 42, users: 10, ops: 15 }
```

## Managers

The venue exposes manager classes for each domain. They are lazy-loaded on first access.

```typescript
venue.operations   // OperationManager
venue.agents       // AgentManager
venue.workspace    // WorkspaceManager
venue.assets       // AssetManager
venue.jobs         // JobManager
venue.secrets      // SecretManager
venue.ucan         // UCANManager
```

### Operations

```typescript
// List all operations
const ops = await venue.operations.list();
for (const op of ops) {
  console.log(`${op.name}: ${op.description}`);
}

// Run by name
const result = await venue.operations.run("covia:read", { path: "w/data" });

// Invoke and track job
const job = await venue.operations.invoke("agent:request", {
  agentId: "Alice",
  input: { question: "What vendors are overdue?" },
  wait: true
});
```

### Agents

```typescript
// Create
await venue.agents.create({
  agentId: "Alice",
  config: {
    systemPrompt: "You are a helpful assistant.",
    model: "gpt-4o",
    tools: ["v/ops/covia/read", "v/ops/covia/list"]
  }
});

// Send a task and wait
const response = await venue.agents.request("Alice",
  { question: "Summarise the vendor records" },
  true  // wait
);
console.log(response.output);

// Send a notification
await venue.agents.message("Alice", { event: "new-invoice" });

// Query state
const info = await venue.agents.query("Alice");
console.log(info.status);  // "SLEEPING"

// List all agents
const list = await venue.agents.list();

// Lifecycle
await venue.agents.suspend("Alice");
await venue.agents.resume("Alice");
await venue.agents.delete("Alice");
```

### Workspace

```typescript
// Write
await venue.workspace.write("w/config", { theme: "dark", lang: "en" });

// Read
const result = await venue.workspace.read("w/config");
console.log(result.value);  // { theme: "dark", lang: "en" }

// List keys
const list = await venue.workspace.list("w/", 100, 0);
console.log(list.keys);  // ["config", "vendor-records", ...]

// Append to a vector
await venue.workspace.append("w/events", { type: "invoice_received" });

// Paginate
const slice = await venue.workspace.slice("w/events", 0, 10);

// Delete
await venue.workspace.delete("w/config");
```

### Assets

```typescript
// List
const assets = await venue.assets.list({ limit: 50, offset: 0 });
console.log(`Total: ${assets.total}`);

// Get (returns Operation or DataAsset)
const asset = await venue.assets.get("0x1234...");
const meta = await asset.getMetadata();

// Register
const newAsset = await venue.assets.register({
  name: "My Dataset",
  description: "Sample data",
  content: { contentType: "text/csv" }
});

// Upload content
const blob = new Blob(["col1,col2\na,b"], { type: "text/csv" });
await asset.putContent(blob);

// Download content
const stream = await asset.getContent();
```

### Jobs

```typescript
// List job IDs
const jobIds = await venue.jobs.list();

// Get a job
const job = await venue.jobs.get("0x1234...");

// Status checks
job.isFinished;   // terminal state?
job.isComplete;   // COMPLETE?
job.isPaused;     // PAUSED, INPUT_REQUIRED, or AUTH_REQUIRED?

// Wait for result
const output = await job.result({ timeout: 30000 });

// Lifecycle
await job.pause();
await job.resume();
await job.cancel();
await job.delete();

// Stream SSE events
for await (const event of job.stream()) {
  console.log(event.event, event.json());
}

// Send message to a running job
await job.sendMessage({ action: "continue" });
```

### Secrets

```typescript
// Store
await venue.secrets.put("OPENAI_API_KEY", "sk-...");

// List names
const names = await venue.secrets.list();

// Delete
await venue.secrets.delete("OPENAI_API_KEY");
```

### UCAN

```typescript
// Issue a capability token
const token = await venue.ucan.issue(
  "did:key:z6Mk...",              // audience DID
  [{ with: "w/data/", can: "crud/read" }],  // attenuations
  Date.now() + 3600000             // expiry (1 hour)
);
```

## Authentication

### NoAuth (Default)

```typescript
import { NoAuth } from "@covia/covia-sdk";

const venue = await Grid.connect("https://public-venue.covia.ai", new NoAuth());
```

### BearerAuth

```typescript
import { BearerAuth } from "@covia/covia-sdk";

const venue = await Grid.connect("https://venue.covia.ai",
  new BearerAuth("your-api-token")
);
```

### KeyPairAuth (Ed25519 Self-Issued JWT)

```typescript
import { KeyPairAuth } from "@covia/covia-sdk";

// Generate a new key pair
const auth = KeyPairAuth.generate();
console.log(auth.getDID());        // did:key:z6Mk...
console.log(auth.getPublicKey());  // Uint8Array

// Or from an existing private key (hex)
const auth = KeyPairAuth.fromHex("abcdef0123456789...");

const venue = await Grid.connect("https://venue.covia.ai", auth);
```

Tokens are generated fresh per request with a configurable lifetime (default: 300 seconds).

## Job Lifecycle

Jobs progress through a state machine:

```
PENDING → STARTED → COMPLETE | FAILED | CANCELLED | REJECTED | TIMEOUT
```

Jobs may also enter interactive states: `PAUSED`, `INPUT_REQUIRED`, `AUTH_REQUIRED`.

```typescript
import { RunStatus } from "@covia/covia-sdk";

const job = await venue.operations.invoke("long:task", input);
await job.wait({ timeout: 120000 });

if (job.metadata.status === RunStatus.COMPLETE) {
  console.log(job.output);
}
```

Polling uses exponential backoff (300ms initial, 1.5x multiplier, 10s cap).

## Error Handling

```typescript
import {
  CoviaError,
  GridError,
  NotFoundError,
  AssetNotFoundError,
  JobNotFoundError,
  CoviaConnectionError,
  CoviaTimeoutError,
  JobFailedError
} from "@covia/covia-sdk";

try {
  const result = await venue.operations.run("my-op", input);
} catch (error) {
  if (error instanceof AssetNotFoundError) {
    console.error(`Asset not found: ${error.assetId}`);
  } else if (error instanceof JobFailedError) {
    console.error(`Job failed: ${error.jobData.error}`);
  } else if (error instanceof GridError) {
    console.error(`API error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof CoviaTimeoutError) {
    console.error("Operation timed out");
  } else if (error instanceof CoviaConnectionError) {
    console.error("Cannot connect to venue");
  }
}
```

## Discovery

```typescript
// DID Document
const doc = await venue.didDocument();
console.log(doc.id);  // "did:web:venue-test.covia.ai"

// MCP Discovery
const mcp = await venue.mcpDiscovery();

// A2A Agent Card
const card = await venue.agentCard();
```

## Logging

```typescript
import { logger } from "@covia/covia-sdk";

// Enable debug logging
logger.level = "debug";

// Custom handler
logger.handler = (level, message) => {
  myLogger.log(level, message);
};
```

## Cleanup

```typescript
// Manual cleanup
venue.close();

// Or use the Disposable protocol (TypeScript 5.2+)
{
  using venue = await Grid.connect("https://venue.covia.ai");
  // venue.close() called automatically at end of block
}
```

## Related Documentation

- [SDK Overview](./) — comparison of all Covia SDKs
- [REST API Reference](../api) — direct HTTP API documentation
- [Agents](/docs/user-guide/agents/) — agent system documentation
