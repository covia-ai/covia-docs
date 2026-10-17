---
title: Crypto
sidebar_label: Crypto
description: Local Ed25519, ECIES, BIP39, SLIP-10, hashing and JWT operations. Private material resolves only from the secret store; the model never sees a key.
---

# Crypto Adapter

Signing a message, verifying a signature, encrypting a payload, deriving a key from a mnemonic — these are things an agent must do constantly, but they're also exactly where secrets leak if the design is lax. The `crypto` adapter provides local cryptographic primitives (Ed25519, BIP39, SLIP-10, ECIES, JWT, hashing) with one structural guarantee: **private material resolves only from the secret store, and generated private material is written back without passing through a job result**. The model never sees a seed, a mnemonic, or an unencrypted private key.

## Operations

| Operation | Purpose |
|-----------|---------|
| `crypto:sign` | Sign bytes with Ed25519 (secret-backed seed) |
| `crypto:verify` | Verify an Ed25519 detached signature |
| `crypto:public-key` | Derive the public AccountKey + `did:key` from a secret seed |
| `crypto:generate-key` | Generate a fresh Ed25519 keypair, store the seed under `s/NAME` |
| `crypto:hash` | SHA-256, SHA-512, SHA3-256, or Keccak-256 of input bytes |
| `crypto:encrypt` | ECIES envelope encryption to a recipient's public key |
| `crypto:decrypt` | Decrypt an ECIES envelope with a secret-backed recipient key |
| `crypto:generate-mnemonic` | Generate a BIP39 mnemonic (12/15/18/21/24 words), store under `s/NAME` |
| `crypto:validate-mnemonic` | Check a BIP39 mnemonic's word count, words and checksum |
| `crypto:derive-key` | SLIP-10 derivation from a secret-backed mnemonic along an `m/44'/864'/…` path |
| `crypto:jwt-sign` | Sign a compact JWT with a secret-backed Ed25519 key |
| `crypto:jwt-verify` | Verify a JWT's signature + canonical claims |
| `crypto:jwt-decode` | Decode a JWT's header + claims without verification |

```json
{
  "operation": "v/ops/crypto/sign",
  "input": {
    "seed": "s/signing-key",
    "data": "0xdeadbeef"
  }
}
```

Returns `{accountKey: "0x…", did: "did:key:z6Mk…", signature: "0x…"}`. The seed never leaves the secret store; the signature is a detached 64-byte Ed25519 output over the exact bytes passed (no implicit hash, no CAD3 conversion).

## Secret references, not raw material

Every operation that consumes private material (`seed`, `mnemonic`, `recipient` for decrypt, `passphrase`) takes a **secret reference** of the form `s/NAME` or `<did>/s/NAME` — never a raw string. The adapter resolves the reference to the stored secret only inside its own execution scope; the raw bytes never appear in the request context, the job record, or anything the model can read.

Generated private material (`generate-key`, `generate-mnemonic`) writes directly to the named secret and returns only the public parts: AccountKey, DID, and `stored: true`. There is no code path that returns a freshly-generated seed to the caller — that would defeat the whole model.

## Encoding

Byte input is hexadecimal by default (with or without a `0x` prefix). Pass `encoding: "utf8"` for text input or `encoding: "base64"` for base64. Byte output is a native `ABlob` on the Convex wire, rendered as `0x`-prefixed hex over JSON. Opt into `utf8` output when you know the result is text.

## Access Control

The adapter checks capability on both the invocation path and each secret reference. `crud/read` on `s/NAME` is required to use a stored key; `crud/write` on `s/NAME` is required to generate a key into it. Overwriting an existing secret requires explicit `overwrite: true`. Cross-user secret references require the target user to have granted the appropriate capability to the caller. See [UCAN](./ucan).

## Size + algorithm limits

Input bytes are capped at 1 MiB per call. Hash algorithms are limited to `sha256`, `sha512`, `sha3-256`, and `keccak256`. Key derivation paths are limited to 255 SLIP-10 indexes, all hardened. Mnemonic word counts are 12, 15, 18, 21, or 24 (English BIP39 wordlist only).

## Related

- [Secret Adapter](./secret) — the encrypted secret store that holds the material this adapter resolves
- [UCAN Adapter](./ucan) — capability-based access to secrets and operations
- [Auth Adapter](./auth) — venue-level authentication (login OAuth, bearer tokens)
