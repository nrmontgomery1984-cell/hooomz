'use client';

/**
 * Labs Token Detail Page — View token details, linked tests, edit recommendation
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLabsToken, useLabsTestsByToken, useLabsMaterialChangesByToken } from '@/lib/hooks/useLabsData';
import { TOKEN_STATUS_COLORS } from '@/lib/constants/scriptPhases';

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
          <p className="text-sm text-gray-400">Loading token...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <p className="text-sm text-gray-500">Token not found: {tokenId}</p>
          <Link href="/labs/tokens" className="text-sm text-teal-700 hover:underline mt-2 inline-block">
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
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/tokens" className="text-sm text-teal-700 hover:underline">Tokens</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>{token.displayName}</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{'{{LAB:' + token.id + '}}'}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Token Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Token Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-gray-900 capitalize">{token.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900 capitalize">{token.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Context</span>
              <span className="font-medium text-gray-900">{token.context}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Recommendation</span>
              <span className="font-semibold text-gray-900">{token.currentRecommendation}</span>
            </div>
            {token.recommendationDetail && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 block mb-1">Details</span>
                <p className="text-gray-700">{token.recommendationDetail}</p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Divisions</span>
              <span className="font-medium text-gray-900">{token.division.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* SOP References */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            SOP References ({token.sopReferences.length})
          </h2>
          {token.sopReferences.length === 0 ? (
            <p className="text-sm text-gray-400">No SOPs reference this token.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {token.sopReferences.map((sopCode) => (
                <span key={sopCode} className="inline-flex px-2 py-1 text-xs font-mono rounded bg-gray-100 text-gray-700">
                  {sopCode}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Linked Tests */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Linked Tests ({tests.length})
          </h2>
          {tests.length === 0 ? (
            <p className="text-sm text-gray-400">No tests linked to this token.</p>
          ) : (
            <div className="space-y-2">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  href={`/labs/tests/${test.id}`}
                  className="block px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{test.title}</span>
                    <span className="text-xs text-gray-400">{test.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Previous Recommendations (change history) */}
        {(token.previousRecommendations.length > 0 || changes.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Change History</h2>
            <div className="space-y-2">
              {token.previousRecommendations.map((prev, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-gray-50 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 line-through">{prev.product}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(prev.replacedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{prev.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
