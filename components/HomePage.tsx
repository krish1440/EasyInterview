import React from 'react';
import { Play, Mic, Video, FileText, BarChart2, Zap, BrainCircuit, ArrowRight, ShieldCheck } from 'lucide-react';

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col animate-fadeIn">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-16 mb-12 shadow-2xl border border-slate-800">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap size={14} className="fill-indigo-300" /> AI-Powered Career Coaching
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Master Your Interview <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
              Before It Matters
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the future of interview preparation. Our AI conducts realistic video interviews, analyzes your speech patterns, checks your body language, and critiques your resume in real-time.
          </p>

          <button 
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Start Your Practice Session</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <p className="mt-4 text-xs text-slate-500 font-medium">
            No signup required • Secure local processing • Instant Feedback
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <Video size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Visual Presence Analysis</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Our AI monitors your eye contact, posture, and facial expressions via camera to ensure you look confident and engaged.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Mic size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Speech & Clarity Coaching</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Get feedback on your speaking pace, filler words, and clarity. The AI transcribes and analyzes your answers in real-time.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-100 hover:shadow-md transition-all group">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Resume & ATS Integration</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Upload your resume to get tailored questions. We also provide an ATS compatibility score and improvement suggestions.
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-slate-500 mt-2">Three simple steps to interview mastery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-slate-200 via-indigo-200 to-slate-200 -z-10"></div>

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg mb-6 relative z-10">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-2xl">1</div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Configure Session</h3>
            <p className="text-slate-500 text-sm px-6">
              Set your target role, experience level, and upload your resume for context-aware questions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg mb-6 relative z-10">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">2</div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">The Interview</h3>
            <p className="text-slate-500 text-sm px-6">
              Answer vocal questions from our AI avatar. It adapts to your responses and monitors your non-verbal cues.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg mb-6 relative z-10">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-2xl">3</div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Detailed Feedback</h3>
            <p className="text-slate-500 text-sm px-6">
              Receive a comprehensive report with scores, strengths, weaknesses, and a personalized learning roadmap.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
         <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-bold text-slate-700">
               <ShieldCheck size={20} /> Secure & Private
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700">
               <BrainCircuit size={20} /> Advanced AI Models
            </div>
            <div className="flex items-center gap-2 font-bold text-slate-700">
               <BarChart2 size={20} /> Professional Scoring
            </div>
         </div>
      </div>

    </div>
  );
};

export default HomePage;