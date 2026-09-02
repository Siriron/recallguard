# Smart contract reference

Source: [`contracts/recallguard_contract.py`](../contracts/recallguard_contract.py)

## Public write methods

| Method | Purpose |
|---|---|
| `create_dispute(question, description, position_labels_json, claimed_product_identifiers, reference_recall_number, participation_deadline_ts, evidence_deadline_ts, min_position_stake_wei, min_evidence_stake_wei)` | Create a dispute. Attaching GEN stakes the creator on position 0. |
| `stake_position(dispute_id, position_index)` | Stake GEN on an existing position. |
| `submit_evidence(dispute_id, position_index, recall_number, submitter_summary)` | Submit evidence citing a CPSC recall number, staking the attached GEN. |
| `stake_evidence(evidence_id)` | Add stake behind an existing evidence submission. |
| `cancel_dispute(dispute_id)` | Creator can cancel before any other participation; owner can cancel anytime pre-adjudication. |
| `request_adjudication(dispute_id)` | Permissionless. Runs the full nondet adjudication pass once the evidence deadline has passed. |
| `claim_position(dispute_id, position_index)` | Pull-based claim of a position's settlement outcome. |
| `claim_evidence(evidence_id)` | Pull-based claim of an evidence stake's settlement outcome. |
| `withdraw()` | Transfer out any credited balance. |

## Public view methods

`get_dispute`, `get_disputes`, `get_dispute_count`, `get_evidence`, `get_evidence_for_dispute`,
`get_position_stake`, `get_evidence_stake`, `get_balance_of`, `get_flag_count`, `get_activity`,
`get_platform_stats`, `get_config`, `get_evidence_outcome_economics`.

## Verdict shape

Ten graded evidence-quality outcomes, ordered from best to worst evidentiary value:

`STRONGLY_CONFIRMED` → `CREDIBLE_AND_RELEVANT` → `CREDIBLE_BUT_LIMITED` → `OUTDATED_NOT_DECEPTIVE`
→ `INCONCLUSIVE` → `WEAK_OR_INCOMPLETE` → `WRONG_PRODUCT_RECORD` → `MATERIALLY_IRRELEVANT` →
`FABRICATED_OR_UNVERIFIABLE` → `MALICIOUSLY_MISREPRESENTED`.

Each has a fixed slash-bps consequence, looked up deterministically after consensus — never
LLM-supplied. Validator agreement uses three independent gates: exact match on reward-eligibility,
exact match on the flagging consequence, and ordinal-distance tolerance (one tier) on the graded
classification itself.

The dispute-level conclusion is a separate seven-value enum (`DEFECT_CONFIRMED`,
`ALREADY_RECALLED`, `NOT_A_DEFECT`, `CLAIM_UNSUPPORTED`, `EVIDENCE_INSUFFICIENT`, `INCONCLUSIVE`,
`QUESTION_INVALID`), independently re-derived by every validator from the already-adjudicated
evidence, with the winning position index required to match exactly.

## Evidence-to-identifier binding

Every evidence submission cites a CPSC RecallNumber — an exact-match parameter on CPSC's own
`RestWebServices/Recall` API. The fetch target is built deterministically from that number, never
accepted as a submitter-supplied URL. Before a fetched record can receive any outcome beyond
`INCONCLUSIVE`/`FABRICATED_OR_UNVERIFIABLE`, `_record_matches_product` checks — in plain Python,
not by asking the model to notice — whether the record's own `Products[].Name`, `Products[].Model`,
and `ProductUPCs[].UPC` fields actually correspond to the dispute's claimed product identifiers. A
real, correctly-fetched CPSC record for the wrong product is always classified as
`WRONG_PRODUCT_RECORD`, never allowed to influence the verdict as if it were relevant.

## Nondet safety

Every value referenced inside a `leader()`/`validator()` closure is either a plain scalar
parameter, a module-level constant, or a module-level pure function — never a live
`TreeMap`/`DynArray`-backed storage object, and never an instance method call that could carry
`self` (and therefore the whole contract's storage) across the nondet boundary. Both
`run_nondet_unsafe` calls are positional. Timestamps use a hand-rolled ISO-8601 parser rather than
`datetime.datetime.now()`, since cross-validator determinism of the latter has not been confirmed
live anywhere.

## Known, deliberate gaps

- `reasoning_summary` content validation is length-checked only, not independently fact-checked
  against the fetched evidence by a second model pass.
- No deadline/timeout automation beyond a fixed grace-period-then-refundable pattern.
- CPSC's legacy REST endpoint has been observed to intermittently return a provider-error payload
  independent of query shape; this is treated as expected, handleable evidence quality (mapped
  toward `FABRICATED_OR_UNVERIFIABLE`), not a contract bug.
