'use client';

/**
 * Labs Voting Page — Active ballot + vote UI, past ballots with results
 */

import Link from 'next/link';
import { useLabsBallots, useLabsActiveBallot, useCastLabsVote, useLabsHasVoted } from '@/lib/hooks/useLabsData';
import { VoteBallotCard, VoteResultsChart } from '@/components/labs';

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
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading voting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Partner Voting</h1>
          <p className="text-xs text-gray-500 mt-0.5">Weekly research priority ballots</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Active Ballot */}
        {activeBallot ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">Active Ballot</h2>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">No active ballot this week.</p>
          </div>
        )}

        {/* Past Ballots */}
        {closedBallots.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">Past Ballots</h2>
            <div className="space-y-3">
              {closedBallots.map((ballot) => (
                <div key={ballot.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Week {ballot.id}</h3>
                      <p className="text-xs text-gray-500">{ballot.weekStart} — {ballot.weekEnd}</p>
                    </div>
                    <span className="text-xs text-gray-400">{ballot.totalVotes} votes</span>
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
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No ballots yet.</p>
            <Link href="/labs/seed" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
              Seed data
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
