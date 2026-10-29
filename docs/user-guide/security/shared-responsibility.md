---
title: Shared responsibility
description: Who secures what when you use Covia-hosted services, and what you need to do on your side.
sidebar_position: 1
---

# Shared security responsibility

*Version 1.0. Last updated: 29 October 2026. Applies to Covia-hosted services.*

Security on Covia is shared. Covia secures the services it operates. Our cloud providers secure the physical infrastructure underneath. You secure your keys, your devices, the authority you delegate, and the agents and data you choose to run and store. This page sets out that division so you can see what you need to do.

## What this page covers

**Covia-hosted services** are the services operated by COVIA LABS PTE. LTD.:

- the Covia App at **app.covia.ai**;
- the venues Covia operates: **venue-1 to venue-4.covia.ai** and **venue-test.covia.ai**;
- the AI assistant connector at **connector.covia.ai**;
- the documentation at **docs.covia.ai** and the website at **covia.ai**.

**Self-hosted venues** are venues you or a third party run with the open-source Covia runtime. Covia does not operate them and has no access to them. If you self-host, you are responsible for the whole environment (see [Self-hosted venues](#self-hosted-venues)).

## Before you start: what the hosted services are today

- The hosted services are a **public beta**. Interfaces may change and venues may be updated or restarted. **There is no service-level agreement** ([Terms of Service](https://app.covia.ai/terms) §2).
- **venue-test is a scratch venue.** Its data may be cleared at any time without notice. Do not store personal data or anything you need to keep on it.
- **venue-1 and venue-2 are Covia's production venues.** venue-3 and venue-4 run development builds for testing and may change without notice. Use venue-1 or venue-2 for anything you rely on.
- Keep your own copies of anything you cannot afford to lose. You can pull your assets to a venue you control at any time.

## The three parties

| Party | In one line |
| --- | --- |
| **Cloud and platform providers** | Secure the data centres, hardware, host networking and virtualisation that Covia's services run on. |
| **Covia** | Secures the services it operates: the venue runtime, its configuration, TLS, access to infrastructure, secret storage, backups, monitoring, patching and incident response. |
| **You** | Secure your keys and tokens, your devices and browsers, the capabilities you grant, the agents and operations you run, the approvals you give, your third-party accounts and API keys, and the data you choose to store. |

The current list of providers Covia uses, with purpose and location, is available on request from privacy@covia.ai.

## Responsibility by area

| Area | Providers | Covia | You |
| --- | --- | --- | --- |
| **Physical security** of data centres and hardware | Secure the facilities, hardware, power and media disposal | Selects providers that publish independent security attestations | Nothing |
| **Host networking and virtualisation** | Secure the hypervisor and the underlying network | Configures cloud firewalls and network access for its own resources | Nothing |
| **Operating system and venue runtime** on hosted venues | Provide the platform | Operates, configures and patches the operating system, container and Covia runtime; fixes vulnerabilities in the runtime | Nothing on hosted venues |
| **Encryption in transit** | Nothing | Serves every hosted endpoint over TLS (HTTPS) | Connect only over HTTPS; check the venue identity the app shows you before signing in |
| **Secrets you store** (for example LLM API keys) | Nothing | Encrypts stored secrets with AES-256-GCM so only the storing venue can decrypt them; injects them at runtime; never shows them back; redacts them from job records | Decide which secrets to store; rotate them with the issuing provider if you suspect exposure; delete those you no longer need |
| **Other stored data** | Store it under contract with Covia | Protects it with access controls; backs up Covia-operated venues daily; deletes it as described in the Privacy Policy | Decide what to store, and whether it is suitable for a beta service; classify it; export it; delete it when you no longer need it |
| **Identity: device keys** | Nothing | Never receives your private key: it is generated and kept in your browser | Protect the device and browser profile that holds your key; delete keys you no longer use; if a key is compromised, stop using it and tell us |
| **Identity: OAuth sign-in** | Your identity provider (Google, GitHub or Microsoft) secures your account with them | Accepts sign-in only through the venue's own sign-in flow | Secure your account with that provider, including multi-factor authentication |
| **Access tokens** you mint | Nothing | Signs and verifies tokens; rejects tokens that expire further ahead than the venue allows | Mint tokens only for the time you need, and never for longer than 30 days; store them as secrets; never paste them into chat, tickets or code; stop using any token you think is exposed and tell us |
| **Capability grants (UCAN delegations)** | Nothing | Enforces each grant exactly as issued, on every call | Decide what to grant, to whom and for how long; review the scope the app shows before you approve; prefer short expiry; let grants you no longer need expire |
| **AI assistant connector** | Cloudflare hosts it | Stores your signed grant encrypted; issues short-lived access tokens; never receives your private key or venue secrets | Choose what to grant the assistant; disconnect it in the assistant when you no longer need it |
| **Agents and operations you run** | Nothing | Runs them under your authority; records every job (inputs, outputs, timing, status, and the identity that ran it) | Own what your agents do: they act on your authority (Terms of Service §5); review their configuration, inputs and outputs |
| **Human-in-the-loop approvals** | Nothing | Records each approval in the relevant job | Review each request before you approve it: an approval is your decision |
| **LLM providers and other third-party services** you call | Your provider secures its own service | Holds your API keys encrypted, as above | Own those accounts, their keys, spend and data terms; choose providers whose terms suit your data (local models keep inference on infrastructure you control) |
| **Your devices and browsers** | Nothing | Secures Covia's own devices | Keep devices and browsers patched, locked and free of untrusted extensions; the app keeps your keys and session tokens in browser storage |
| **Monitoring and logging** | Provide platform logs to Covia | Monitors hosted venues with availability and resource alerts; keeps server logs and security audit logs for no longer than the periods in the Privacy Policy | Review your job records and agent timelines; report anything unexpected |
| **Backups and recovery** | Provide snapshot and backup storage | Backs up Covia-operated venues daily and restores service after a failure | Keep your own copies of important data (no service-level agreement applies during the beta) |
| **Security incidents** | Notify Covia of incidents affecting its accounts | Investigates, contains and recovers; notifies affected users and regulators as the law and the Privacy Policy require | Report suspected compromise of your keys, tokens or account to security@covia.ai promptly; follow our guidance (for example, rotate keys or revoke delegations) |
| **Vulnerabilities** | Nothing | Accepts reports through security@covia.ai and through private vulnerability reporting on our main GitHub repositories; fixes and discloses them | Report vulnerabilities to us privately; do not test Covia-hosted venues without our permission (Terms of Service §6) |
| **Compliance for your data** | Nothing | Meets its own obligations as controller or processor; offers a data processing agreement to enterprise customers | Decide whether your data and use case are lawful and suitable for the service; meet your own obligations for the data you store |

## What you should do: a short checklist

1. Use a dedicated, up-to-date browser profile for Covia, and lock your device.
2. If you sign in with OAuth, turn on multi-factor authentication with that provider.
3. Mint tokens with the shortest lifetime that works, and store them as secrets.
4. Read the scope before approving any capability grant, and keep expiry short.
5. Store only the secrets your operations need, and rotate them with the issuing provider when people or projects change.
6. Review what your agents are allowed to do, and check their job records.
7. Keep personal data off venue-test, and think before storing personal or sensitive data on a beta service.
8. Keep your own copy of anything you cannot afford to lose.
9. Report anything suspicious to **security@covia.ai**.

## Self-hosted venues

When you run the open-source runtime yourself, **you are responsible for the whole environment**. That includes every area in the table above that Covia covers on its hosted services, and more: hosting, network and firewall, operating system and runtime patching, TLS, the venue identity key, secret storage keys, encryption of the venue store, backups, monitoring, logging, access control and incident response. Your own hosting providers take the provider column.

- Covia publishes the runtime with secure defaults, documents it in the [Operator Guide](../../operator-guide/security), and fixes vulnerabilities in the runtime. Apply new releases promptly.
- A self-hosted venue sends Covia nothing: no telemetry and no account.
- You are the controller of the data on your venue.

## Questions

- Security: **security@covia.ai**
- Privacy and data requests: **privacy@covia.ai**

Related documents: [Terms of Service](https://app.covia.ai/terms), [Privacy Policy](https://app.covia.ai/privacypolicy), sub-processor list (on request from privacy@covia.ai), [security disclosure policy](https://github.com/covia-ai/covia/blob/develop/SECURITY.md).

*This page describes how responsibilities are divided. It does not change the Terms of Service or the Privacy Policy. Where an enterprise agreement applies, that agreement and its security addendum take precedence.*

## Document history

| Version | Date | Change |
| --- | --- | --- |
| 1.0 | 2026-10-15 | First version, approved by the CEO |
| 1.0 | 2026-10-29 | Published on docs.covia.ai; wording clarified on provider attestations, token lifetime, vulnerability reporting and self-hosted store encryption |
