import React, { useState, useEffect, useRef } from 'react';
import { UserDetails, Message } from '../types';
import { startInterviewSession, sendInitialMessageWithResume, sendMessageWithVideo } from '../services/geminiService';
import { useSpeech } from '../hooks/useSpeech';
import { Mic, Send, Video, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Chat } from "@google/genai";

interface InterviewStepProps {
  userDetails: UserDetails;
  onFinish: (transcript: Message[]) => void;
}

const InterviewStep: React.FC<InterviewStepProps> = ({ userDetails, onFinish }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initialize Interview
  useEffect(() => {
    const init = async () => {
      try {
        const chat = await startInterviewSession(userDetails);
        setChatSession(chat);
        
        // Setup Camera
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (e) {
          console.warn("Camera access denied", e);
          setIsVideoEnabled(false);
        }

        const firstQuestion = await sendInitialMessageWithResume(chat, userDetails);
        const initialMsg: Message = { role: 'model', text: firstQuestion, timestamp: Date.now() };
        setMessages([initialMsg]);
        setIsLoading(false);
        
        if (isAudioEnabled) speak(firstQuestion);

      } catch (error) {
        console.error("Failed to start interview", error);
        alert("Failed to connect. Please check your API Key.");
      }
    };
    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync transcript to input (but don't auto-send)
  useEffect(() => {
    if (isListening) {
      setInputValue(transcript);
    }
  }, [transcript, isListening]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !transcript.trim()) || !chatSession) return;

    // 1. Capture content
    const userText = inputValue || transcript;
    
    // 2. Stop Listening
    stopListening();
    cancelSpeech();

    // 3. Update UI
    const userMsg: Message = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setTranscript('');
    setIsLoading(true);

    try {
      // 4. Send to Gemini (Audio text + Video Frame)
      const imageFrame = captureFrame();

      const responseText = await sendMessageWithVideo(chatSession, userText, imageFrame);
      const modelText = responseText || "Could you please elaborate?";

      // 5. Update UI with response
      const modelMsg: Message = { role: 'model', text: modelText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
      
      if (isAudioEnabled) speak(modelText);

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      // User tapped "Done" -> Send message
      handleSendMessage();
    } else {
      // User tapped "Speak" -> Start listening
      cancelSpeech(); // Stop AI talking
      setInputValue(''); 
      startListening();
    }
  };

  // Logic to show only the last ~60 chars of caption to prevent overflow/old text buildup
  const getRollingCaption = (text: string) => {
    if (!text) return "";
    const maxLength = 60;
    if (text.length <= maxLength) return text;
    return "..." + text.slice(-maxLength);
  };

  const currentCaption = getRollingCaption(transcript || inputValue);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-black text-white rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* --- Main Visual Area --- */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* 1. AI Persona / Active Speaker (Top on mobile, Left on Desktop) */}
        <div className="flex-1 bg-slate-900/50 relative border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
          {/* Header */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">AI Interviewer</span>
          </div>

          {/* AI Visualization */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-indigo-500/20 scale-110 shadow-[0_0_60px_rgba(99,102,241,0.3)]' : 'bg-slate-800'}`}>
              <div className={`w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative`}>
                 {/* Face/Avatar Abstract */}
                 <div className="text-4xl">🤖</div>
                 {/* Ripple Effect when speaking */}
                 {isSpeaking && (
                   <>
                     <div className="absolute inset-0 border-2 border-indigo-400 rounded-full animate-ping opacity-20"></div>
                     <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-ping opacity-20 delay-150"></div>
                   </>
                 )}
              </div>
            </div>
            <p className="mt-6 text-slate-400 font-medium text-center max-w-md animate-fadeIn min-h-[3rem]">
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center text-indigo-400">
                  Thinking <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </span>
              ) : (
                messages.length > 0 && messages[messages.length - 1].role === 'model' ? 
                 `"${messages[messages.length - 1].text.substring(0, 100)}${messages[messages.length - 1].text.length > 100 ? '...' : ''}"` 
                 : "Listening to you..."
              )}
            </p>
          </div>

          {/* Chat Transcript Overlay (Collapsible or scrollable) */}
          <div className="h-1/3 bg-black/40 backdrop-blur-md p-4 overflow-y-auto custom-scrollbar border-t border-white/5">
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-blue-300 text-right' : 'text-slate-300'}`}>
                  <span className="text-xs opacity-50 block mb-0.5">{msg.role === 'user' ? 'You' : 'Interviewer'}</span>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* 2. User Video Feed (Bottom on mobile, Right on Desktop) */}
        <div className="h-[250px] md:h-auto md:w-1/3 bg-black relative border-t md:border-t-0 md:border-l border-slate-800">
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

          {/* User Status Badge */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white/80">
              You ({userDetails.name})
            </div>
            {isListening && (
               <div className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                 REC
               </div>
            )}
          </div>
          
          {/* Live Rolling Caption Overlay */}
          {currentCaption && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="inline-block bg-black/70 text-white text-sm px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg max-w-full">
                {currentCaption}
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* --- Control Bar --- */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-20">
        
        {/* Left: Toggles */}
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-3 rounded-full transition-all ${isAudioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
          >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`p-3 rounded-full transition-all ${isVideoEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500'}`}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>

        {/* Center: Main Action (Tap to Speak / Send) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={toggleRecording}
            className={`h-14 px-8 rounded-full flex items-center gap-3 transition-all transform shadow-xl ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700 scale-105 ring-4 ring-red-900/50' 
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105'
            }`}
          >
            {isListening ? (
              <>
                <Send size={20} fill="currentColor" />
                <span className="font-bold">Tap to Send</span>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span className="font-bold">Tap to Speak</span>
              </>
            )}
          </button>
        </div>

        {/* Right: End Call */}
        <div>
          <button 
            onClick={() => { cancelSpeech(); onFinish(messages); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline">End Interview</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewStep;