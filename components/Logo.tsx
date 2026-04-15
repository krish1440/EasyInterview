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
 * An ultra-scaled, pentagonal emblem designed for maximum visibility.
 * Features a bold interview motif that fills the entire icon container.
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
      {/* Ultra-Large Pentagonal Shield - Maximum Container Fill */}
      <path 
        d="M12 0.5L1.5 8V18.5L12 23.5L22.5 18.5V8L12 0.5Z" 
        fill="#4338ca" 
      />
      
      {/* Maximized Microphone Core */}
      <rect x="9" y="6" width="6" height="10" rx="3" fill="white" />
      
      {/* High-Impact Capture Wave */}
      <path 
        d="M6 10.5C6 13.5 8.5 16 12 16C15.5 16 18 13.5 18 10.5" 
        stroke="white" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
      />
      
      {/* Bold Modulation Nodes */}
      <rect x="5.5" y="9.5" width="2" height="3" rx="1" fill="white" fillOpacity="0.6" />
      <rect x="16.5" y="9.5" width="2" height="3" rx="1" fill="white" fillOpacity="0.6" />
      
      {/* AI Apex Pulsar - Integrated at top point */}
      <circle cx="12" cy="3.5" r="1.3" fill="white" className="animate-pulse" />
      
      {/* Lower Foundation Base */}
      <rect x="11.2" y="16.5" width="1.6" height="3.5" rx="0.8" fill="white" opacity="0.6" />
    </svg>
  );
};

export default Logo;
