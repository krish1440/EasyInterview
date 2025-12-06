
import { useState, useEffect, useRef, useCallback } from 'react';

// Define types for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Helper to stitch two strings together preventing duplication
// e.g. "Thank" + "Thank you" -> "Thank you"
// e.g. "Hello" + "Hello World" -> "Hello World" (Mobile bug fix)
// e.g. "My name is" + "Krish" -> "My name is Krish"
const stitchText = (existing: string, incoming: string): string => {
  const s = existing.trim();
  const e = incoming.trim();
  
  if (!s) return e;
  if (!e) return s;

  const sLower = s.toLowerCase();
  const eLower = e.toLowerCase();

  // 1. Check if incoming fully contains existing (Mobile bug where context is resent)
  if (eLower.startsWith(sLower)) {
    return e;
  }

  // 2. Check for word overlap (Suffix of existing == Prefix of incoming)
  // This handles "Thank" + "Thank you" -> "Thank you"
  const existingWords = s.split(/\s+/);
  const incomingWords = e.split(/\s+/);
  
  // Check overlap of up to 5 words to be safe and efficient
  const maxOverlap = Math.min(existingWords.length, incomingWords.length, 5);
  
  for (let i = maxOverlap; i > 0; i--) {
     const suffix = existingWords.slice(-i).join(' ').toLowerCase();
     const prefix = incomingWords.slice(0, i).join(' ').toLowerCase();
     
     // normalize punctuation for comparison
     const cleanSuffix = suffix.replace(/[.,?!]/g, '');
     const cleanPrefix = prefix.replace(/[.,?!]/g, '');

     if (cleanSuffix === cleanPrefix) {
        // Found overlap: take existing + non-overlapping part of incoming
        return s + ' ' + incomingWords.slice(i).join(' ');
     }
  }

  // No overlap found, just append
  return s + ' ' + e;
};

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs to maintain state without triggering re-renders inside callbacks
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Data buffers
  const committedTranscriptRef = useRef(''); // Text from previous sessions (before pause/restart)
  const currentSessionTranscriptRef = useRef(''); // Text from the current active session

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
        // When the engine stops (or restarts), we commit the current session's text to the permanent buffer
        if (currentSessionTranscriptRef.current) {
          // Use stitchText here to ensure clean merging when committing
          committedTranscriptRef.current = stitchText(committedTranscriptRef.current, currentSessionTranscriptRef.current);
          currentSessionTranscriptRef.current = '';
        }

        // If we are supposed to be listening (didn't manually stop), restart it (Infinite Stream)
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
        let finalForThisSession = '';
        let interimForThisSession = '';

        // RECONSTRUCTION STRATEGY:
        // We rebuild the current session's text from scratch every time
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalForThisSession += event.results[i][0].transcript;
          } else {
            interimForThisSession += event.results[i][0].transcript;
          }
        }

        const rawCurrent = (finalForThisSession + ' ' + interimForThisSession).trim();
        currentSessionTranscriptRef.current = rawCurrent;

        // SMART STITCH: Combine committed history with current live text
        // This removes duplicates like "Thank Thank you" -> "Thank you"
        const display = stitchText(committedTranscriptRef.current, rawCurrent);

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
        // Reset buffers for a fresh turn
        committedTranscriptRef.current = '';
        currentSessionTranscriptRef.current = '';
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
     committedTranscriptRef.current = '';
     currentSessionTranscriptRef.current = '';
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
