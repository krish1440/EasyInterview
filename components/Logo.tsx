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
      {/* Outer Hexagonal Shield */}
      <path 
        d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z" 
        fill="#4338ca" 
      />
      
      {/* AI Neural Pulse - Central Intelligence Hub */}
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1" strokeDasharray="1 1" />
      <circle cx="12" cy="12" r="1.5" fill="white" />
      
      {/* Advanced Intersecting Metrics - Linking Speech to Data */}
      <path d="M12 7V9.5M12 14.5V17" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <path d="M7 12H9.5M14.5 12H17" stroke="white" strokeWidth="1" strokeLinecap="round" />
      
      {/* Precision Nodes */}
      <circle cx="12" cy="7.5" r="0.8" fill="white" />
      <circle cx="12" cy="16.5" r="0.8" fill="white" />
      <circle cx="7.5" cy="12" r="0.8" fill="white" />
      <circle cx="16.5" cy="12" r="0.8" fill="white" />
      
      {/* Apex Spark */}
      <circle cx="12" cy="4.5" r="1" fill="white" className="animate-pulse" />
    </svg>
  );
};

export default Logo;
