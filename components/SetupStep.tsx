
import React, { useState } from 'react';
import { UserDetails } from '../types';
import { fileToBase64 } from '../utils';
import { Upload, Briefcase, ChevronRight, Check, Play } from 'lucide-react';

interface SetupStepProps {
  onComplete: (details: UserDetails) => void;
}

const SetupStep: React.FC<SetupStepProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<UserDetails>({
    name: '',
    targetRole: '',
    experienceLevel: 'Fresher / Student',
    industry: '',
    language: 'English',
    jobDescription: '',
    resumeFile: null,
    resumeBase64: null,
    resumeMimeType: null,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setFormData(prev => ({
          ...prev,
          resumeFile: file,
          resumeBase64: base64,
          resumeMimeType: file.type
        }));
      } catch (err) {
        console.error("Error reading file", err);
        alert("Failed to read file.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetRole) {
      alert("Please enter a target role.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onComplete(formData);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn w-full">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight">Configure Session</h2>
        <p className="text-sm md:text-lg text-slate-500 mt-2 md:mt-3 max-w-xl mx-auto">Set your target role for a realistic video interview.</p>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-5 md:p-10 space-y-6 md:space-y-8">
          
          {/* Section 1: Core Details */}
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
              <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] md:text-xs">1</span>
              Target Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-sm md:text-base"
                  placeholder="Krish Chaudhary"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-slate-700">Role Title <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3 md:left-4 top-3 md:top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    name="targetRole"
                    required
                    value={formData.targetRole}
                    onChange={handleInputChange}
                    className="w-full pl-9 md:pl-11 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition font-medium text-sm md:text-base"
                    placeholder="e.g. Senior Product Manager"
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs md:text-sm font-semibold text-slate-700">Experience</label>
                <div className="relative">
                   <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition appearance-none cursor-pointer text-sm md:text-base"
                  >
                    <option>Fresher / Student</option>
                    <option>0-1 years</option>
                    <option>1-3 years</option>
                    <option>3-5 years</option>
                    <option>5-10 years</option>
                    <option>10+ years (Executive)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Context */}
          <div>
            <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
              <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] md:text-xs">2</span>
              Context & Resume
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
               {/* Job Description */}
               <div className="space-y-1.5 md:space-y-3">
                  <label className="text-xs md:text-sm font-semibold text-slate-700">Job Description (Optional)</label>
                  <textarea
                    name="jobDescription"
                    rows={5}
                    value={formData.jobDescription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm resize-none"
                    placeholder="Paste the JD here. The AI will ask specific questions based on requirements."
                  />
               </div>

               {/* Resume Upload */}
               <div className="space-y-1.5 md:space-y-3">
                  <label className="text-xs md:text-sm font-semibold text-slate-700">Upload Resume</label>
                  <div className={`h-32 md:h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${formData.resumeFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}>
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="resume-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4">
                      {formData.resumeFile ? (
                        <div className="text-blue-600 animate-fadeIn">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2">
                            <Check size={20} className="md:w-6 md:h-6" />
                          </div>
                          <span className="font-semibold block truncate max-w-[200px] text-sm md:text-base">{formData.resumeFile.name}</span>
                          <span className="text-[10px] md:text-xs opacity-70">Ready for analysis</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                          <Upload size={24} className="mx-auto mb-2 md:w-8 md:h-8" />
                          <span className="font-medium text-xs md:text-sm">Drop PDF or Click to Upload</span>
                          <span className="text-[10px] md:text-xs block mt-1 text-slate-300">Supports PDF, PNG, JPG</span>
                        </div>
                      )}
                    </label>
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-2 md:pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 text-base md:text-lg"
            >
              {loading ? (
                <>Setting up Environment...</>
              ) : (
                <>
                  Start Video Interview <Play size={18} className="md:w-5 md:h-5" fill="currentColor" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] md:text-xs text-slate-400 mt-3 md:mt-4 px-4">
              By starting, you agree to enable camera/microphone. Data is processed locally and via secure AI analysis.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupStep;
