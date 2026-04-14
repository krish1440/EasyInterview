/**
 * @file SecurityGuard.tsx
 * @module Components/Safety
 * @description Validates environmental configurations before the application boots.
 * Ensures that critical infrastructure, specifically the Google Gemini API Key,
 * is properly configured to prevent runtime failures.
 */

import React from 'react';
import { ShieldAlert, ExternalLink, Settings } from 'lucide-react';

interface SecurityGuardProps {
  children: React.ReactNode;
}

/**
 * Environment Validation Shield.
 * 
 * @description
 * Inspects the runtime environment for critical dependencies (like API Keys).
 * If requirements are not met, it preempts the application boots with a diagnostic guide.
 * 
 * @component SecurityGuard
 */
const SecurityGuard: React.FC<SecurityGuardProps> = ({ children }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isMissingKey = !apiKey || apiKey === 'your_actual_key_here' || apiKey.length < 10;

  if (isMissingKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full filter blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-600/10 rounded-full filter blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

        <div className="max-w-xl w-full relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl animate-fadeIn">
          <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/30">
            <ShieldAlert className="text-amber-500 w-10 h-10" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Configuration Required</h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            The AI backend (Ava) requires an active Gemini API key to communicate. Your local environment is currently disconnected.
          </p>

          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
              <h2 className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-indigo-400">
                <Settings size={16} /> Quick Fix Steps
              </h2>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Create a <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">.env</code> file in the project root.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Add <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-indigo-300 font-mono">VITE_GEMINI_API_KEY=your_key</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Restart the development server.</span>
                </li>
              </ol>
            </div>

            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between w-full p-5 bg-white text-slate-900 rounded-2xl font-bold transition-all hover:bg-indigo-50 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <ExternalLink size={20} />
                </div>
                <span>Get Free API Key</span>
              </div>
              <ShieldAlert className="opacity-20 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          
          <p className="mt-8 text-center text-xs text-slate-500 font-medium">
            Protected by EasyInterview Engineering Standards
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SecurityGuard;
