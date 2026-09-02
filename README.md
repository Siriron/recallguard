<div align="center">

<img src="./docs/assets/favicon.svg" width="88" alt="RecallGuard logo" />

# RecallGuard

### Staked consumer-product-defect verification, anchored to the CPSC's public recall registry

<br />

![Status](https://img.shields.io/badge/status-deployed%20(StudioNet)-yellow?style=flat-square)
![Networks](https://img.shields.io/badge/networks-StudioNet-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20GenVM-D9A404?style=flat-square)

<br />

**[Documentation](./docs/architecture.md)** &nbsp;·&nbsp; **[Smart Contract](./contracts/recallguard_contract.py)**

</div>

<br />

---

## What this is

RecallGuard is a staked dispute registry for consumer-product-defect claims. A claimant states a
question and a set of competing positions; other participants stake GEN on the position they
believe the evidence supports. Every piece of evidence must cite a real CPSC recall number — the
contract fetches that record itself, directly from CPSC's own public API, and checks it actually
names the claimed product before it can count toward a verdict.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | Staked consumer-product-defect verification |
| **Consensus need** | A claimant benefits from a false "confirmed defect" verdict; a manufacturer-aligned or skeptical staker benefits from a false "not a defect" verdict — genuine adversarial stakes on both sides |
| **Evidence source** | CPSC's RestWebServices/Recall API, fetched by RecallNumber and checked against the record's own Products/UPC fields — never a submitter's description of a source |
| **Networks** | StudioNet |

</div>

<br />

---

## How it works

1. A claimant files a dispute with 2–6 competing positions, a staking window, and an evidence window.
2. Anyone can stake GEN on a position, or submit evidence citing a CPSC recall number and staking on that evidence's credibility.
3. Once the evidence window closes, anyone can trigger adjudication. Independent validators each fetch the cited CPSC records fresh and classify each item into one of ten graded evidence-quality tiers — never trusting the submitter's own description.
4. Validators independently re-derive the dispute's final conclusion from all adjudicated evidence, with a larger stake on a position never counted as evidence of that position being correct.
5. Stakers on the position and evidence the outcome actually supports can claim their share; evidence found to misrepresent a real record is slashed.

<br />

<details>
<summary><b>The ten-tier evidence ladder</b></summary>
<br />

Each piece of evidence is classified into one of ten ordered outcomes — from `STRONGLY_CONFIRMED`
down through `WRONG_PRODUCT_RECORD` to `MALICIOUSLY_MISREPRESENTED` — each with a fixed,
deterministic slash percentage. Validator agreement requires exact matching on reward-eligibility
and on the flagging consequence, plus agreement within one severity tier on the graded
classification itself — a wide swing between validators is rejected, an adjacent-tier disagreement
(plausible cross-model variance) is tolerated.

</details>

<br />

---

## Deployed contracts

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0x008DA77B7973A6601CAc312731EFf46537a1356a` | [View](https://explorer-studio.genlayer.com/address/0x008DA77B7973A6601CAc312731EFf46537a1356a) |

</div>

<br />

---

## Quick start

```bash
npm install
npm run dev
```

Full deployment instructions: [`docs/deployment.md`](./docs/deployment.md)

<br />

---

## Project structure

```
contracts/recallguard_contract.py   The GenVM contract
src/                                  React + Vite app
docs/                                 architecture.md, deployment.md, frontend.md, contracts.md
LICENSE                               MIT
```

<br />

---

## Status

<div align="center">

![Contract](https://img.shields.io/badge/contract-audit%20clean%20against%20ten--item%20checklist-brightgreen?style=flat-square)
![Deployed](https://img.shields.io/badge/StudioNet-deployed-brightgreen?style=flat-square)
![Live testing](https://img.shields.io/badge/live%20consensus%20lifecycle-not%20yet%20exercised-yellow?style=flat-square)

</div>

The contract has been written and statically audited against every item in this project's
confirmed nondet-safety checklist (positional `run_nondet_unsafe` calls, `gl.vm.Return`/`.calldata`
handling, `copy_to_memory` before every nondet call, zero `self.` references inside nondet
closures, no `DynArray` on nested storage fields, the hand-rolled timestamp parser, no `float()`
anywhere reachable from nondet code), and is now deployed to StudioNet at the address above. It has
**not yet been exercised end-to-end against live multi-validator consensus** — no dispute has been
created, staked on, or adjudicated yet. That live lifecycle test (ideally via Studio's Run and
Debug panel first, then through this frontend) is the next step, and it's the only thing that can
confirm behavior this static audit can't see, such as real validator disagreement or
storage-pickling edge cases.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
