'use client';

/**
 * Labs Token Detail Page — View token details, linked tests, edit recommendation
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLabsToken, useLabsTestsByToken, useLabsMaterialChangesByToken } from '@/lib/hooks/useLabsData';
import { TOKEN_STATUS_COLORS } from '@/lib/constants/scriptPhases';
import { SECTION_COLORS } from '@/lib/viewmode';
const LABS_COLOR = SECTION_COLORS.labs;

export default function TokenDetailPage() {
  const params = useParams();
  const tokenId = params.id as string;

  const { data: token, isLoading: tokenLoading } = useLabsToken(tokenId);
  const { data: tests = [], isLoading: testsLoading } = useLabsTestsByToken(tokenId);
  const { data: changes = [] } = useLabsMaterialChangesByToken(tokenId);

  if (tokenLoading || testsLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading token...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Token not found: {tokenId}</p>
          <Link href="/labs/tokens" className="text-sm hover:underline mt-2 inline-block" style={{ color: LABS_COLOR }}>
            Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = TOKEN_STATUS_COLORS[token.status] || '#888';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
            <Link href="/labs/tokens" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Tokens</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{token.displayName}</h1>
          </div>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-2)' }}>{'{{LAB:' + token.id + '}}'}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Token Details */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Token Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Status</span>
              <span className="font-medium capitalize" style={{ color: 'var(--text)' }}>{token.status}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Category</span>
              <span className="font-medium capitalize" style={{ color: 'var(--text)' }}>{token.category}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Context</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{token.context}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Current Recommendation</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{token.currentRecommendation}</span>
            </div>
            {token.recommendationDetail && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="block mb-1" style={{ color: 'var(--text-2)' }}>Details</span>
                <p style={{ color: 'var(--text)' }}>{token.recommendationDetail}</p>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-2)' }}>Divisions</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{token.division.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* SOP References */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            SOP References ({token.sopReferences.length})
          </h2>
          {token.sopReferences.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No SOPs reference this token.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {token.sopReferences.map((sopCode) => (
                <span key={sopCode} className="inline-flex px-2 py-1 text-xs font-mono rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  {sopCode}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Linked Tests */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Linked Tests ({tests.length})
          </h2>
          {tests.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No tests linked to this token.</p>
          ) : (
            <div className="space-y-2">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  href={`/labs/tests/${test.id}`}
                  className="block px-3 py-2 rounded-lg transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{test.title}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{test.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Previous Recommendations (change history) */}
        {(token.previousRecommendations.length > 0 || changes.length > 0) && (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Change History</h2>
            <div className="space-y-2">
              {token.previousRecommendations.map((prev, i) => (
                <div key={i} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface-2)' }}>
                  <div className="flex items-center justify-between">
                    <span className="line-through" style={{ color: 'var(--text)' }}>{prev.product}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {new Date(prev.replacedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{prev.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
