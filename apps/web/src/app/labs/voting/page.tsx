'use client';

/**
 * Labs Voting Page — Active ballot + vote UI, past ballots with results
 */

import Link from 'next/link';
import { useLabsBallots, useLabsActiveBallot, useCastLabsVote, useLabsHasVoted } from '@/lib/hooks/useLabsData';
import { VoteBallotCard, VoteResultsChart } from '@/components/labs';
import { SECTION_COLORS } from '@/lib/viewmode';

const LABS_COLOR = SECTION_COLORS.labs;

export default function LabsVotingPage() {
  const { data: allBallots = [], isLoading } = useLabsBallots();
  const { data: activeBallot } = useLabsActiveBallot();

  // For now, use 'nathan' as the partnerId (will come from auth context later)
  const partnerId = 'nathan';
  const { data: hasVoted = false } = useLabsHasVoted(
    activeBallot?.id || '',
    partnerId
  );
  const castVote = useCastLabsVote();

  const closedBallots = allBallots
    .filter((b) => b.status === 'closed')
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading voting...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Partner Voting</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Weekly research priority ballots</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Active Ballot */}
        {activeBallot ? (
          <div>
            <h2 className="text-sm font-semibold mb-2 px-1" style={{ color: 'var(--text-2)' }}>Active Ballot</h2>
            <VoteBallotCard
              ballot={activeBallot}
              hasVoted={hasVoted}
              onVote={(testId) => castVote.mutate({
                ballotId: activeBallot.id,
                testId,
                partnerId,
                partnerTier: 'fieldlab',
              })}
            />
          </div>
        ) : (
          <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No active ballot this week.</p>
          </div>
        )}

        {/* Past Ballots */}
        {closedBallots.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-2 px-1" style={{ color: 'var(--text-2)' }}>Past Ballots</h2>
            <div className="space-y-3">
              {closedBallots.map((ballot) => (
                <div key={ballot.id} style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Week {ballot.id}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{ballot.weekStart} — {ballot.weekEnd}</p>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{ballot.totalVotes} votes</span>
                  </div>
                  <VoteResultsChart
                    results={ballot.options.map((o) => ({
                      testId: o.testId,
                      title: o.title,
                      description: o.description,
                      voteCount: o.voteCount,
                    }))}
                    totalVotes={ballot.totalVotes}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {allBallots.length === 0 && (
          <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No ballots yet.</p>
            <Link href="/labs/seed" className="text-sm hover:underline mt-2 inline-block" style={{ color: LABS_COLOR }}>
              Seed data
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
