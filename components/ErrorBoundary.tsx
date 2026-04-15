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
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 md:p-12 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-sm">
              <AlertTriangle className="text-red-600 w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">System Interruption</h1>
            <p className="text-slate-500 mb-10 text-lg leading-relaxed max-w-sm mx-auto">
              We encountered a technical issue. Don't worry, your session data is being handled safely.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all active:scale-95 group"
              >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                Restore Session
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:border-slate-300"
              >
                <Home size={20} />
                Return to Home
              </button>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <details className="group text-left">
                <summary className="text-xs font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors list-none flex items-center justify-center gap-2">
                  <span>Technical Diagnostics</span>
                </summary>
                <div className="mt-4 p-5 bg-slate-900 rounded-2xl overflow-auto max-h-48 shadow-inner border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-tighter">Stack Trace</span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <code className="text-xs text-red-400 font-mono break-all whitespace-pre-wrap leading-relaxed">
                    {this.state.error?.name}: {this.state.error?.message}
                    {"\n\n"}
                    {this.state.error?.stack}
                  </code>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
