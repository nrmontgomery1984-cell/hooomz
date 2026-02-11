'use client';

/**
 * Confidence Score Badge
 * Displays a knowledge item's confidence score with color coding
 */

import React from 'react';

interface ConfidenceScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 70) return 'bg-teal-100 text-teal-800 border-teal-200';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (score >= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'High';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

export function ConfidenceScoreBadge({
  score,
  size = 'md',
  showLabel = false,
  className = '',
}: ConfidenceScoreBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${getScoreColor(score)} ${sizeStyles[size]} ${className}`}
    >
      <span>{score}%</span>
      {showLabel && (
        <span className="font-normal opacity-75">{getScoreLabel(score)}</span>
      )}
    </span>
  );
}
