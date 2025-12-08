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
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to store the committed final text
  const finalTranscriptRef = useRef('');
  // Ref to store interim text to rescue it on restart
  const interimTranscriptRef = useRef('');
  // Ref to track explicit user intent to stop
  const isManuallyStoppedRef = useRef(false);

  // TIMING REFS FOR SMART KEEPALIVE
  const lastSpeechTimestampRef = useRef<number>(Date.now());
  const recognitionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        // Reset the start time whenever recognition begins/restarts
        recognitionStartTimeRef.current = Date.now();
        lastSpeechTimestampRef.current = Date.now();
      };
      
      recognition.onend = () => {
        // Infinite stream: if not manually stopped, restart immediately.
        if (recognitionRef.current && !isManuallyStoppedRef.current) {
           // LOSSLESS RESTART STRATEGY:
           // If the browser cuts off while there is pending interim text (gray text),
           // we rescue it by appending it to the final transcript before restarting.
           // This prevents "missing words" during the restart cycle.
           if (interimTranscriptRef.current.trim()) {
             const prefix = finalTranscriptRef.current.length > 0 ? ' ' : '';
             finalTranscriptRef.current += prefix + interimTranscriptRef.current.trim();
             interimTranscriptRef.current = '';
             setTranscript(finalTranscriptRef.current);
           }

           try {
             recognition.start();
           } catch (e) {
             // If start fails (e.g. firing too fast), retry after short delay
             setTimeout(() => {
                if (!isManuallyStoppedRef.current && recognitionRef.current) {
                   try { recognitionRef.current.start(); } catch(e) {}
                }
             }, 100);
           }
        } else {
           // Only update UI state if it was a manual stop
           setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        // Update activity timestamp whenever speech is detected
        lastSpeechTimestampRef.current = Date.now();
        
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // If final, add to our permanent buffer with a space to prevent merging
            const prefix = finalTranscriptRef.current.length > 0 ? ' ' : '';
            finalTranscriptRef.current += prefix + chunk.trim();
            interimTranscriptRef.current = ''; // Clear interim as it is now finalized
          } else {
            // If interim, store it temporarily
            interim += chunk;
          }
        }

        // Save interim to ref in case we crash/restart before it becomes final
        if (interim) {
           interimTranscriptRef.current = interim;
        }

        // Display = Committed Final Text + Current Interim Text
        setTranscript(finalTranscriptRef.current + (interim ? ' ' + interim : ''));
      };

      recognition.onerror = (event: any) => {
        // Ignore non-fatal errors to keep the loop alive
        if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
           return;
        }
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
           // If permission denied, force UI to stop
           setIsListening(false);
           isManuallyStoppedRef.current = true;
           return;
        }

        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = recognition;
    }
    
    // Voice pre-loading
    const loadVoices = () => {
       if (synthRef.current) {
         synthRef.current.getVoices();
       }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
       window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup on unmount
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
         isManuallyStoppedRef.current = true;
         recognitionRef.current.stop();
      }
    };

  }, []);

  // SMART KEEPALIVE INTERVAL
  // Browsers usually kill speech recognition after ~60 seconds.
  // We proactively restart it during a SILENCE period (after 45s of running)
  // to avoid a hard cut-off mid-sentence.
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isListening && !isManuallyStoppedRef.current && recognitionRef.current) {
         const now = Date.now();
         const sessionDuration = now - recognitionStartTimeRef.current;
         const timeSinceLastSpeech = now - lastSpeechTimestampRef.current;

         // If running for > 45 seconds AND user has been silent for > 1 second
         if (sessionDuration > 45000 && timeSinceLastSpeech > 1000) {
            console.log("Proactive restart during silence to reset browser timer...");
            // Stopping triggers 'onend', which automatically restarts due to our logic above.
            // This resets the browser's internal 60s timer safely during silence.
            recognitionRef.current.stop(); 
         }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        isManuallyStoppedRef.current = false;
        // Reset buffers for a fresh turn
        finalTranscriptRef.current = '';
        interimTranscriptRef.current = '';
        setTranscript('');
        
        // VISUAL FIX: Set UI to listening immediately.
        setIsListening(true);
        
        recognitionRef.current.start();
      } catch (e: any) {
        if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
          return;
        }
        console.error("Speech error", e);
        setIsListening(false);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isManuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
     finalTranscriptRef.current = '';
     interimTranscriptRef.current = '';
     setTranscript('');
  }, []);

  const cancelSpeech = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

      synthRef.current.cancel();
      setIsSpeaking(false);

      const cleanText = text.replace(/[*#_`]/g, '').trim();
      if (!cleanText) return;

      const textWithBuffer = ". " + cleanText;

      const utterance = new SpeechSynthesisUtterance(textWithBuffer);
      currentUtteranceRef.current = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      };
      
      utterance.onerror = (e: any) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
           console.error("TTS Error", e.error);
        }
        setIsSpeaking(false);
      };
      
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => 
        (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Natural')) 
        && v.lang.startsWith('en')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      speakTimeoutRef.current = setTimeout(() => {
         if (synthRef.current) {
            if (synthRef.current.paused) synthRef.current.resume();
            synthRef.current.speak(utterance);
         }
      }, 100);
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