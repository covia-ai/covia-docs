---
title: Getting Started
sidebar_position: 1
---

# Getting Started

The easiest way to get started with Covia is go the the [Covia App](https://app.covia.ai)

This lets you connect to venues and run test operations on the Grid. There are a number of example venues available by default for testing:
- [Test Venue](https://venue-test.covia.ai) - DID: `did:web:venue-test.covia.ai`
- [Venue One](https://venue-1.covia.ai) - DID: `did:web:venue-1.covia.ai`
- [Venue Two](https://venue-1.covia.ai) - DID: `did:web:venue-2.covia.ai`

Every publicly accessible venue will have a Decentralized ID (DID) which can be used to reference it on the grid.

## Using the SDK

We're building the Covia SDK for developers in the form of open source libraries for multiple language ecosystems, starting with:
- TypeScript / JavaScript
- Python
- Java
- Rust

This enables grid operations and artifacts to be accessed by simple one-liners, e.g.

```java
// Connect to a find
Venue myVenue = Grid.connect("did:web:venue-test.covia.ai", credentials);

// Look up a remote operation
Operation myOp = myVenue.findOperation("Document Summary Service");

// Run the operation on the grid
Object result = myVenue.run("Give me a summary of the last 5 blog posts");
```

Say goodbye to complex glue code! The SDK is coming soon, so stay connected to see updates!

## Running a Venue

You can use the Covia grid simply through the online web app or the SDK as a user. But for more powerful capabilities, such as connecting to local resources and custom adapters, you may want to create your own venue.

A venue is implemented as a server process that you can run by obtaining the latest `covia.jar` which is regularly made available in the [Snapshots Drive](https://drive.google.com/drive/folders/1AZdyuZOmC70i_TtuEW3uEKvjYLOqIMiv)

Running a venue requires Java 21+ installed. The venue can be launched with:

```bash
java -jar covia.jar
```

This will launch a local venue with a default configuration, suitable for testing and development. You can connect to it with the Covia web app at [http://localhost:8080](http://localhost:8080).

Each venue also includes a web presence for diagnostics and discovery of server capabilities. This will appear at [http://localhost:8080](http://localhost:8080) (The same URL you can use to connect in the Covia App). For an example of this web site, see the [Test Venue](https://venue-test.covia.ai)

### Building the venue server

The venue server is a Maven project in Java.

You can build it with Maven 3.5+ using the following command in a clone of the [Covia repo](https://github.com/covia-ai/covia) root directory:

```
mvn clean install
```

This will build the project, including the full Venue `.jar` at `venue/target/covia.jar`

### Configuring the Venue

A venue can be configured with a JSON / JSON5 config file to enable or disable features, add adapaters and more. To set a configuration file for your venue either:
- Place it in the user's home directory at `~/.covia/config.json`
- Start `covia.jar` with an explicit configuration like `java -jar covia.jar my-config.json`

An [example configuration file](https://github.com/covia-ai/covia/blob/master/venue/config-example.json) is available as a documented template.