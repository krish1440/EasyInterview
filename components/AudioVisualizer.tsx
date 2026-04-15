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

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The frequency wave visualization has been removed as requested.
    // The canvas is kept clear while maintaining state functionality.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
  }, [isActive, stream]);

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
