/**
 * @file useSpeech.ts
 * @module Hooks/Speech
 * @description Advanced hook for managing multimodal speech interactions (STT and TTS).
 * Implements resilient speech recognition patterns and high-quality synthesis.
 * 
 * @version 1.0.1
 * @package EasyInterview
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Extended Window interface to accommodate the Web Speech API vendor-specific implementations.
 * @access private
 */
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

/**
 * Custom hook for full-duplex speech communication.
 * 
 * @description
 * This hook encapsulates the complexities of the Web Speech API, providing:
 * 1. **Persistent Speech-to-Text (STT)**: Uses a "Watchdog" timer to reset recognition sessions 
 *    before browser-imposed 60s idle timeouts, ensuring an "infinite stream" feel.
 * 2. **Lossless Restart Strategy**: Preserves interim transcripts during manual or automatic 
 *    session restarts to prevent data loss.
 * 3. **Intelligent Text-to-Speech (TTS)**: Cleans UI-specific symbols (markdown) and selects 
 *    the highest quality local/system voices (e.g., Google US English, Apple Samantha).
 */
/**
 * Interface for the speech hook return payload.
 * @interface SpeechInterface
 */
export interface SpeechInterface {
  /** Reactive state indicating if the microphone is active and transcribing */
  isListening: boolean;
  /** The current accumulated transcript of the user's speech */
  transcript: string;
  /** State setter for the transcript */
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  /** Initiates the Speech Recognition engine */
  startListening: () => void;
  /** Immediately terminates the Speech Recognition engine */
  stopListening: () => void;
  /** Converts text to audible speech using system voices */
  speak: (text: string) => void;
  /** Reactive state indicating if the system is currently synthesizing audio */
  isSpeaking: boolean;
  /** Interrupts and clears all active speech synthesis tasks */
  cancelSpeech: () => void;
  /** Clears the local transcript buffers */
  resetTranscript: () => void;
}

/**
 * Advanced Hook for Full-Duplex Speech Communication.
 * @function useSpeech
 * @returns {SpeechInterface} The operational interface for STT and TTS.
 */
export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const isManuallyStoppedRef = useRef(false);

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
        recognitionStartTimeRef.current = Date.now();
        lastSpeechTimestampRef.current = Date.now();
      };
      
      recognition.onend = () => {
        if (recognitionRef.current && !isManuallyStoppedRef.current) {
           if (interimTranscriptRef.current.trim()) {
             const prefix = finalTranscriptRef.current.length > 0 ? ' ' : '';
             finalTranscriptRef.current += prefix + interimTranscriptRef.current.trim();
             interimTranscriptRef.current = '';
             setTranscript(finalTranscriptRef.current);
           }

           try {
             recognition.start();
           } catch (e) {
             setTimeout(() => {
                if (!isManuallyStoppedRef.current && recognitionRef.current) {
                   try { recognitionRef.current.start(); } catch(e) {}
                }
             }, 100);
           }
        } else {
           setIsListening(false);
        }
      };

      recognition.onresult = (event: any) => {
        lastSpeechTimestampRef.current = Date.now();
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const prefix = finalTranscriptRef.current.length > 0 ? ' ' : '';
            finalTranscriptRef.current += prefix + chunk.trim();
            interimTranscriptRef.current = '';
          } else {
            interim += chunk;
          }
        }

        if (interim) {
           interimTranscriptRef.current = interim;
        }

        setTranscript(finalTranscriptRef.current + (interim ? ' ' + interim : ''));
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
           return;
        }
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
           setIsListening(false);
           isManuallyStoppedRef.current = true;
           return;
        }

        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = recognition;
    }
    
    const loadVoices = () => {
       if (synthRef.current) {
         synthRef.current.getVoices();
       }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
       window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) {
         isManuallyStoppedRef.current = true;
         recognitionRef.current.stop();
      }
    };

  }, []);

  /**
   * Interval-based hook to proactively restart the recognition engine.
   * Prevents browser timeouts by resetting the internal 60-second limit during moments of silence.
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isListening && !isManuallyStoppedRef.current && recognitionRef.current) {
         const now = Date.now();
         const sessionDuration = now - recognitionStartTimeRef.current;
         const timeSinceLastSpeech = now - lastSpeechTimestampRef.current;

         if (sessionDuration > 45000 && timeSinceLastSpeech > 1000) {
            console.log("Proactive restart during silence to reset browser timer...");
            recognitionRef.current.stop(); 
         }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isListening]);

  /**
   * Initializes the microphone listener and clears temporary buffers.
   * @description Resetting the state ensures a clean slate for the next response.
   * @function startListening
   * @public
   */
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        isManuallyStoppedRef.current = false;
        finalTranscriptRef.current = '';
        interimTranscriptRef.current = '';
        setTranscript('');
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

  /**
   * Stops the microphone listener immediately.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isManuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  /**
   * Resets the local transcript storage.
   */
  const resetTranscript = useCallback(() => {
     finalTranscriptRef.current = '';
     interimTranscriptRef.current = '';
     setTranscript('');
  }, []);

  /**
   * Cancels any active or queued synthesized speech outputs.
   */
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

  /**
   * Synthesizes provided text into audible speech using high-fidelity system voices.
   * 
   * @description
   * The process involves:
   * 1. Pre-cleaning text (removing asterisks, hashtags, backticks).
   * 2. injecting a slight buffer for auditory clarity.
   * 3. Selecting preferred linguistic voices from the system's voice registry.
   * 4. Executing speech synthesis with state-managed lifecycle (isSpeaking).
   * 
   * @function speak
   * @param {string} text - The raw text to be synthesized into audio.
   * @public
   */
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