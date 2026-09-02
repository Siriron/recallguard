# Frontend

React + Vite, no backend. Routing via `react-router-dom`.

## Structure

```
src/
  config/chains.ts       Chain config + CONTRACT_ADDRESS (the one file to edit post-deploy)
  hooks/useGenLayer.js    Wallet connection, ensureChain, read/write, timeout handling
  components/             Layout, WalletButton, StatusTag, ErrorBoundary
  pages/                  Registry, FileClaim, DisputeDetail, Docs, NotFound
```

## Wallet connection

`useGenLayer` reconnects silently on mount via `eth_accounts` (never prompts unless the person
clicks Connect), subscribes to `accountsChanged`, and always calls `ensureChain()` before any
write to make sure the wallet is actually on StudioNet before a transaction is signed.

`account` is passed to `createClient` as the plain connected address string — never wrapped in
`createAccount()`, which expects a private key, not a wallet address.

## Long-running writes

`request_adjudication` triggers real LLM-based consensus and can take several minutes.
`writeContract` waits with a generous retry/interval (`{ retries: 120, interval: 4000 }`); if it
still times out, a `ConsensusTimeoutError` carrying the transaction hash is thrown instead of a
generic failure, and the UI shows a direct explorer link rather than just an error — the
transaction may have genuinely succeeded even if the frontend gave up waiting.

## Design system

A case-file / inspection-report visual register — paper-grey background, a slab/grotesk label
face paired with a serif display face for questions and descriptions, a caution-amber accent for
open/pending states, and rust-red reserved specifically for confirmed-defect verdicts so it
carries real meaning rather than decorating the page. Chosen to match the actual subject matter
(product-safety recalls) rather than a generic crypto-dashboard look.
