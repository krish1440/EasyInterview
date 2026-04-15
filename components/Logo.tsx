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
        <linearGradient id="logo-dark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" /> {/* Indigo 700 */}
          <stop offset="100%" stopColor="#7e22ce" /> {/* Purple 700 */}
        </linearGradient>
      </defs>
      
      {/* Outer Hexagon - High Contrast Stroke */}
      <path 
        d="M50 8L12 30V70L50 92L88 70V30L50 8Z" 
        stroke="url(#logo-dark-gradient)" 
        strokeWidth="8" 
        strokeLinejoin="round" 
      />
      
      {/* Central Voice Metric - Solid Dark Gradient */}
      <rect x="44" y="30" width="12" height="40" rx="6" fill="url(#logo-dark-gradient)" />
      
      {/* Dynamic Spectrum Bars - Accentuating depth */}
      <rect x="26" y="42" width="10" height="16" rx="5" fill="url(#logo-dark-gradient)" fillOpacity="0.4" />
      <rect x="64" y="42" width="10" height="16" rx="5" fill="url(#logo-dark-gradient)" fillOpacity="0.4" />
      
      {/* Intelligence Node - Floating at apex */}
      <circle cx="50" cy="20" r="4" fill="#4338ca" />
    </svg>
  );
};

export default Logo;
