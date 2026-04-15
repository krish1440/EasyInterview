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
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Hexagon Shield */}
      <path 
        d="M50 5L15 25V75L50 95L85 75V25L50 5Z" 
        stroke="url(#logo-gradient)" 
        strokeWidth="6" 
        strokeLinejoin="round"
        fill="rgba(99, 102, 241, 0.05)"
      />
      
      {/* Dynamic Sound Wave Pulse */}
      <path 
        d="M30 50V50M40 40V60M50 30V70M60 40V60M70 50V50" 
        stroke="url(#logo-gradient)" 
        strokeWidth="5" 
        strokeLinecap="round" 
        filter="url(#logo-glow)"
      />
      
      {/* Central Intelligence Node */}
      <circle cx="50" cy="50" r="5" fill="white" className="animate-pulse" />
      <circle cx="50" cy="50" r="8" stroke="url(#logo-gradient)" strokeWidth="2" opacity="0.5" />
    </svg>
  );
};

export default Logo;
