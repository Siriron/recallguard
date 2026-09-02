import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Intentionally quiet in production — no console noise shipped.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="crash-screen">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--ink-soft)', maxWidth: '40ch' }}>
            This page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
