import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useGenLayer } from '../hooks/useGenLayer';
import StatusTag from '../components/StatusTag';
import { CPSC_RECALL_URL } from '../config/chains';

function weiToGen(wei) {
  return (Number(wei) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function genToWei(gen) {
  return BigInt(Math.round(Number(gen) * 1e18));
}

const EVIDENCE_OUTCOME_TONE = {
  STRONGLY_CONFIRMED: 'good',
  CREDIBLE_AND_RELEVANT: 'good',
  CREDIBLE_BUT_LIMITED: 'good',
  OUTDATED_NOT_DECEPTIVE: 'neutral',
  INCONCLUSIVE: 'neutral',
  WEAK_OR_INCOMPLETE: 'bad',
  WRONG_PRODUCT_RECORD: 'bad',
  MATERIALLY_IRRELEVANT: 'bad',
  FABRICATED_OR_UNVERIFIABLE: 'bad',
  MALICIOUSLY_MISREPRESENTED: 'bad',
};

function formatOutcomeLabel(outcome) {
  if (!outcome) return 'Pending adjudication';
  return outcome
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

export default function DisputeDetail() {
  const { id } = useParams();
  const { account, connect, readContract, writeContract } = useGenLayer();

  const [dispute, setDispute] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // which action is in flight
  const [actionMsg, setActionMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, ev, act] = await Promise.all([
        readContract('get_dispute', [Number(id)]),
        readContract('get_evidence_for_dispute', [Number(id)]),
        readContract('get_activity', [Number(id), 0, 30]).catch(() => []),
      ]);
      setDispute(d);
      setEvidence(Array.isArray(ev) ? ev : []);
      setActivity(Array.isArray(act) ? act : []);
    } catch (err) {
      setError(err?.message || 'Could not load this dispute.');
    }
  }, [id, readContract]);

  useEffect(() => {
    load();
  }, [load]);

  const [stakeAmount, setStakeAmount] = useState('1');
  const [stakePositionIdx, setStakePositionIdx] = useState(0);
  const [evidenceRecall, setEvidenceRecall] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [evidencePositionIdx, setEvidencePositionIdx] = useState(0);
  const [evidenceStakeAmount, setEvidenceStakeAmount] = useState('1');

  async function runAction(key, fn) {
    setActionMsg(null);
    setBusy(key);
    try {
      if (!account) await connect();
      await fn();
      await load();
      setActionMsg({ tone: 'success', text: 'Confirmed.' });
    } catch (err) {
      if (err?.isTimeout) {
        setActionMsg({ tone: 'info', text: err.message });
      } else {
        setActionMsg({ tone: 'error', text: err?.message || 'The transaction failed.' });
      }
    } finally {
      setBusy(null);
    }
  }

  if (error) return <div className="banner error">{error}</div>;
  if (!dispute) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div className="skeleton-line" style={{ width: '60%', height: '2rem' }} />
        <div className="skeleton-line" style={{ width: '90%' }} />
        <div className="skeleton-line" style={{ width: '85%' }} />
      </div>
    );
  }

  const isAdjudicated = dispute.status === 'ADJUDICATED';
  const isSettleable = ['ADJUDICATED', 'CANCELLED', 'INVALID'].includes(dispute.status);
  const evidenceDeadlinePassed = Date.now() / 1000 > dispute.evidence_deadline_ts;
  const canRequestAdjudication =
    (dispute.status === 'ACTIVE' || dispute.status === 'EVIDENCE_CLOSED') && evidenceDeadlinePassed;

  return (
    <div>
      <div className="detail-header">
        <span className="case-number">CASE No. {String(dispute.id).padStart(4, '0')}</span>
        <StatusTag status={dispute.status} conclusion={isAdjudicated ? dispute.conclusion : null} />
      </div>
      <h1 className="detail-question">{dispute.question}</h1>
      {dispute.description && <p className="detail-description">{dispute.description}</p>}

      <div className="detail-grid">
        <div className="detail-cell">
          <span className="label">Claimed product</span>
          <span className="value" style={{ fontSize: '0.95rem' }}>{dispute.claimed_product_identifiers}</span>
        </div>
        <div className="detail-cell">
          <span className="label">Total staked</span>
          <span className="value mono-figure">{weiToGen(dispute.total_stake_wei)} GEN</span>
        </div>
        <div className="detail-cell">
          <span className="label">Evidence submitted</span>
          <span className="value mono-figure">{dispute.evidence_count}</span>
        </div>
      </div>

      {isAdjudicated && dispute.reasoning_summary && (
        <div className="banner info" style={{ marginBottom: '2rem' }}>
          <strong>{formatOutcomeLabel(dispute.conclusion)}.</strong> {dispute.reasoning_summary}
        </div>
      )}

      {actionMsg && <div className={`banner ${actionMsg.tone}`} style={{ marginBottom: '1.5rem' }}>{actionMsg.text}</div>}

      <h2 className="section-heading">Positions</h2>
      <div className="position-list">
        {dispute.positions.map((p) => {
          const pct = dispute.total_stake_wei > 0 ? (Number(p.total_stake_wei) / Number(dispute.total_stake_wei)) * 100 : 0;
          const isWinner = isAdjudicated && dispute.winning_position_index === p.index;
          return (
            <div key={p.index} className={`position-card${isWinner ? ' is-winner' : ''}`}>
              <div>
                <div className="position-label">{p.label}</div>
                <div className="position-stake-bar">
                  <div className="position-stake-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="position-side">
                <span className="position-amount mono-figure">{weiToGen(p.total_stake_wei)} GEN</span>
                {isWinner && <StatusTag status="ADJUDICATED" conclusion={null} />}
              </div>
            </div>
          );
        })}
      </div>

      {dispute.status === 'ACTIVE' && (
        <div className="form-block" style={{ marginBottom: '2.4rem' }}>
          <div className="field">
            <label htmlFor="stake-position">Stake on a position</label>
            <select id="stake-position" value={stakePositionIdx} onChange={(e) => setStakePositionIdx(Number(e.target.value))}>
              {dispute.positions.map((p) => (
                <option key={p.index} value={p.index}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="stake-amount">Amount (GEN)</label>
            <input id="stake-amount" type="number" min="0" step="0.01" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
          </div>
          <button
            className="btn-secondary"
            disabled={busy === 'stake-position'}
            onClick={() =>
              runAction('stake-position', () =>
                writeContract('stake_position', [Number(id), stakePositionIdx], genToWei(stakeAmount))
              )
            }
          >
            {busy === 'stake-position' ? 'Staking…' : 'Stake'}
          </button>
        </div>
      )}

      <h2 className="section-heading">Evidence</h2>
      {evidence.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: '2rem' }}>No evidence submitted yet.</div>
      ) : (
        <div className="evidence-list">
          {evidence.map((ev) => {
            const tone = ev.adjudicated ? EVIDENCE_OUTCOME_TONE[ev.outcome] || 'neutral' : 'pending';
            return (
              <div key={ev.id} className={`evidence-card outcome-${tone}`}>
                <div className="evidence-top">
                  <a
                    className="evidence-recall"
                    href={CPSC_RECALL_URL(ev.recall_number)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    CPSC Recall #{ev.recall_number}
                  </a>
                  <StatusTag status={ev.adjudicated ? 'ADJUDICATED' : 'ACTIVE'} conclusion={null} />
                  {ev.adjudicated && <span className="status-tag tone-ink">{formatOutcomeLabel(ev.outcome)}</span>}
                </div>
                <p className="evidence-summary">{ev.submitter_summary}</p>
                <p className="case-meta" style={{ marginBottom: 0 }}>
                  <span>For: {dispute.positions[ev.position_index]?.label}</span>
                  <span className="mono-figure">{weiToGen(ev.total_stake_wei)} GEN staked</span>
                </p>
                {ev.adjudicated && ev.reasoning_summary && (
                  <p className="evidence-reasoning">{ev.reasoning_summary}</p>
                )}
                {dispute.status === 'ACTIVE' && (
                  <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="1"
                      style={{ width: '5rem' }}
                      onChange={(e) => setEvidenceStakeAmount(e.target.value)}
                      className="field-inline"
                    />
                    <button
                      className="btn-secondary"
                      disabled={busy === `stake-evidence-${ev.id}`}
                      onClick={() =>
                        runAction(`stake-evidence-${ev.id}`, () =>
                          writeContract('stake_evidence', [ev.id], genToWei(evidenceStakeAmount))
                        )
                      }
                    >
                      Back this evidence
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dispute.status === 'ACTIVE' && (
        <div className="form-block" style={{ marginBottom: '2.4rem' }}>
          <div className="field">
            <label htmlFor="ev-recall">CPSC recall number this evidence cites</label>
            <input id="ev-recall" value={evidenceRecall} onChange={(e) => setEvidenceRecall(e.target.value)} placeholder="e.g. 23150" />
          </div>
          <div className="field">
            <label htmlFor="ev-position">Supports which position</label>
            <select id="ev-position" value={evidencePositionIdx} onChange={(e) => setEvidencePositionIdx(Number(e.target.value))}>
              {dispute.positions.map((p) => (
                <option key={p.index} value={p.index}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ev-summary">Why this record supports that position</label>
            <textarea
              id="ev-summary"
              rows={3}
              value={evidenceSummary}
              onChange={(e) => setEvidenceSummary(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="field">
            <label htmlFor="ev-stake">Evidence stake (GEN)</label>
            <input id="ev-stake" type="number" min="0" step="0.01" value={evidenceStakeAmount} onChange={(e) => setEvidenceStakeAmount(e.target.value)} />
          </div>
          <button
            className="btn-secondary"
            disabled={busy === 'submit-evidence'}
            onClick={() =>
              runAction('submit-evidence', () =>
                writeContract(
                  'submit_evidence',
                  [Number(id), evidencePositionIdx, evidenceRecall.trim(), evidenceSummary.trim()],
                  genToWei(evidenceStakeAmount)
                )
              )
            }
          >
            {busy === 'submit-evidence' ? 'Submitting…' : 'Submit evidence'}
          </button>
        </div>
      )}

      {canRequestAdjudication && (
        <div className="banner info" style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginTop: 0 }}>
            The evidence window has closed. Anyone can now trigger adjudication — this fetches
            every cited CPSC record fresh and runs independent validator consensus. This can take
            several minutes.
          </p>
          <button
            className="btn-primary"
            disabled={busy === 'adjudicate'}
            onClick={() => runAction('adjudicate', () => writeContract('request_adjudication', [Number(id)]))}
          >
            {busy === 'adjudicate' ? 'Adjudicating…' : 'Request adjudication'}
          </button>
        </div>
      )}

      {isSettleable && (
        <div className="form-block" style={{ marginBottom: '2.4rem', flexDirection: 'row', flexWrap: 'wrap', gap: '0.8rem' }}>
          {dispute.positions.map((p) => (
            <button
              key={p.index}
              className="btn-secondary"
              disabled={busy === `claim-pos-${p.index}`}
              onClick={() => runAction(`claim-pos-${p.index}`, () => writeContract('claim_position', [Number(id), p.index]))}
            >
              Claim position stake ({p.label.slice(0, 24)}{p.label.length > 24 ? '…' : ''})
            </button>
          ))}
          {evidence.map((ev) => (
            <button
              key={ev.id}
              className="btn-secondary"
              disabled={busy === `claim-ev-${ev.id}`}
              onClick={() => runAction(`claim-ev-${ev.id}`, () => writeContract('claim_evidence', [ev.id]))}
            >
              Claim evidence stake (#{ev.recall_number})
            </button>
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <>
          <h2 className="section-heading">Activity</h2>
          <div className="activity-list">
            {activity.map((a, i) => (
              <div className="activity-item" key={i}>
                <span className="activity-kind">{a.kind}</span>
                <span>{a.note}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
