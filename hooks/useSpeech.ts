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
  
  // Track final vs interim results to prevent duplication
  const finalTranscriptRef = useRef(''); // Only committed final results
  const lastProcessedIndexRef = useRef(0); // Track which results we've seen

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        lastProcessedIndexRef.current = 0; // Reset on start
      };
      
      recognition.onend = () => {
        // If we shouldn't be stopped, restart (Infinite Stream)
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
        // Process only NEW final results to avoid duplication
        let newFinalText = '';
        let currentInterimText = '';
        
        // Iterate through results starting from where we left off
        for (let i = lastProcessedIndexRef.current; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          
          if (result.isFinal) {
            // This is a final result we haven't processed yet
            newFinalText += (newFinalText ? ' ' : '') + text;
            lastProcessedIndexRef.current = i + 1; // Mark as processed
          } else {
            // This is interim (still being spoken)
            currentInterimText += (currentInterimText ? ' ' : '') + text;
          }
        }
        
        // Add new final text to our history
        if (newFinalText) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + newFinalText;
        }
        
        // Display: final + current interim
        const fullDisplay = (finalTranscriptRef.current + (currentInterimText ? ' ' + currentInterimText : '')).trim();
        setTranscript(fullDisplay);
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

  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.manualStop = false;
        // Reset everything for a fresh turn
        finalTranscriptRef.current = '';
        lastProcessedIndexRef.current = 0;
        setTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech error", e);
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
     finalTranscriptRef.current = '';
     lastProcessedIndexRef.current = 0;
     setTranscript('');
  }, []);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);

      const cleanText = text.replace(/[*#_`]/g, '').trim();
      if (!cleanText) return;

      // Buffer for audio cutoff: Prepend silence/punctuation so browser cuts that off instead of words
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
        (v.name.includes('Google US English') || v.name.includes('Samantha')) 
        && v.lang.startsWith('en')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      setTimeout(() => {
         if (synthRef.current) {
            if (synthRef.current.paused) synthRef.current.resume();
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
