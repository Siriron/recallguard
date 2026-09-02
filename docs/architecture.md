# Architecture

## Overview

RecallGuard is a single GenVM intelligent contract (`contracts/recallguard_contract.py`) plus a
React + Vite frontend that reads and writes to it directly via `genlayer-js`. There is no backend
server, database, or indexer — every piece of state the app displays comes from a contract view
call at request time.

## Data model

Two `@allow_storage` record types, each keyed by an incrementing `u32` id in a `TreeMap`:

- **Dispute** — the question, competing positions (stored as a delimiter-joined string, never a
  `DynArray` on the nested dataclass — see `docs/contracts.md`), claimed product identifiers,
  lifecycle status, and final conclusion once adjudicated.
- **Evidence** — a single submission citing a CPSC recall number, its own stake, and its
  adjudicated outcome once the dispute is resolved.

A dispute's evidence ids are tracked in a separate `dispute_evidence_ids_joined` map (same
delimiter-joined pattern) rather than nesting evidence directly inside the Dispute record, keeping
each write cheap regardless of how much evidence accumulates.

## The adjudication flow

`request_adjudication` is the one function that touches `gl.vm.run_nondet_unsafe`. It runs in two
phases, both per-item and per-dispute using the same structure:

1. **Per evidence item** — fetch the cited CPSC record fresh (`gl.nondet.web.request`), check
   deterministically (in Python, not by asking the model) whether the record's own product/UPC
   fields match the dispute's claimed product, then ask the model to classify the evidence into
   one of ten graded tiers. Independent validators re-run the same fetch and classification and
   must agree on reward-eligibility and flagging exactly, and within one tier on the graded
   classification.
2. **Dispute conclusion** — once every unadjudicated evidence item has a tier, a second, separate
   nondet call asks the model to weigh all adjudicated evidence and name a winning position (or a
   no-winner conclusion). Validators must agree on the exact winning position index.

Every value referenced inside either nondet call's `leader()`/`validator()` closures is a plain
scalar extracted in the calling method's deterministic body before the nondet call starts — never
a live storage-backed object. See `docs/contracts.md` for why this matters.

## Settlement

Payouts are pull-based: `request_adjudication` only credits an internal per-address balance and
updates each position/evidence record's outcome; a separate `claim_position` / `claim_evidence` /
`withdraw` sequence does the actual GEN transfer. This keeps the adjudication call's gas cost
independent of how many people staked, and separates "did the judgment happen" from "did the money
move."

## Frontend

- `src/hooks/useGenLayer.js` — the single point of contact with `genlayer-js`. Handles wallet
  connection, chain-switching, read/write calls, and consensus-timeout handling.
- `src/pages/` — Registry (list), FileClaim (create), DisputeDetail (stake/submit
  evidence/adjudicate/claim), Docs.
- `src/config/chains.ts` — the one file that needs editing after deploying the contract.
