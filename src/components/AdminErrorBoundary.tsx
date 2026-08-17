import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AdminErrorBoundary caught error:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 text-white">
          <h2 className="text-xl font-bold text-rose-500 mb-2">Admin Panel Error</h2>
          <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-rose-300">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
