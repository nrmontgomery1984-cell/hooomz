'use client';

/**
 * Labs Test Detail Page — PDCA sections, status transitions, linked tokens
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLabsTest, useAdvanceLabsTestStatus } from '@/lib/hooks/useLabsData';
import type { LabsTestStatus } from '@hooomz/shared-contracts';
import { SECTION_COLORS } from '@/lib/viewmode';
const LABS_COLOR = SECTION_COLORS.labs;

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  proposed: { background: 'var(--surface-3)', color: 'var(--mid)' },
  voting: { background: 'var(--purple-dim, #ede9fe)', color: 'var(--purple, #7c3aed)' },
  planned: { background: 'var(--blue-bg)', color: 'var(--blue)' },
  'in-progress': { background: 'var(--amber-dim, #fef3c7)', color: 'var(--amber, #b45309)' },
  complete: { background: 'var(--green-dim, #d1fae5)', color: 'var(--green, #065f46)' },
  published: { background: LABS_COLOR + '20', color: LABS_COLOR },
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
      <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--mid)' }}>Test not found: {testId}</p>
          <Link href="/labs/tests" className="text-sm hover:underline mt-2 inline-block" style={{ color: LABS_COLOR }}>
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(test.status);
  const statusStyle = STATUS_STYLES[test.status] || { background: 'var(--surface-3)', color: 'var(--mid)' };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
            <Link href="/labs/tests" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Tests</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>{test.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{test.id}</span>
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full" style={statusStyle}>
                  {test.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Status progression */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-1 mb-3">
            {STATUS_FLOW.map((s, i) => {
              const isCurrent = s === test.status;
              const isPast = STATUS_FLOW.indexOf(test.status) > i;
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className="h-1.5 rounded-full flex-1"
                    style={{ background: isCurrent ? LABS_COLOR : isPast ? `${LABS_COLOR}66` : 'var(--surface-2)' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
            <span>Proposed</span>
            <span>Published</span>
          </div>
          {nextStatus && (
            <button
              onClick={() => advanceStatus.mutate({ id: test.id, status: nextStatus })}
              disabled={advanceStatus.isPending}
              className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 w-full"
              style={{ background: 'var(--accent)', minHeight: '44px' }}
            >
              {advanceStatus.isPending ? 'Advancing...' : `Advance to ${nextStatus}`}
            </button>
          )}
        </div>

        {/* Description + metadata */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Details</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--charcoal)' }}>{test.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--mid)' }}>Category</span>
              <span className="font-medium capitalize" style={{ color: 'var(--charcoal)' }}>{test.category}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--mid)' }}>Priority</span>
              <span className="font-medium" style={{ color: 'var(--charcoal)' }}>{test.priority}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--mid)' }}>Votes</span>
              <span className="font-medium" style={{ color: 'var(--charcoal)' }}>{test.voteCount}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--mid)' }}>Divisions</span>
              <span className="font-medium" style={{ color: 'var(--charcoal)' }}>{test.divisionsImpacted.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Linked tokens */}
        {test.tokenIds.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Linked Tokens</h2>
            <div className="flex flex-wrap gap-2">
              {test.tokenIds.map((tokenId) => (
                <Link
                  key={tokenId}
                  href={`/labs/tokens/${tokenId}`}
                  className="inline-flex px-2 py-1 text-xs font-mono rounded transition-colors"
                  style={{ background: 'var(--surface-2)', color: LABS_COLOR }}
                >
                  {tokenId}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PDCA: Plan */}
        {test.plan && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Plan</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Question</span>
                <p style={{ color: 'var(--charcoal)' }}>{test.plan.question}</p>
              </div>
              <div>
                <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Variables</span>
                <div className="flex flex-wrap gap-1">
                  {test.plan.variables.map((v) => (
                    <span key={v} className="px-1.5 py-0.5 text-xs rounded" style={{ background: 'var(--surface-2)', color: 'var(--mid)' }}>{v}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Protocol</span>
                <p style={{ color: 'var(--charcoal)' }}>{test.plan.protocol}</p>
              </div>
              <div>
                <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Success Criteria</span>
                <p style={{ color: 'var(--charcoal)' }}>{test.plan.successCriteria}</p>
              </div>
            </div>
          </div>
        )}

        {/* PDCA: Do */}
        {test.doData && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Do</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--mid)' }}>Start Date</span>
                <span style={{ color: 'var(--charcoal)' }}>{test.doData.startDate}</span>
              </div>
              {test.doData.endDate && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--mid)' }}>End Date</span>
                  <span style={{ color: 'var(--charcoal)' }}>{test.doData.endDate}</span>
                </div>
              )}
              {test.doData.notes && (
                <div>
                  <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Notes</span>
                  <p style={{ color: 'var(--charcoal)' }}>{test.doData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDCA: Check */}
        {test.checkResults && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Check (Results)</h2>
            <div className="space-y-2 text-sm">
              <p style={{ color: 'var(--charcoal)' }}>{test.checkResults.summary}</p>
              {test.checkResults.winner && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--mid)' }}>Winner</span>
                  <span className="font-semibold" style={{ color: LABS_COLOR }}>{test.checkResults.winner}</span>
                </div>
              )}
              {test.checkResults.data && (
                <div>
                  <span className="block text-xs mb-0.5" style={{ color: 'var(--mid)' }}>Data</span>
                  <p className="text-xs" style={{ color: 'var(--mid)' }}>{test.checkResults.data}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDCA: Act */}
        {test.actChanges && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--charcoal)' }}>Act (Changes)</h2>
            {test.actChanges.sopUpdates && test.actChanges.sopUpdates.length > 0 && (
              <div className="mb-3">
                <span className="text-xs block mb-1" style={{ color: 'var(--mid)' }}>SOP Updates</span>
                <div className="space-y-1">
                  {test.actChanges.sopUpdates.map((u, i) => (
                    <div key={i} className="text-xs rounded px-2 py-1" style={{ background: 'var(--surface-2)', color: 'var(--charcoal)' }}>
                      <span className="font-mono" style={{ color: 'var(--mid)' }}>{u.sopId}</span>: {u.oldValue} → <span className="font-semibold" style={{ color: LABS_COLOR }}>{u.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {test.actChanges.contentPublished && test.actChanges.contentPublished.length > 0 && (
              <div>
                <span className="text-xs block mb-1" style={{ color: 'var(--mid)' }}>Content Published</span>
                <div className="space-y-1">
                  {test.actChanges.contentPublished.map((c, i) => (
                    <div key={i} className="text-xs rounded px-2 py-1" style={{ background: 'var(--surface-2)', color: 'var(--charcoal)' }}>
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
