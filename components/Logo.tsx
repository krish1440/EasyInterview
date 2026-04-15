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
 * A modern, hexagonal emblem featuring a multi-stop gradient.
 * Symbolizes a secure, AI-powered shield for career growth.
 * 
 * @component Logo
 */
const Logo: React.FC<LogoProps> = ({ size = 32, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Primary Bold Hexagon Container */}
      <path 
        d="M50 5L11 27.5V72.5L50 95L89 27.5L50 5Z" 
        fill="url(#logo-gradient)" 
        stroke="white"
        strokeWidth="1"
      />
      
      {/* Core "Voice" Negative Space Beam */}
      <rect x="44" y="25" width="12" height="50" rx="6" fill="white" />
      
      {/* Symmetric Frequency Side-Bars (Simplified for Visibility) */}
      <rect x="28" y="40" width="10" height="20" rx="5" fill="white" fillOpacity="0.75" />
      <rect x="62" y="40" width="10" height="20" rx="5" fill="white" fillOpacity="0.75" />
      
      {/* The "AI Spark" - Top Center Focus */}
      <circle cx="50" cy="18" r="4" fill="white" filter="url(#glow)" />
      
      {/* Subtle Bottom Accent for Depth */}
      <path d="M40 82H60" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
};

export default Logo;
