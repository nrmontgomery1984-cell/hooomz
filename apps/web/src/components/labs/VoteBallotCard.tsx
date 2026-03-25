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

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  draft: { background: 'var(--surface-2)', color: 'var(--mid)' },
  active: { background: '#dcfce7', color: '#15803d' },
  closed: { background: '#fee2e2', color: 'var(--red)' },
};

function getBarWidth(option: BallotOption, totalVotes: number): string {
  if (totalVotes === 0) return '0%';
  return `${Math.round((option.voteCount / totalVotes) * 100)}%`;
}

export function VoteBallotCard({ ballot, hasVoted, onVote, className = '' }: VoteBallotCardProps) {
  const statusStyle = STATUS_STYLES[ballot.status] || { background: 'var(--surface-2)', color: 'var(--mid)' };
  const isActive = ballot.status === 'active';
  const canVote = isActive && !hasVoted && !!onVote;

  // Find winner for closed ballots
  const maxVotes = Math.max(...ballot.options.map((o) => o.voteCount));
  const isWinner = (option: BallotOption) =>
    ballot.status === 'closed' && option.voteCount === maxVotes && maxVotes > 0;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--charcoal)' }}>Week {ballot.id}</h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {ballot.weekStart} — {ballot.weekEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{ballot.totalVotes} vote{ballot.totalVotes !== 1 ? 's' : ''}</span>
          <span
            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
            style={statusStyle}
          >
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
              className="rounded-lg border p-3"
              style={winner
                ? { borderColor: '#5eead4', background: '#f0fdfa' }
                : { borderColor: 'var(--border)', background: 'var(--surface)' }
              }
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-medium"
                    style={{ color: winner ? '#115e59' : 'var(--charcoal)' }}
                  >
                    {option.title}
                    {winner && <span className="ml-1.5 text-xs text-[var(--accent)]">Winner</span>}
                  </h4>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{option.description}</p>
                </div>
                {canVote && (
                  <button
                    className="ml-3 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)] transition-colors flex-shrink-0"
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
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${winner ? 'bg-[var(--accent)]' : ''}`}
                        style={{ width: getBarWidth(option, ballot.totalVotes), ...(!winner ? { background: 'var(--muted)' } : {}) }}
                      />
                    </div>
                    <span className="text-xs tabular-nums w-12 text-right" style={{ color: 'var(--muted)' }}>
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
        <p className="text-xs mt-3 text-center" style={{ color: 'var(--muted)' }}>You&apos;ve already voted on this ballot.</p>
      )}
    </div>
  );
}
