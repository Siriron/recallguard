import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state">
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
        No record at this address.
      </p>
      <p>The case you're looking for doesn't exist, or the link is out of date.</p>
      <p>
        <Link to="/">Back to the registry</Link>
      </p>
    </div>
  );
}
