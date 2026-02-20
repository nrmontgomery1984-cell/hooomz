'use client';

/**
 * Labs Test Detail Page — PDCA sections, status transitions, linked tokens
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLabsTest, useAdvanceLabsTestStatus } from '@/lib/hooks/useLabsData';
import type { LabsTestStatus } from '@hooomz/shared-contracts';

const STATUS_STYLES: Record<string, string> = {
  proposed: 'bg-gray-100 text-gray-700',
  voting: 'bg-purple-100 text-purple-700',
  planned: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  complete: 'bg-green-100 text-green-700',
  published: 'bg-teal-100 text-teal-700',
};

const STATUS_FLOW: LabsTestStatus[] = ['proposed', 'voting', 'planned', 'in-progress', 'complete', 'published'];

function getNextStatus(current: LabsTestStatus): LabsTestStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export default function TestDetailPage() {
  const params = useParams();
  const testId = params.id as string;

  const { data: test, isLoading } = useLabsTest(testId);
  const advanceStatus = useAdvanceLabsTestStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">Test not found: {testId}</p>
          <Link href="/labs/tests" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(test.status);
  const statusStyle = STATUS_STYLES[test.status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/tests" className="text-sm text-teal-700 hover:underline">Tests</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>{test.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gray-400">{test.id}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusStyle}`}>
                  {test.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Status progression */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-1 mb-3">
            {STATUS_FLOW.map((s, i) => {
              const isCurrent = s === test.status;
              const isPast = STATUS_FLOW.indexOf(test.status) > i;
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className={`h-1.5 rounded-full flex-1 ${isCurrent ? 'bg-teal-600' : isPast ? 'bg-teal-300' : 'bg-gray-200'}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Proposed</span>
            <span>Published</span>
          </div>
          {nextStatus && (
            <button
              onClick={() => advanceStatus.mutate({ id: test.id, status: nextStatus })}
              disabled={advanceStatus.isPending}
              className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 w-full"
              style={{ background: '#0F766E', minHeight: '44px' }}
            >
              {advanceStatus.isPending ? 'Advancing...' : `Advance to ${nextStatus}`}
            </button>
          )}
        </div>

        {/* Description + metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Details</h2>
          <p className="text-sm text-gray-700 mb-3">{test.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900 capitalize">{test.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Priority</span>
              <span className="font-medium text-gray-900">{test.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Votes</span>
              <span className="font-medium text-gray-900">{test.voteCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Divisions</span>
              <span className="font-medium text-gray-900">{test.divisionsImpacted.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Linked tokens */}
        {test.tokenIds.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Linked Tokens</h2>
            <div className="flex flex-wrap gap-2">
              {test.tokenIds.map((tokenId) => (
                <Link
                  key={tokenId}
                  href={`/labs/tokens/${tokenId}`}
                  className="inline-flex px-2 py-1 text-xs font-mono rounded bg-gray-100 text-teal-700 hover:bg-gray-200 transition-colors"
                >
                  {tokenId}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PDCA: Plan */}
        {test.plan && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Plan</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 block text-xs mb-0.5">Question</span>
                <p className="text-gray-800">{test.plan.question}</p>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-0.5">Variables</span>
                <div className="flex flex-wrap gap-1">
                  {test.plan.variables.map((v) => (
                    <span key={v} className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-0.5">Protocol</span>
                <p className="text-gray-700">{test.plan.protocol}</p>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-0.5">Success Criteria</span>
                <p className="text-gray-700">{test.plan.successCriteria}</p>
              </div>
            </div>
          </div>
        )}

        {/* PDCA: Do */}
        {test.doData && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Do</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Start Date</span>
                <span className="text-gray-900">{test.doData.startDate}</span>
              </div>
              {test.doData.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span className="text-gray-900">{test.doData.endDate}</span>
                </div>
              )}
              {test.doData.notes && (
                <div>
                  <span className="text-gray-500 block text-xs mb-0.5">Notes</span>
                  <p className="text-gray-700">{test.doData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDCA: Check */}
        {test.checkResults && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Check (Results)</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{test.checkResults.summary}</p>
              {test.checkResults.winner && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Winner</span>
                  <span className="font-semibold text-teal-700">{test.checkResults.winner}</span>
                </div>
              )}
              {test.checkResults.data && (
                <div>
                  <span className="text-gray-500 block text-xs mb-0.5">Data</span>
                  <p className="text-gray-600 text-xs">{test.checkResults.data}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDCA: Act */}
        {test.actChanges && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Act (Changes)</h2>
            {test.actChanges.sopUpdates && test.actChanges.sopUpdates.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 block mb-1">SOP Updates</span>
                <div className="space-y-1">
                  {test.actChanges.sopUpdates.map((u, i) => (
                    <div key={i} className="text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="font-mono text-gray-500">{u.sopId}</span>: {u.oldValue} → <span className="font-semibold text-teal-700">{u.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {test.actChanges.contentPublished && test.actChanges.contentPublished.length > 0 && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Content Published</span>
                <div className="space-y-1">
                  {test.actChanges.contentPublished.map((c, i) => (
                    <div key={i} className="text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="capitalize">{c.type}</span> — {c.publishDate}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
