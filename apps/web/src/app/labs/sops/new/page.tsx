'use client';

/**
 * Create SOP Page — form to create a new SOP
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateSop } from '@/lib/hooks/useLabsData';
import type { ObservationMode, CertificationLevel, SopStatus } from '@hooomz/shared-contracts';

const TRADE_FAMILIES = ['Flooring', 'Paint', 'Finish Carpentry', 'Drywall', 'Tile', 'General'];
const OBSERVATION_MODES: { value: ObservationMode; label: string; desc: string }[] = [
  { value: 'minimal', label: 'Minimal', desc: 'Confirm/deviate only' },
  { value: 'standard', label: 'Standard', desc: '+ optional notes & photo' },
  { value: 'detailed', label: 'Detailed', desc: '+ required notes, photo & condition' },
];
const CERT_LEVELS: { value: CertificationLevel; label: string }[] = [
  { value: 'apprentice', label: 'Apprentice' },
  { value: 'journeyman', label: 'Journeyman' },
  { value: 'master', label: 'Master' },
];

export default function CreateSOPPage() {
  const router = useRouter();
  const createSop = useCreateSop();

  const [sopCode, setSopCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tradeFamily, setTradeFamily] = useState(TRADE_FAMILIES[0]);
  const [mode, setMode] = useState<ObservationMode>('standard');
  const [certLevel, setCertLevel] = useState<CertificationLevel>('journeyman');
  const [status, setStatus] = useState<SopStatus>('draft');

  const canSubmit = sopCode.trim() && title.trim() && !createSop.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const sop = await createSop.mutateAsync({
      sopCode: sopCode.trim(),
      title: title.trim(),
      description: description.trim() || null,
      tradeFamily,
      effectiveDate: new Date().toISOString().split('T')[0],
      defaultObservationMode: mode,
      certificationLevel: certLevel,
      requiredSupervisedCompletions: 3,
      reviewQuestionCount: 10,
      reviewPassThreshold: 80,
      versionNotes: null,
      fieldGuideRef: null,
      status,
      createdBy: null,
    });

    router.push(`/labs/sops/${sop.id}`);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <Link href="/labs/sops" className="text-sm text-teal-700 hover:underline">SOPs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>New SOP</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SOP Code */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-1">SOP Code *</label>
            <input
              type="text"
              value={sopCode}
              onChange={(e) => setSopCode(e.target.value.toUpperCase())}
              placeholder="HI-SOP-FL-001"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              style={{ minHeight: '44px' }}
            />
            <p className="text-xs text-gray-400 mt-1">Format: HI-SOP-[TRADE]-[NUMBER]</p>
          </div>

          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="LVP Installation — Standard Room"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this procedure..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Trade Family */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-1">Trade Family</label>
            <select
              value={tradeFamily}
              onChange={(e) => setTradeFamily(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              style={{ minHeight: '44px' }}
            >
              {TRADE_FAMILIES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Observation Mode */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-2">Observation Mode</label>
            <div className="space-y-2">
              {OBSERVATION_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    mode === m.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <span className="text-sm font-medium text-gray-900">{m.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Certification Level */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-2">Certification Level</label>
            <div className="flex gap-2">
              {CERT_LEVELS.map((cl) => (
                <button
                  key={cl.value}
                  type="button"
                  onClick={() => setCertLevel(cl.value)}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                    certLevel === cl.value
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  {cl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-2">Initial Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  status === 'draft'
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={{ minHeight: '44px' }}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  status === 'active'
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                style={{ minHeight: '44px' }}
              >
                Active
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#0F766E', minHeight: '48px' }}
          >
            {createSop.isPending ? 'Creating...' : 'Create SOP'}
          </button>

          {createSop.isError && (
            <p className="text-sm text-red-600 text-center">
              Failed to create SOP. Please try again.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
