---
sidebar_position: 2
---

# Java SDK

The Java SDK provides the reference implementation for Covia Grid clients, offering full access to all Grid functionality.

## Installation

### Maven

```xml
<dependency>
    <groupId>ai.covia</groupId>
    <artifactId>covia-core</artifactId>
    <version>0.1.0</version>
</dependency>
```

### Gradle

```groovy
implementation 'ai.covia:covia-core:0.1.0'
```

## Quick Start

### Connecting to a Venue

```java
import covia.grid.Grid;
import covia.grid.Venue;

// Connect using a DID
Venue venue = Grid.connect("did:web:venue-test.covia.ai");

// Or connect directly to a URL
Venue venue = Grid.connect("https://venue-test.covia.ai");
```

### Discovering Assets

```java
import covia.grid.Asset;
import java.util.List;

// List all assets
List<Asset> assets = venue.getAssets();

// Get a specific asset by ID
Asset asset = venue.getAsset("0x119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607");

// Get asset metadata
String name = asset.meta().get("name").toString();
String description = asset.meta().get("description").toString();
```

### Invoking Operations

```java
import covia.grid.Job;
import convex.core.data.ACell;
import convex.core.data.Maps;

// Find an operation
Asset operation = venue.getAsset("0x7a8b9c0d...");

// Invoke with input parameters
CompletableFuture<Job> future = operation.invoke(Maps.of(
    "url", "https://example.com/data",
    "format", "json"
));

// Wait for completion
Job job = future.get();

// Check result
if (job.isCompleted()) {
    ACell output = job.getOutput();
    System.out.println("Result: " + output);
} else if (job.isFailed()) {
    System.err.println("Error: " + job.getError());
}
```

### Synchronous Execution

For simpler use cases, use the `run()` method for synchronous execution:

```java
// Run operation and get result directly
ACell result = operation.run(Maps.of("query", "hello world"));
```

### Working with Artifacts

```java
import covia.grid.AContent;

// Get artifact content
AContent content = asset.getContent();

// Access content as bytes
byte[] data = content.getBytes();

// Or as a stream
InputStream stream = content.getInputStream();
```

### Uploading Assets

```java
import convex.core.data.Hash;

// Create asset metadata
String metadata = """
    {
        "name": "My Dataset",
        "description": "Sample data for testing",
        "content": {
            "contentType": "text/csv",
            "sha256": "119e30db8a4ea8b33723603743591a5f8229684e6236d89ef1966a72d7293607"
        }
    }
    """;

// Register the asset
Hash assetId = venue.addAsset(metadata);

// Upload content
byte[] content = Files.readAllBytes(Path.of("data.csv"));
venue.putContent(assetId, content);
```

## Job Monitoring

### Polling

```java
Job job = operation.invoke(input).get();

while (!job.isTerminal()) {
    Thread.sleep(100);
    job = venue.getJob(job.getId());
}
```

### Asynchronous Callbacks

```java
operation.invoke(input).thenAccept(job -> {
    System.out.println("Job completed: " + job.getOutput());
}).exceptionally(e -> {
    System.err.println("Job failed: " + e.getMessage());
    return null;
});
```

## Error Handling

```java
try {
    Job job = operation.invoke(input).get();

    if (job.isFailed()) {
        String error = job.getError();
        // Handle operation-level error
    }
} catch (ExecutionException e) {
    // Handle connection or protocol errors
    Throwable cause = e.getCause();
    if (cause instanceof IOException) {
        // Network error
    }
}
```

## Configuration

### Custom HTTP Client

```java
import covia.grid.client.VenueHTTP;

// Configure timeout
VenueHTTP venue = VenueHTTP.create("https://venue-test.covia.ai")
    .withTimeout(Duration.ofSeconds(30));
```

### Authentication

```java
// API key authentication
Venue venue = Grid.connect("did:web:venue-test.covia.ai",
    Credentials.apiKey("your-api-key"));
```

## Related Documentation

- [API Reference](../api) - REST API documentation
- [COG-7: Operations](/docs/protocol/cogs/COG-007) - Operation specification
