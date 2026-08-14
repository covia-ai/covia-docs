---
sidebar_position: 1
title: The Covia App
---

# The Covia App

The Covia App at [app.covia.ai](https://app.covia.ai) is the web console for the grid: connect to venues, run operations, watch jobs, and create and operate agents, all from a browser. It is the same client whether you point it at a hosted venue or at a venue running on your own machine at `http://localhost:8080`.

The app is a pure client. It holds no server-side state of its own: everything you see is read from the venues you connect, and everything you change is an operation on a venue, recorded in that venue's audit trail. One consequence is worth knowing as you browse: **reading never creates jobs**. Pages and background refreshes use the venue's job-free read routes (see the [REST API reference](../api/)), so job records appear only when you explicitly run something.

## Navigation

| Group | Entries | Notes |
| ----- | ------- | ----- |
| **Agents** | Create · View · Chat · Skills | The agent workbench and the venue's skills library |
| **Grid** | Assets · Operations · Jobs · Inbox | Inbox is the human-in-the-loop queue, with a live badge |
| **Manage** | Secrets · Venues · Workspace | Secrets and Workspace appear when signed in |
| **Learn** | Resources · Demos | Tutorials, videos, and seeded live demos |

## Connecting venues

The app connects to a default set of public venues on first load. Add your own from **Venues → Add venue** with either a URL (`https://venue.example.com`, `http://localhost:8080`) or a venue DID (`did:web:venue.example.com`). Each venue card shows its health, protocols, and stats; the venue selector in the top bar switches the active venue everywhere in the app.

A venue's identity is its DID, and the app pins it: if a venue at the same address later presents a different DID, the app treats it as a new venue and drops the stored credentials rather than silently trusting the replacement.

## Signing in

A venue authenticates you, and the app supports the venue's own methods (see [Authentication](../../operator-guide/auth)):

- **Device key**: the app generates an Ed25519 key pair in your browser. Your identity is the key's `did:key`; each request carries a short-lived self-signed JWT bound to the venue you are talking to. You can generate a fresh key, import an existing one, and hold different accounts on different venues. Keys are stored locally in your browser and are manageable from **Profile → Keys**.
- **OAuth**: venues that configure providers offer sign-in with Google, GitHub, or Microsoft. The venue (not the app) runs the flow at its `/auth/{provider}` endpoint and issues you a venue-signed token; your identity is a named user DID such as `did:web:<venue>:u:<name>`.

Your identity, active logins per venue, and DID document are all visible on the **Profile** page. Signing out of a venue forgets its token; deleting a device key shows which venues that key still signs into before it goes.

## The equivalent, outside the app

Everything the app does is the public API. The pages in this guide pair each action with its REST or SDK form, so you can graduate from clicking to scripting without changing concepts:

```bash
# what the venue card shows
curl https://venue-3.covia.ai/api/v1/status

# what the app reads to render your workspace
curl "https://venue-3.covia.ai/api/v1/values/list?path=w" -H "Authorization: Bearer <jwt>"
```

Continue with [Working with agents](./agents), [Running operations and jobs](./operations-and-jobs), and [Workspace, secrets, and the inbox](./data-and-inbox).
