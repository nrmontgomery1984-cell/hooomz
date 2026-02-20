'use client';

/**
 * Vote Results Chart — Horizontal bar chart for ballot results
 * Monochrome with teal highlight for the winner
 */

import React from 'react';

interface VoteResultsChartProps {
  results: { testId: string; title: string; description: string; voteCount: number }[];
  totalVotes: number;
  className?: string;
}

export function VoteResultsChart({ results, totalVotes, className = '' }: VoteResultsChartProps) {
  const maxVotes = Math.max(...results.map((r) => r.voteCount));

  return (
    <div className={`space-y-3 ${className}`}>
      {results.map((result) => {
        const pct = totalVotes > 0 ? Math.round((result.voteCount / totalVotes) * 100) : 0;
        const isWinner = result.voteCount === maxVotes && maxVotes > 0;

        return (
          <div key={result.testId}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${isWinner ? 'text-teal-800' : 'text-gray-700'}`}>
                {result.title}
                {isWinner && <span className="ml-1.5 text-xs text-teal-600">Winner</span>}
              </span>
              <span className="text-sm tabular-nums text-gray-500">
                {result.voteCount} ({pct}%)
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isWinner ? 'bg-teal-600' : 'bg-gray-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
