import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGenLayer } from '../hooks/useGenLayer';
import StatusTag from '../components/StatusTag';

function weiToGen(wei) {
  return (Number(wei) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function Registry() {
  const { readContract } = useGenLayer();
  const [disputes, setDisputes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    readContract('get_disputes', [0, 20])
      .then((data) => {
        if (!cancelled) setDisputes(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load the registry.');
      });
    return () => {
      cancelled = true;
    };
  }, [readContract]);

  return (
    <div>
      <p className="page-eyebrow">Registry</p>
      <h1 className="page-title">Open product-defect claims</h1>
      <p className="page-sub">
        Every claim below is staked, and every piece of supporting evidence is
        fetched and cross-checked directly against CPSC's own recall records
        before independent validators weigh in.
      </p>

      {error && <div className="banner error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {disputes === null && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-line" style={{ width: `${85 - i * 10}%` }} />
          ))}
        </div>
      )}

      {disputes && disputes.length === 0 && (
        <div className="empty-state">
          <p>No claims have been filed yet.</p>
          <p>
            <Link to="/new">File the first one</Link> — cite a CPSC recall number or describe the
            product you believe has an unaddressed defect.
          </p>
        </div>
      )}

      {disputes && disputes.length > 0 && (
        <div>
          {disputes.map((d) => (
            <Link to={`/dispute/${d.id}`} key={d.id} className="case-row">
              <div className="case-row-top">
                <span className="case-number">CASE No. {String(d.id).padStart(4, '0')}</span>
                <StatusTag status={d.status} conclusion={d.status === 'ADJUDICATED' ? d.conclusion : null} />
              </div>
              <div className="case-question">{d.question}</div>
              <div className="case-meta">
                <span>{d.positions?.length || 0} positions</span>
                <span>{d.evidence_count} evidence item{d.evidence_count === 1 ? '' : 's'}</span>
                <span className="mono-figure">{weiToGen(d.total_stake_wei)} GEN staked</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
