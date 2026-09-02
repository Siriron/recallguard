import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenLayer } from '../hooks/useGenLayer';

const DEFAULT_POSITIONS = ['This is a genuine, unaddressed safety defect', 'This is user error, not a defect'];

function toUnixSeconds(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

export default function FileClaim() {
  const { account, connect, writeContract } = useGenLayer();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [productIdentifiers, setProductIdentifiers] = useState('');
  const [referenceRecallNumber, setReferenceRecallNumber] = useState('');
  const [participationDays, setParticipationDays] = useState(3);
  const [evidenceDays, setEvidenceDays] = useState(7);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeoutInfo, setTimeoutInfo] = useState(null);

  function updatePosition(i, value) {
    setPositions((prev) => prev.map((p, idx) => (idx === i ? value : p)));
  }

  function addPosition() {
    if (positions.length >= 6) return;
    setPositions((prev) => [...prev, '']);
  }

  function removePosition(i) {
    if (positions.length <= 2) return;
    setPositions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setTimeoutInfo(null);

    const cleanPositions = positions.map((p) => p.trim()).filter(Boolean);
    if (cleanPositions.length < 2) {
      setError('Provide at least two competing positions.');
      return;
    }
    if (!question.trim()) {
      setError('A dispute question is required.');
      return;
    }
    if (!productIdentifiers.trim()) {
      setError('Describe the product (brand, model, or UPC) this claim concerns.');
      return;
    }

    if (!account) {
      await connect();
    }

    setSubmitting(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const participationDeadline = now + Number(participationDays) * 86400;
      const evidenceDeadline = participationDeadline + Number(evidenceDays) * 86400;

      const { txHash } = await writeContract('create_dispute', [
        question.trim(),
        description.trim(),
        JSON.stringify(cleanPositions),
        productIdentifiers.trim(),
        referenceRecallNumber.trim(),
        participationDeadline,
        evidenceDeadline,
        0,
        0,
      ]);

      navigate('/', { state: { justCreatedTx: txHash } });
    } catch (err) {
      if (err?.isTimeout) {
        setTimeoutInfo(err.message);
      } else {
        setError(err?.message || 'The transaction could not be submitted.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="page-eyebrow">File a claim</p>
      <h1 className="page-title">Describe the defect</h1>
      <p className="page-sub">
        State the question as something evidence can actually settle. Evidence submitted later
        must cite a CPSC recall number — the contract fetches and cross-checks that record itself,
        it never trusts a description of what a source says.
      </p>

      <form className="form-block" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="question">Dispute question</label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Does the Acme StrollerCo Model X2 have a wheel-lock defect not covered by any existing recall?"
            maxLength={300}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Context</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened, when, and why you believe it's a genuine defect rather than misuse."
            maxLength={5000}
          />
        </div>

        <div className="field">
          <label htmlFor="product">Product identifiers</label>
          <input
            id="product"
            value={productIdentifiers}
            onChange={(e) => setProductIdentifiers(e.target.value)}
            placeholder="Brand, model name/number, or UPC — used to verify any cited CPSC record actually matches this product"
            maxLength={200}
          />
          <span className="field-hint">
            This is checked in code against every fetched CPSC record — a record for the wrong
            product is never allowed to count as evidence here.
          </span>
        </div>

        <div className="field">
          <label htmlFor="recall">Reference CPSC recall number (optional)</label>
          <input
            id="recall"
            value={referenceRecallNumber}
            onChange={(e) => setReferenceRecallNumber(e.target.value)}
            placeholder="e.g. 23150 — leave blank if you believe this defect is not yet recalled"
            maxLength={40}
          />
        </div>

        <div className="field">
          <label>Competing positions</label>
          {positions.map((p, i) => (
            <div className="position-row" key={i}>
              <input
                value={p}
                onChange={(e) => updatePosition(i, e.target.value)}
                placeholder={`Position ${i + 1}`}
                maxLength={120}
              />
              {positions.length > 2 && (
                <button type="button" className="btn-icon" onClick={() => removePosition(i)} aria-label="Remove position">
                  ×
                </button>
              )}
            </div>
          ))}
          {positions.length < 6 && (
            <button type="button" className="btn-add" onClick={addPosition}>
              + Add another position
            </button>
          )}
        </div>

        <div className="field">
          <label htmlFor="participation">Staking window (days)</label>
          <input
            id="participation"
            type="number"
            min={1}
            max={30}
            value={participationDays}
            onChange={(e) => setParticipationDays(e.target.value)}
          />
          <span className="field-hint">How long others can stake on a position.</span>
        </div>

        <div className="field">
          <label htmlFor="evidence-window">Evidence window (additional days)</label>
          <input
            id="evidence-window"
            type="number"
            min={1}
            max={60}
            value={evidenceDays}
            onChange={(e) => setEvidenceDays(e.target.value)}
          />
          <span className="field-hint">
            Counted from the end of the staking window — how long evidence can still be submitted.
          </span>
        </div>

        {error && <div className="banner error">{error}</div>}
        {timeoutInfo && <div className="banner info">{timeoutInfo}</div>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : account ? 'File claim' : 'Connect wallet & file claim'}
        </button>
        {submitting && (
          <p className="pending-note">
            This step only writes the claim record — it doesn't run adjudication, so it should
            confirm quickly. Later steps that trigger AI adjudication can take several minutes.
          </p>
        )}
      </form>
    </div>
  );
}
