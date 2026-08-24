---
sidebar_position: 5
---

# Covia in Claude and ChatGPT

The **Covia connector** puts your venue inside your AI assistant. Claude (web, Desktop, and Claude Code) and ChatGPT (connectors and Developer Mode) can run your operations, work with your agents, read your workspace, and answer your approvals, with every action landing as a job record on your venue, under a capability grant you sign yourself.

The connector lives at `connector.covia.ai` and works with any venue, including one you host yourself.

## Connect in about two minutes

1. In Claude: **Settings → Connectors → Add custom connector**. In ChatGPT: **Settings → Connectors** (or Developer Mode). Enter:

   ```
   https://connector.covia.ai/mcp
   ```

2. Your assistant discovers the connector's authorisation server and opens the **consent page**.
3. Pick your venue. Any venue works, including a self-hosted one: paste its URL.
4. Generate a device key, or import the one you use with [app.covia.ai](https://app.covia.ai) (Profile → Keys → copy). **The key stays in your browser**; it signs a grant naming exactly what the assistant may do.
5. Tick the capabilities and a duration, then approve.

:::tip Use the same identity as your dashboard
Your workspace, agents, and secrets belong to the identity (DID) of the device key you use. Importing your dashboard key means the assistant shares them; generating a fresh key creates a new, empty identity. The consent page shows the DID so you can check it matches your Profile.
:::

## What the assistant can do

Ask naturally; the connector's tools map to your venue:

- **Operations**: list what the venue offers and run any operation. Each run returns a receipt link to the job record.
- **Agents**: list your agents, inspect them, chat with them, and give them tasks.
- **Workspace**: read and list your lattice paths (`w/` workspace, `g/` agent state, `j/` jobs, `h/` inbox).
- **Approvals**: see pending human-in-the-loop requests and answer them. The assistant always confirms with you before answering approvals or capability asks.
- **Help**: the assistant can consult the built-in `covia_help` tool for setup and troubleshooting guidance.

## Chatting with agents needs your LLM key

Agent conversations run on your own model provider account. Store your key on the venue, signed in with the same device key you connected with:

1. Open [app.covia.ai](https://app.covia.ai) → **Secrets**.
2. Add the provider key by its conventional name: `ANTHROPIC_API_KEY` (Claude models), `OPENAI_API_KEY`, `GOOGLE_API_KEY`, and so on.

Keys resolve per identity from your own encrypted secret store. The connector never holds provider keys.

## The trust model, in one paragraph

The connector has its own grid identity (a `did:key`, shown on its consent page and at [connector.covia.ai](https://connector.covia.ai)). It never holds your private key, your venue secrets, or your files: it acts under the UCAN grant you signed, the venue enforces that scope on every call, and anything outside it is refused with the exact missing capability named. Receipts in every result link to the job record on your venue, so your audit trail stays yours. Disconnect in your assistant's settings (or let the grant expire) and the connection is powerless.

## Self-hosted venues

Nothing above assumes a Covia-operated venue: paste your own venue's URL on the consent page and the same flow applies. Claude Code users can also skip the connector entirely and add a venue's own MCP endpoint directly with a bearer token; see [Venues as MCP servers](./venues-as-mcp-servers).
