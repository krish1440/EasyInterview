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
      {/* High-Impact Solid Hexagon Background */}
      <path 
        d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z" 
        fill="#4338ca" 
      />
      
      {/* Central Voice Pillar - High Contrast White */}
      <rect x="11" y="8" width="2" height="8" rx="1" fill="white" />
      
      {/* Symmetrical Side-bars - Representing AI modulation */}
      <rect x="7.5" y="10.5" width="2" height="3" rx="1" fill="white" fillOpacity="0.7" />
      <rect x="14.5" y="10.5" width="2" height="3" rx="1" fill="white" fillOpacity="0.7" />
      
      {/* AI Apex Node */}
      <circle cx="12" cy="5.5" r="1.2" fill="white" />
      
      {/* Subtle Base Foundation */}
      <path d="M9 19H15" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
};

export default Logo;
