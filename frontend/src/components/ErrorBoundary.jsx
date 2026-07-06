import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-xl border border-red-500/20 bg-slate-900/40 dark:bg-black/40 text-center select-none shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-pulse">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-wide">
            DoneZo
          </h2>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
            We encountered a problem rendering this widget.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-500/10 text-left overflow-auto font-mono text-[10px] text-red-600 dark:text-red-300 max-h-24">
              <span className="font-semibold">Error:</span> {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs rounded-lg font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
