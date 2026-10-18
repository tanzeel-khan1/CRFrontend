import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
          <section role="alert" className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">The page ran into an unexpected error. Reload to try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Reload app
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}