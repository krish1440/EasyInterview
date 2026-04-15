/**
 * @file Logo.tsx
 * @description High-fidelity SVG logo component for EasyInterview.
 * Represents a fusion of AI intelligence (nodes) and professional communication (waveform).
 */

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Premium Brand Asset: EasyInterview Logo.
 * 
 * @description
 * A modern, pentagonal emblem featuring a professional interview motif.
 * Symbolizes a secure, AI-powered shield for career growth.
 * 
 * @component Logo
 */
const Logo: React.FC<LogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Bold Pentagonal Interview Shield */}
      <path 
        d="M12 2L4 7V17.5L12 22L20 17.5V7L12 2Z" 
        fill="#4338ca" 
      />
      
      {/* Large-Scale Microphone Core - Signifying Professional Interview */}
      <rect x="9.5" y="7" width="5" height="8" rx="2.5" fill="white" />
      
      {/* Audio Capture Wave - Integrated UI Element */}
      <path 
        d="M7 11C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Dynamic Voice Modulation Bars */}
      <rect x="7" y="10" width="1.5" height="2" rx="0.75" fill="white" fillOpacity="0.5" />
      <rect x="15.5" y="10" width="1.5" height="2" rx="0.75" fill="white" fillOpacity="0.5" />
      
      {/* AI Apex Pulsar - Representing Live Analysis */}
      <circle cx="12" cy="4.5" r="1.2" fill="white" className="animate-pulse" />
      
      {/* Stability Stem */}
      <rect x="11.5" y="16" width="1" height="2.5" rx="0.5" fill="white" opacity="0.6" />
    </svg>
  );
};

export default Logo;
