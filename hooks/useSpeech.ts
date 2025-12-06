
import { useState, useEffect, useRef, useCallback } from 'react';

// Define types for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs to maintain state without triggering re-renders inside callbacks
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fullTranscriptRef = useRef(''); // Cumulative transcript buffer

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onend = () => {
        // If we are supposed to be listening (didn't manually stop), restart it
        // This makes it "infinite"
        if (recognitionRef.current && !recognitionRef.current.manualStop) {
           try {
             recognition.start();
           } catch (e) {
             // Ignore error if already started
           }
        } else {
           setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
           // Add space if needed
           fullTranscriptRef.current += (fullTranscriptRef.current ? ' ' : '') + finalChunk.trim();
        }

        // Display = Saved Full Transcript + Current Moving Interim
        // We trim to ensure clean spacing
        const display = (fullTranscriptRef.current + ' ' + interimTranscript).trim();
        setTranscript(display);
      };

      recognitionRef.current = recognition;
    }
    
    // Voice pre-loading fix for Chrome
    const loadVoices = () => {
       if (synthRef.current) {
         synthRef.current.getVoices();
       }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
       window.speechSynthesis.onvoiceschanged = loadVoices;
    }

  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.manualStop = false;
        // Don't clear fullTranscriptRef here if we want to resume? 
        // Usually "Tap to Speak" implies a fresh turn, so we clear.
        fullTranscriptRef.current = ''; 
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech recognition already started or error", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.manualStop = true;
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
     fullTranscriptRef.current = '';
     setTranscript('');
  }, []);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      // 1. Cancel any current speaking to prevent queue overlap bugs
      synthRef.current.cancel();
      setIsSpeaking(false);

      // 2. Clean text: Remove markdown symbols that might pause TTS (*, #, etc.)
      const cleanText = text.replace(/[*#_`]/g, '').trim();
      if (!cleanText) return;

      // HACK: Add leading punctuation/silence. 
      // Browsers (especially Chrome) often cut off the first ~0.5s of audio while the engine wakes up.
      // By adding period-space-period, we sacrifice silence instead of the actual words.
      const textWithBuffer = ". " + cleanText;

      const utterance = new SpeechSynthesisUtterance(textWithBuffer);
      currentUtteranceRef.current = utterance; // Keep reference to prevent garbage collection

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };
      
      // FIX: Filter out 'canceled' errors to prevent false positives in console
      utterance.onerror = (e: any) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          // This is expected when we interrupt speech
          setIsSpeaking(false);
          return;
        }
        console.error("TTS Error", e.error);
        setIsSpeaking(false);
      };
      
      // Select Voice
      const voices = synthRef.current.getVoices();
      // Try to get a high quality English voice
      const preferredVoice = voices.find(v => 
        (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Natural')) 
        && v.lang.startsWith('en')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      // 3. Timeout to ensure cancel() takes effect and audio context wakes up.
      // We rely on the text buffer (". ") to handle the initial cutoff, 
      // but a short delay is still robust for the engine state.
      setTimeout(() => {
         if (synthRef.current) {
            // Explicit resume required for Chrome bugs where it gets stuck in 'paused'
            if (synthRef.current.paused) {
                synthRef.current.resume();
            }
            synthRef.current.speak(utterance);
         }
      }, 100);
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    speak,
    isSpeaking,
    cancelSpeech,
    resetTranscript
  };
};
