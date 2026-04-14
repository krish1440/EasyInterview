/**
 * @file InterviewStep.tsx
 * @module Components/Interview
 * @description The live interview core engine. Manages video streaming, AI synchronization, 
 * multimodal messaging, and real-time Speech-to-Text (STT) and Text-to-Speech (TTS) integration.
 * 
 * Features:
 * - Real-time video frame capture for visual context.
 * - Stateful conversation management with Google Gemini.
 * - Synchronized voice interaction using Web Speech API.
 * - Accessible UI with rolling captions and presence indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserDetails, Message } from '../types';
import { startInterviewSession, sendInitialMessageWithResume, sendMessageWithVideo } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';
import { Mic, Send, Video, VideoOff, PhoneOff, Volume2, VolumeX, RefreshCw, AlertTriangle, Eye, Activity } from 'lucide-react';
import { Chat } from "@google/genai";
import AudioVisualizer from './AudioVisualizer';
import { useSEO } from '../hooks/useSEO';

/**
 * Properties for the InterviewStep component.
 */
interface InterviewStepProps {
  /** The professional profile and settings for the candidate */
  userDetails: UserDetails;
  /** Callback triggered when the interview concludes, returning the full conversation transcript */
  onFinish: (transcript: Message[]) => void;
}

/**
 * Orchestrator for the active AI interview experience.
 * 
 * @description
 * High-performance component managing multimodal interactivity:
 * 1. **Visual Intelligence**: Captures periodic snapshots from the camera feed and serializes them to base64.
 * 2. **AI Integration**: Maintains a stateful conversation session with the Gemini API via the `geminiService`.
 * 3. **Accessibility (STT/TTS)**: Synchronizes browser-native speech recognition and synthesis for a hands-free experience.
 * 4. **Reactive UI**: Displays real-time captions and provides visual feedback for AI speech patterns.
 * 
 * @component InterviewStep
 * @param {InterviewStepProps} props - Component properties including UserDetails and completion handlers.
 * @returns {JSX.Element} The active multimodal interview dashboard.
 */
const InterviewStep: React.FC<InterviewStepProps> = ({ userDetails, onFinish }) => {
  useSEO({
    title: `Live Session: ${userDetails.targetRole}`,
    description: `Active AI mock interview session for the position of ${userDetails.targetRole}. Powered by Gemini.`,
    keywords: 'Live Interview, AI Mock Session, Technical Assessment'
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);

  const { 
    isListening, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening, 
    speak, 
    isSpeaking,
    cancelSpeech 
  } = useSpeech();

  /**
   * Orchestrates the initialization of the AI chat session and local media devices.
   * Handles error states such as camera access denial or API connection failures.
   * @async
   */
  const initializeInterview = async () => {
    setIsLoading(true);
    setInitError(null);
    try {
      const chat = await startInterviewSession(userDetails);
      if (!isMountedRef.current) return;
      setChatSession(chat);
      
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!isMountedRef.current) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }
        setStream(mediaStream);
        streamRef.current = mediaStream;
      } catch (e) {
        console.warn("Camera access denied", e);
        if (isMountedRef.current) setIsVideoEnabled(false);
      }

      const firstQuestion = await sendInitialMessageWithResume(chat, userDetails);
      if (!isMountedRef.current) return;
      
      if (firstQuestion.startsWith("Error:")) {
        throw new Error(firstQuestion);
      }

      const initialMsg: Message = { role: 'model', text: firstQuestion, timestamp: Date.now() };
      setMessages([initialMsg]);
      setIsLoading(false);
      
      if (isAudioEnabled && isMountedRef.current) {
        speak(firstQuestion);
      }

    } catch (error: any) {
      console.error("Failed to start interview", error);
      if (isMountedRef.current) {
        setInitError(error.message || "Unable to connect to AI servers. Please check your network.");
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    initializeInterview();

    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });

      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
    }
  }, [isVideoEnabled, stream]);

  useEffect(() => {
    if (isListening) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Captures a single frame from the live video stream and returns it as a base64 string.
   * Used for sending visual context to the AI model.
   * 
   * @returns {string | null} Base64 encoded JPEG data or null if video is disabled.
   */
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || !isVideoEnabled) return null;
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      return canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
    }
    return null;
  };

  /**
   * Processes the user's textual input, captures visual context, and sends it to the AI.
   * Updates conversation state and triggers AI voice response upon success.
   * @async
   */
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !transcript.trim()) || !chatSession) return;

    const userText = inputValue || transcript;
    
    stopListening();
    cancelSpeech();

    const userMsg: Message = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setTranscript('');
    setIsLoading(true);

    try {
      const imageFrame = captureFrame();
      const responseText = await sendMessageWithVideo(chatSession, userText, imageFrame);
      
      if (!isMountedRef.current) return;

      if (responseText.startsWith("Error:")) {
         setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      } else {
         const modelText = responseText || "Could you please elaborate?";
         const modelMsg: Message = { role: 'model', text: modelText, timestamp: Date.now() };
         setMessages(prev => [...prev, modelMsg]);
         
         if (isAudioEnabled && isMountedRef.current) {
            speak(modelText);
         }
      }

    } catch (error) {
      console.error("Chat error", error);
      if (isMountedRef.current) {
        setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again.", timestamp: Date.now() }]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Toggles the audio recording state and handles message transmission upon completion.
   */
  const toggleRecording = () => {
    if (isListening) {
      handleSendMessage();
    } else {
      cancelSpeech(); 
      setInputValue(''); 
      startListening();
    }
  };

  /**
   * Toggles TTS and STT functionality.
   */
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    if (newState) {
      cancelSpeech();
      startListening();
    } else {
      stopListening();
      cancelSpeech();
    }
  };

  /**
   * Toggles camera stream visibility and track activity.
   */
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  /**
   * Generates a trimmed version of the transcript for real-time captioning.
   * @param {string} text - Raw transcript text.
   * @returns {string} Truncated string suitable for captions.
   */
  const getRollingCaption = (text: string) => {
    if (!text) return "";
    const maxLength = 250;
    if (text.length <= maxLength) return text;
    return "..." + text.slice(-maxLength);
  };

  const currentCaption = getRollingCaption(transcript || inputValue);

  if (initError) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-black text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800 items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
           <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
        <p className="text-slate-400 max-w-md mb-8">
           We couldn't connect to the AI Interviewer. This usually happens if the servers are busy or the API key is limited.
        </p>
        <p className="text-xs text-slate-500 mb-8 font-mono bg-slate-900 p-2 rounded">
           Error: {initError}
        </p>
        <div className="flex gap-4">
          <button 
             onClick={() => window.location.reload()}
             className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition"
          >
             Go Back
          </button>
          <button 
             onClick={initializeInterview}
             className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
          >
             <RefreshCw size={18} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-black text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
      
      {/* Visual Feedback Glows */}
      {isSpeaking && (
        <div className="absolute inset-0 pointer-events-none z-50 animate-pulse border-[4px] border-indigo-500/20 shadow-[inset_0_0_100px_rgba(99,102,241,0.1)] transition-all"></div>
      )}
      {isListening && !isSpeaking && (
        <div className="absolute inset-0 pointer-events-none z-50 animate-pulse border-[4px] border-red-500/10 shadow-[inset_0_0_80px_rgba(239,68,68,0.05)] transition-all"></div>
      )}
      
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        <div className="flex-1 bg-slate-900/50 relative border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-[40%] md:min-h-auto">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">Ava (AI Coach)</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-indigo-500/20 scale-110 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : 'bg-slate-800'}`}>
              <div className={`w-16 h-16 sm:w-24 sm:h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative`}>
                 <div className="text-2xl sm:text-4xl">🤖</div>
                 {isSpeaking && (
                   <div className="absolute -bottom-2 w-full h-8 flex items-center justify-center">
                     <AudioVisualizer stream={stream} isActive={isSpeaking} color="#FFFFFF" />
                   </div>
                 )}
                 {isSpeaking && (
                   <>
                     <div className="absolute inset-0 border-2 border-indigo-400 rounded-full animate-ping opacity-20"></div>
                     <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-ping opacity-20 delay-150"></div>
                   </>
                 )}
              </div>
            </div>

            {/* Presence Indicator */}
            <div className="flex items-center gap-3 mt-4 px-4 py-1.5 rounded-full bg-slate-800/50 border border-white/5 backdrop-blur-sm">
               {isLoading ? (
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    <Activity size={12} className="animate-spin" /> Thinking
                  </span>
               ) : isSpeaking ? (
                  <span className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
                    <Volume2 size={12} className="animate-pulse" /> Speaking
                  </span>
               ) : isListening ? (
                  <span className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest">
                    <Mic size={12} className="animate-bounce" /> Listening
                  </span>
               ) : (
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Ready
                  </span>
               )}
            </div>

            <p className="mt-4 md:mt-2 text-slate-400 font-medium text-center max-w-md animate-fadeIn min-h-[2rem] text-sm md:text-base px-4">
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center text-indigo-400">
                  Ava is thinking <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </span>
              ) : (
                messages.length > 0 && messages[messages.length - 1].role === 'model' ? 
                 `"${messages[messages.length - 1].text.substring(0, 100)}${messages[messages.length - 1].text.length > 100 ? '...' : ''}"` 
                 : "Listening to you..."
              )}
            </p>
          </div>

          <div className="h-1/3 min-h-[120px] bg-black/40 backdrop-blur-md p-3 md:p-4 overflow-y-auto custom-scrollbar border-t border-white/5">
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-blue-300 text-right' : 'text-slate-300'}`}>
                  <span className="text-xs opacity-50 block mb-0.5">{msg.role === 'user' ? 'You' : 'Ava'}</span>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="h-[200px] sm:h-[250px] md:h-auto md:w-1/3 bg-black relative border-t md:border-t-0 md:border-l border-slate-800 shrink-0">
           {isVideoEnabled ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
               <VideoOff size={32} />
               <p className="mt-2 text-xs">Camera Off</p>
            </div>
          )}

          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white/80">
              You
            </div>
            {isListening && (
               <div className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                 REC
               </div>
            )}
          </div>
          
          {currentCaption && (
            <div className="absolute bottom-4 left-4 right-4 text-center z-20">
              <div className="inline-block bg-black/70 text-white text-xs sm:text-sm px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg max-w-full whitespace-pre-wrap">
                {currentCaption}
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <div className="h-auto py-3 md:h-24 bg-slate-900 border-t border-slate-800 flex flex-row items-center justify-between px-4 md:px-8 shrink-0 relative z-30 gap-3">
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button 
            onClick={toggleAudio}
            aria-label={isAudioEnabled ? "Disable microphone and speakers" : "Enable microphone and speakers"}
            title={isAudioEnabled ? "Disable Audio" : "Enable Audio"}
            className={`p-2.5 md:p-3 rounded-full transition-all ${isAudioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
          >
            {isAudioEnabled ? <Volume2 size={18} aria-hidden="true" className="md:w-5 md:h-5" /> : <VolumeX size={18} aria-hidden="true" className="md:w-5 md:h-5" />}
          </button>
          <button 
            onClick={toggleVideo}
            aria-label={isVideoEnabled ? "Disable video camera" : "Enable video camera"}
            title={isVideoEnabled ? "Disable Video" : "Enable Video"}
            className={`p-2.5 md:p-3 rounded-full transition-all ${isVideoEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
          >
            {isVideoEnabled ? <Video size={18} aria-hidden="true" className="md:w-5 md:h-5" /> : <VideoOff size={18} aria-hidden="true" className="md:w-5 md:h-5" />}
          </button>
        </div>

        <div className="flex-1 flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 md:flex-none">
          <button
            onClick={toggleRecording}
            aria-label={isListening ? "Send voice message" : "Start speaking"}
            title={isListening ? "Send Message" : "Start Mic"}
            className={`h-12 md:h-14 px-4 md:px-8 rounded-full flex items-center justify-center gap-2 md:gap-3 transition-all transform shadow-xl w-full md:w-auto ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700 scale-105 ring-4 ring-red-900/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
            }`}
          >
            {isListening ? (
              <>
                <Send size={18} aria-hidden="true" className="md:w-5 md:h-5" fill="currentColor" />
                <span className="font-bold text-sm md:text-base whitespace-nowrap">Tap to Send</span>
              </>
            ) : (
              <>
                <Mic size={18} aria-hidden="true" className="md:w-5 md:h-5" />
                <span className="font-bold text-sm md:text-base whitespace-nowrap">Tap to Speak</span>
              </>
            )}
          </button>
        </div>

        <div className="shrink-0">
          <button 
            onClick={() => { 
              cancelSpeech(); 
              isMountedRef.current = false;
              onFinish(messages); 
            }}
            className="flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
            title="End Interview"
          >
            <PhoneOff size={18} className="md:w-5 md:h-5" />
            <span className="hidden md:inline">End</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewStep;