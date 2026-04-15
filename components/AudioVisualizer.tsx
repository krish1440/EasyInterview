/**
 * @file AudioVisualizer.tsx
 * @module Components/Interactivity
 * @description Real-time audio waveform visualizer using the Web Audio API.
 * Provides visual feedback for AI and user speech by rendering frequency data
 * onto a performant canvas element.
 */

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  /** The media stream to visualize (from microphone) */
  stream: MediaStream | null;
  /** Whether the visualization should be active */
  isActive: boolean;
  /** Color theme for the bars */
  color?: string;
}

/**
 * High-performance Audio Waveform Component.
 * 
 * @description
 * Captures real-time frequency data from a MediaStream and renders it onto a 
 * High-DPI canvas using RequestAnimationFrame for 60FPS fluid motion.
 * 
 * @component AudioVisualizer
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive, color = '#4f46e5' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode>();
  const sourceRef = useRef<MediaStreamAudioSourceNode>();
  const contextRef = useRef<AudioContext>();

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    let audioContext: AudioContext | null = null;
    let analyzer: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    
    const hasAudioTracks = stream.getAudioTracks().length > 0;

    if (hasAudioTracks) {
      try {
        // Initialize Web Audio context and analyzer
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);

        analyzer.fftSize = 64; // Low resolution for clean bars
        source.connect(analyzer);

        contextRef.current = audioContext;
        analyzerRef.current = analyzer;
        sourceRef.current = source;
      } catch (e) {
        console.warn("AudioContext failed to initialize", e);
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzer?.frequencyBinCount || 32;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      if (analyzer) {
        analyzer.getByteFrequencyData(dataArray);
      } else if (isActive) {
        // Mock data for visual pulse if no actual audio stream is available
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(Date.now() / 200 + i) * 50 + 100;
        }
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 0.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Apply gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}80`);

        ctx.fillStyle = gradient;
        
        // Draw rounded bars (with fallback for older browsers)
        const radius = barWidth / 2;
        const barX = x;
        const barY = canvas.height - barHeight;
        
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth, barHeight, [radius, radius, 0, 0]);
          ctx.fill();
        } else {
          // Fallback to standard rect for older browsers
          ctx.fillRect(barX, barY, barWidth, barHeight);
        }

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (contextRef.current) contextRef.current.close();
    };
  }, [stream, isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={40} 
      className="w-full h-full opacity-80"
      aria-hidden="true"
    />
  );
};

export default AudioVisualizer;
