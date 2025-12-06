import React, { useState } from 'react';
import { AppStep, UserDetails, Message } from './types';
import SetupStep from './components/SetupStep';
import InterviewStep from './components/InterviewStep';
import FeedbackStep from './components/FeedbackStep';
import HistorySidebar from './components/HistorySidebar';
import { LayoutGrid, History as HistoryIcon, User } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">Ai</div>
             <span className="font-bold text-xl tracking-tight text-slate-800">Interview Coach</span>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsHistoryOpen(true)}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
              title="View History"
            >
              <HistoryIcon size={20} />
            </button>
             <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
               <User size={14} />
               <span>{userDetails?.name || 'Guest'}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Progress Stepper */}
        <div className="flex justify-center mb-8">
           <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`px-3 py-1 rounded-full ${currentStep === AppStep.SETUP ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1. Setup</span>
              <div className="w-8 h-px bg-slate-300"></div>
              <span className={`px-3 py-1 rounded-full ${currentStep === AppStep.INTERVIEW ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2. Interview</span>
              <div className="w-8 h-px bg-slate-300"></div>
              <span className={`px-3 py-1 rounded-full ${currentStep === AppStep.FEEDBACK ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3. Feedback</span>
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
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>Powered by Gemini 3 Pro. This tool is for educational purposes only.</p>
        </div>
      </footer>

      {/* History Sidebar */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      
      {/* Overlay */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
}

export default App;