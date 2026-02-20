'use client';

/**
 * Vote Ballot Card — Shows a ballot with its options and vote buttons
 */

import React from 'react';
import type { LabsVoteBallot, BallotOption } from '@hooomz/shared-contracts';

interface VoteBallotCardProps {
  ballot: LabsVoteBallot;
  hasVoted?: boolean;
  onVote?: (testId: string) => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-600',
};

function getBarWidth(option: BallotOption, totalVotes: number): string {
  if (totalVotes === 0) return '0%';
  return `${Math.round((option.voteCount / totalVotes) * 100)}%`;
}

export function VoteBallotCard({ ballot, hasVoted, onVote, className = '' }: VoteBallotCardProps) {
  const statusStyle = STATUS_STYLES[ballot.status] || 'bg-gray-100 text-gray-600';
  const isActive = ballot.status === 'active';
  const canVote = isActive && !hasVoted && !!onVote;

  // Find winner for closed ballots
  const maxVotes = Math.max(...ballot.options.map((o) => o.voteCount));
  const isWinner = (option: BallotOption) =>
    ballot.status === 'closed' && option.voteCount === maxVotes && maxVotes > 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Week {ballot.id}</h3>
          <p className="text-xs text-gray-500">
            {ballot.weekStart} — {ballot.weekEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{ballot.totalVotes} vote{ballot.totalVotes !== 1 ? 's' : ''}</span>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle}`}>
            {ballot.status}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {ballot.options.map((option) => {
          const winner = isWinner(option);
          return (
            <div
              key={option.testId}
              className={`rounded-lg border p-3 ${winner ? 'border-teal-300 bg-teal-50' : 'border-gray-100 bg-gray-50'}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${winner ? 'text-teal-800' : 'text-gray-800'}`}>
                    {option.title}
                    {winner && <span className="ml-1.5 text-xs text-teal-600">Winner</span>}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{option.description}</p>
                </div>
                {canVote && (
                  <button
                    className="ml-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors flex-shrink-0"
                    onClick={() => onVote(option.testId)}
                  >
                    Vote
                  </button>
                )}
              </div>

              {/* Vote bar */}
              {ballot.totalVotes > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${winner ? 'bg-teal-600' : 'bg-gray-400'}`}
                        style={{ width: getBarWidth(option, ballot.totalVotes) }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
                      {option.voteCount} ({ballot.totalVotes > 0 ? Math.round((option.voteCount / ballot.totalVotes) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vote state message */}
      {isActive && hasVoted && (
        <p className="text-xs text-gray-500 mt-3 text-center">You&apos;ve already voted on this ballot.</p>
      )}
    </div>
  );
}
