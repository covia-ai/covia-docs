---
title: Venue Quick Start
sidebar_position: 1
---

## Running a Venue

You can use the Covia grid simply through the online web app or the SDK as a user. But for more powerful capabilities, such as controlling local resources and installing custom adapters, you may want to create your own venue.

A venue is implemented as a server process that you can run by obtaining `covia.jar` from the [latest release](https://github.com/covia-ai/covia/releases/tag/latest) on GitHub (see [Release channels](#release-channels) below for the options).

Running a venue requires Java 21+ installed. The venue can be launched with:

```bash
java -jar covia.jar
```

This will launch a local venue with a default configuration, suitable for testing and development. You can connect to it with the Covia web app at [http://localhost:8080](http://localhost:8080).

Each venue also includes a web presence for diagnostics and discovery of server capabilities. This will appear at [http://localhost:8080](http://localhost:8080) (The same URL you can use to connect in the Covia App). For an example of this web site, see the hosted [Test Venue](https://venue-test.covia.ai)

### With Docker

A published container image is available if you'd rather not install Java (the image ships its own Java runtime, currently the latest LTS):

```bash
docker run -p 8080:8080 ghcr.io/covia-ai/covia:stable
```

Mount a volume and point `store` at it (see [Configuring the Venue](#configuring-the-venue)) to persist state across container restarts.

### Release channels

Pick the channel that matches how much churn you want:

| Channel | JAR | Docker image | Built from |
|---------|-----|--------------|------------|
| **Release** (recommended) | [`latest`](https://github.com/covia-ai/covia/releases/tag/latest) or a [versioned release](https://github.com/covia-ai/covia/releases) | `:stable`, or pinned `:0.2.0` | `master`, versioned releases |
| **Development** | [`latest-snapshot`](https://github.com/covia-ai/covia/releases/tag/latest-snapshot) | `:latest` | every push to `develop` |

The hosted example venues follow the same channels: [venue-1](https://venue-1.covia.ai) and [venue-2](https://venue-2.covia.ai) (Google Cloud) run the release channel, while [venue-3](https://venue-3.covia.ai) (AWS) and [venue-4](https://venue-4.covia.ai) (Azure) redeploy automatically from the development channel.

For production, pin a specific version (a release tag for the JAR, `:0.2.0`-style image tags for Docker) and upgrade deliberately. The development channel tracks `develop` and may change under you — it's the right choice only if you're following new features or contributing. See the [CHANGELOG](https://github.com/covia-ai/covia/blob/master/CHANGELOG.md) for what each release contains.

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

By default a venue with no `store` configured keeps state in an ephemeral temporary store that is wiped on exit. For a venue you intend to keep, set `store` to a file path — see [Persistence](./persistence) for the durability model, and [Authentication](./auth) for locking down access. The repository's `deploy/` directory contains cloud provisioning examples (e.g. an Azure VM setup and deploy workflow) you can adapt.