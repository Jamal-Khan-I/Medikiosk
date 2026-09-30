import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MediKiosk Runtime Notice]:', error, errorInfo);
  }

  handleReset = () => {
    try {
      sessionStorage.removeItem('medikiosk_active_session_v2');
      sessionStorage.removeItem('medikiosk_active_session');
      localStorage.removeItem('medikiosk_active_session_v2');
      localStorage.removeItem('medikiosk_active_session');
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.hash = '#home';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'var(--cream-bg, #faf8f5)',
          color: 'var(--ink-black, #1e293b)'
        }}>
          <div style={{
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '36px 28px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-light, #e2e8f0)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--blush-peach, #fceee8)',
              color: 'var(--sienna-brown, #b45309)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px'
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '10px', fontWeight: 700 }}>
              Session Reset Required
            </h2>
            <p style={{ color: 'var(--slate-gray, #64748b)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              The kiosk encountered a temporary display issue. Tap below to reload with clean registration defaults.
            </p>
            <button
              onClick={this.handleReset}
              className="btn-pill btn-pill-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={18} />
              <span>Restart Patient Kiosk</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
