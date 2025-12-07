import React, { useState } from 'react';
import { AppStep, UserDetails, Message } from './types';
import SetupStep from './components/SetupStep';
import InterviewStep from './components/InterviewStep';
import FeedbackStep from './components/FeedbackStep';
import HistorySidebar from './components/HistorySidebar';
import { LayoutGrid, History as HistoryIcon, User, Monitor, Laptop, Globe, AlertCircle } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SETUP);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSetupComplete = (details: UserDetails) => {
    setUserDetails(details);
    setCurrentStep(AppStep.INTERVIEW);
  };

  const handleInterviewFinish = (msgs: Message[]) => {
    setTranscript(msgs);
    setCurrentStep(AppStep.FEEDBACK);
  };

  const handleRestart = () => {
    setCurrentStep(AppStep.SETUP);
    setUserDetails(null);
    setTranscript([]);
  };

  return (
    <>
      {/* ---------------- MOBILE BLOCKER (Visible on screens < 1024px) ---------------- */}
      <div className="lg:hidden min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
           <Monitor size={40} className="text-indigo-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Desktop Experience Only</h1>
        <p className="text-slate-500 max-w-md text-lg leading-relaxed mb-8">
           To ensure realistic AI video analysis and high-accuracy speech recognition, 
           <strong className="text-slate-700"> InterView AI</strong> requires the performance of a Laptop or Desktop computer.
        </p>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm text-left">
           <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
             <Globe size={14} /> Optimized Browsers
           </h3>
           <ul className="space-y-3">
             <li className="flex items-center gap-3 text-slate-700 font-medium">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">C</div>
               Google Chrome <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Recommended</span>
             </li>
             <li className="flex items-center gap-3 text-slate-700 font-medium">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">E</div>
               Microsoft Edge
             </li>
             <li className="flex items-center gap-3 text-slate-700 font-medium">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">B</div>
               Brave Browser
             </li>
           </ul>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm mb-1">Designed and Developed by</p>
          <a 
            href="https://portfolio-krish-chaudhary.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 font-bold text-base hover:underline flex items-center justify-center gap-2"
          >
            Krish Chaudhary <Laptop size={14} />
          </a>
        </div>
      </div>

      {/* ---------------- DESKTOP APP (Visible on screens >= 1024px) ---------------- */}
      <div className="hidden lg:flex min-h-screen bg-slate-50 flex-col font-sans text-slate-900">
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={handleRestart}>
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">IV</div>
              <span className="font-bold text-xl tracking-tight text-slate-800">InterView AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="text-slate-500 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition flex items-center gap-2 font-medium"
                title="View History"
              >
                <HistoryIcon size={20} />
                <span className="text-sm">History</span>
              </button>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <User size={16} className="shrink-0 text-slate-400" />
                <span className="truncate max-w-[150px]">{userDetails?.name || 'Guest User'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-8">
          
          {/* Progress Stepper */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-3 text-sm font-medium bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
                <span className={`px-4 py-1.5 rounded-full transition-all duration-300 ${currentStep === AppStep.SETUP ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>1. Setup</span>
                <div className="w-8 h-px bg-slate-200"></div>
                <span className={`px-4 py-1.5 rounded-full transition-all duration-300 ${currentStep === AppStep.INTERVIEW ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>2. Interview</span>
                <div className="w-8 h-px bg-slate-200"></div>
                <span className={`px-4 py-1.5 rounded-full transition-all duration-300 ${currentStep === AppStep.FEEDBACK ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>3. Feedback</span>
            </div>
          </div>

          {currentStep === AppStep.SETUP && (
            <SetupStep onComplete={handleSetupComplete} />
          )}

          {currentStep === AppStep.INTERVIEW && userDetails && (
            <InterviewStep userDetails={userDetails} onFinish={handleInterviewFinish} />
          )}

          {currentStep === AppStep.FEEDBACK && userDetails && (
            <FeedbackStep 
              userDetails={userDetails} 
              transcript={transcript} 
              onRestart={handleRestart} 
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-8 flex flex-col items-center justify-center gap-2">
            <p className="text-slate-500 text-sm">
              Designed and Developed by <a href="https://portfolio-krish-chaudhary.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-colors">Krish Chaudhary</a>
            </p>
            <p className="text-xs text-slate-400">
              Powered by advanced AI models for educational purposes.
            </p>
          </div>
        </footer>

        {/* History Sidebar */}
        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        
        {/* Overlay */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}
      </div>
    </>
  );
}

export default App;
