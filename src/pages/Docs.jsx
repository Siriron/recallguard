export default function Docs() {
  return (
    <div>
      <p className="page-eyebrow">Documentation</p>
      <h1 className="page-title">How RecallGuard works</h1>

      <h2 className="section-heading" style={{ marginTop: '2rem' }}>Overview</h2>
      <p className="page-sub" style={{ marginBottom: '1rem' }}>
        RecallGuard is a staked dispute-resolution registry for consumer-product-defect claims. A
        claimant states a question and a set of competing positions; others stake GEN on whichever
        position they believe the evidence supports. Evidence must cite a real CPSC recall number
        — the contract fetches that record itself, directly from CPSC's public API, rather than
        trusting anyone's description of what it says.
      </p>

      <h2 className="section-heading">How it works</h2>
      <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.9 }}>
        <li>A claimant files a dispute with 2–6 competing positions and a staking/evidence window.</li>
        <li>Anyone can stake GEN on a position, or submit evidence citing a CPSC recall number.</li>
        <li>
          Once the evidence window closes, anyone can trigger adjudication. Independent validators
          each fetch the cited CPSC records fresh, check the record actually names the claimed
          product, and classify each piece of evidence into one of ten outcome tiers.
        </li>
        <li>
          Validators independently re-derive a final conclusion from all adjudicated evidence.
          Agreement requires matching on reward-eligibility and flagging exactly, and matching
          within one severity tier on the graded evidence classification.
        </li>
        <li>Stakers on the outcome the evidence actually supports can claim their share; evidence that misrepresented a real record is slashed.</li>
      </ol>

      <h2 className="section-heading">Smart contract</h2>
      <p>
        Source: <code>contracts/recallguard_contract.py</code>. Deployed to GenLayer StudioNet — see the
        README for the live address.
      </p>

      <h2 className="section-heading">Evidence binding</h2>
      <p className="page-sub" style={{ marginBottom: '1rem' }}>
        Every evidence submission cites a CPSC RecallNumber, an exact-match parameter on CPSC's
        own RestWebServices/Recall API. Before any record can count as anything other than
        inconclusive or unavailable, the contract checks — in plain deterministic code, not by
        asking the model to notice — that the record's own product names, models, and UPCs
        actually correspond to the product named in the dispute. A real CPSC record for the wrong
        product is always classified as a non-match.
      </p>

      <h2 className="section-heading">FAQ</h2>
      <p><strong>What happens if nobody triggers adjudication?</strong> After a fixed grace period past the evidence deadline, any staker can claim a full refund — the dispute is marked timed out rather than leaving funds stuck.</p>
      <p><strong>Can a claimant just restake to win?</strong> No — the adjudication prompt explicitly instructs the model that stake size is never evidence of correctness; only the evidentiary substance is weighed.</p>
    </div>
  );
}
