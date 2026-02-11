'use client';

/**
 * Flag For Labs Button
 * Persistent FAB for crew to quickly submit observations to Labs (Phase 2)
 */

import React, { useState } from 'react';

interface FlagForLabsButtonProps {
  onPress: () => void;
  className?: string;
}

export function FlagForLabsButton({ onPress, className = '' }: FlagForLabsButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-teal-700 text-white shadow-lg flex items-center justify-center transition-transform ${isPressed ? 'scale-95' : 'scale-100 hover:scale-105'} ${className}`}
      onClick={onPress}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      aria-label="Flag for Labs"
      title="Flag for Labs"
    >
      {/* Flask icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3h6" />
        <path d="M10 3v7.53L4.89 16.88A2 2 0 0 0 6.62 20h10.76a2 2 0 0 0 1.73-3.12L14 10.53V3" />
        <line x1="8" y1="14" x2="16" y2="14" />
      </svg>
    </button>
  );
}
