/**
 * @file ErrorBoundary.tsx
 * @module Components/Safety
 * @description Global error handling shell for the React tree.
 * Prevents application white-screens by catching asynchronous and rendering errors.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Enterprise-grade Error Boundary.
 * 
 * @description
 * Implements the standard React Error Boundary pattern with a high-fidelity 
 * recovery interface. Provides clear diagnostic info and session restoration paths.
 * 
 * @class ErrorBoundary
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-3">System Interruption</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              We encountered a technical issue during your session. Don't worry, your hardware settings have been preserved.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95"
              >
                <RefreshCw size={18} />
                Restore Session
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                <Home size={18} />
                Return to Home
              </button>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-8 p-4 bg-slate-900 rounded-lg text-left overflow-auto max-h-32">
                <code className="text-[10px] text-red-400 font-mono">
                  {this.state.error?.toString()}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
