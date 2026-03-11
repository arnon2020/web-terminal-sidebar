import React, { Component } from 'react';

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component
 * tree that crashed.
 *
 * Based on React docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service (console for now)
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Log component stack for debugging
    console.error('Component Stack:', errorInfo.componentStack);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page or re-initialize state
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary-content">
            <h2>⚠️ Something went wrong</h2>
            <p>The application encountered an unexpected error.</p>

            {this.props.showErrorDetails && this.state.error && (
              <details className="error-details">
                <summary>Error details (for developers)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="error-stack">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="error-boundary-button primary"
                aria-label="Try again"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="error-boundary-button secondary"
                aria-label="Reload the page"
              >
                🔃 Reload Page
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: #e8e8e8;
            }

            .error-boundary-content {
              max-width: 500px;
              text-align: center;
            }

            .error-boundary h2 {
              font-size: 24px;
              margin-bottom: 16px;
            }

            .error-details {
              margin: 20px 0;
              text-align: left;
            }

            .error-details summary {
              cursor: pointer;
              padding: 8px 16px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
              user-select: none;
            }

            .error-details pre {
              margin-top: 12px;
              padding: 12px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 4px;
              overflow-x: auto;
              font-size: 12px;
              color: #ff6b6b;
            }

            .error-boundary-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 24px;
            }

            .error-boundary-button {
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .error-boundary-button.primary {
              background: #4dabf7;
              color: #000;
            }

            .error-boundary-button.primary:hover {
              background: #339af0;
            }

            .error-boundary-button.secondary {
              background: rgba(255, 255, 255, 0.1);
              color: #e8e8e8;
            }

            .error-boundary-button.secondary:hover {
              background: rgba(255, 255, 255, 0.2);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
