'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
          <h2>エラーが発生しました</h2>
          <p>申し訳ありませんが、予期しないエラーが発生しました。</p>
          <details style={{ margin: '1rem 0', textAlign: 'left' }}>
            <summary>エラーの詳細</summary>
            <pre style={{ fontSize: '0.8rem', overflow: 'auto', backgroundColor: 'var(--border-color)', padding: '1rem', marginTop: '0.5rem' }}>
              {this.state.error.message}
            </pre>
          </details>
          <button className="btn btn-primary" onClick={this.resetError}>
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;