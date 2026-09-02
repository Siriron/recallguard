import { useGenLayer } from '../hooks/useGenLayer';

function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { account, connecting, connect } = useGenLayer();

  if (account) {
    return (
      <div className="wallet-pill" role="status">
        <span className="wallet-dot" aria-hidden="true" />
        <span className="mono-figure">{shortAddr(account)}</span>
      </div>
    );
  }

  return (
    <button className="btn-connect" onClick={connect} disabled={connecting}>
      {connecting ? 'Connecting…' : 'Connect wallet'}
    </button>
  );
}
