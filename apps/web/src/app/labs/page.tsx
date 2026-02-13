'use client';

/**
 * Labs Dashboard — Mission Control
 *
 * Overview: stats, active experiments, recent field data,
 * knowledge ready for content, quick access grid.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import {
  FlaskConical,
  ClipboardList,
  Package,
  BookOpen,
  FileCheck,
  Plus,
  ArrowRight,
  Beaker,
  Wrench,
  Database,
} from 'lucide-react';
import { useLabsDashboardData } from '@/lib/hooks/useLabsData';
import { ObservationCard, ExperimentCard, ExperimentCreateModal } from '@/components/labs';
import { ToolResearchWidget } from '@/components/labs/tool-research';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ObservationDetailContent } from '@/components/labs/ObservationDetailContent';
import type { FieldObservation } from '@hooomz/shared-contracts';

export default function LabsPage() {
  const router = useRouter();
  const dashboard = useLabsDashboardData();
  const [showCreateExperiment, setShowCreateExperiment] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<FieldObservation | null>(null);

  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p style={{ color: '#6B7280' }}>Loading Labs...</p>
        </div>
      </div>
    );
  }

  const { stats, recentObservations, contentReadyItems, activeExperimentsList } = dashboard;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} style={{ color: '#0F766E' }} />
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Hooomz Labs</h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Field data collection &amp; knowledge engine
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* ================================================================
            Overview Stats Strip
            ================================================================ */}
        <div className="mt-4 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            <StatPill label="Active Expts" value={stats.activeExperiments} />
            <StatPill label="Field Obs." value={stats.fieldObservations} />
            <StatPill label="Knowledge" value={stats.knowledgeItems} />
            <StatPill label="Content Ready" value={stats.contentReady} accent />
            <StatPill label="Products Rated" value={stats.productsRated} />
          </div>
        </div>

        {/* ================================================================
            Active Experiments
            ================================================================ */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>
              Active Experiments
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateExperiment(true)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 min-h-[32px] rounded-lg"
                style={{ background: '#0F766E', color: '#FFFFFF' }}
              >
                <Plus size={14} />
                New
              </button>
              {activeExperimentsList.length > 0 && (
                <Link
                  href="/labs/experiments"
                  className="flex items-center gap-0.5 text-xs font-medium min-h-[32px]"
                  style={{ color: '#0F766E' }}
                >
                  View All <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>

          {activeExperimentsList.length === 0 ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
            >
              <Beaker size={24} style={{ color: '#D1D5DB' }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                No active experiments. Start one to track field learnings.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeExperimentsList.slice(0, 3).map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  experiment={exp}
                  onClick={() => router.push(`/labs/experiments/${exp.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================================================================
            Recent Field Data
            ================================================================ */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>
              Recent Field Data
            </h2>
            {recentObservations.length > 0 && (
              <Link
                href="/labs/observations"
                className="flex items-center gap-0.5 text-xs font-medium min-h-[32px]"
                style={{ color: '#0F766E' }}
              >
                View All <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {recentObservations.length === 0 ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
            >
              <ClipboardList size={24} style={{ color: '#D1D5DB' }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                No observations yet. Complete tasks to start capturing field data.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentObservations.slice(0, 5).map((obs) => (
                <ObservationCard
                  key={obs.id}
                  observation={obs}
                  onClick={() => setSelectedObservation(obs)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================================================================
            Knowledge Ready for Content
            ================================================================ */}
        {contentReadyItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>
              Ready for Content
            </h2>
            <div className="space-y-2">
              {contentReadyItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/labs/knowledge/${item.id}`}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F0FDFA' }}
                  >
                    <BookOpen size={16} style={{ color: '#0F766E' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>
                      {item.title}
                    </p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                      {item.observationCount} observations · {item.confidenceScore}% confidence
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: '#D1D5DB' }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            Tool Research Summary
            ================================================================ */}
        <div className="mt-6">
          <ToolResearchWidget />
        </div>

        {/* ================================================================
            Quick Access Grid
            ================================================================ */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>
            Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickAccessCard href="/labs/sops" icon={FileCheck} label="SOPs" />
            <QuickAccessCard href="/labs/knowledge" icon={BookOpen} label="Knowledge" />
            <QuickAccessCard href="/labs/catalogs" icon={Package} label="Catalogs" />
            <QuickAccessCard href="/labs/observations" icon={ClipboardList} label="Observations" />
            <QuickAccessCard href="/labs/experiments" icon={FlaskConical} label="Experiments" />
            <QuickAccessCard href="/labs/tool-research" icon={Wrench} label="Tool Research" />
            <QuickAccessCard href="/labs/seed" icon={Database} label="Seed Data" />
          </div>
        </div>
      </div>

      {/* Create Experiment Modal */}
      <ExperimentCreateModal
        isOpen={showCreateExperiment}
        onClose={() => setShowCreateExperiment(false)}
      />

      {/* Observation Detail Sheet */}
      <BottomSheet
        isOpen={!!selectedObservation}
        onClose={() => setSelectedObservation(null)}
        title="Observation Detail"
      >
        {selectedObservation && (
          <ObservationDetailContent observation={selectedObservation} />
        )}
      </BottomSheet>
    </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2 flex-shrink-0"
      style={{
        background: accent ? '#F0FDFA' : '#FFFFFF',
        border: accent ? '1px solid #CCFBF1' : '1px solid #E5E7EB',
        minWidth: '90px',
      }}
    >
      <p className="text-lg font-bold" style={{ color: accent ? '#0F766E' : '#111827' }}>
        {value}
      </p>
      <p className="text-[10px] font-medium" style={{ color: accent ? '#0F766E' : '#9CA3AF' }}>
        {label}
      </p>
    </div>
  );
}

function QuickAccessCard({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ size?: string | number; style?: React.CSSProperties; strokeWidth?: string | number }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl p-3 min-h-[48px]"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      <Icon size={18} style={{ color: '#0F766E' }} strokeWidth={1.5} />
      <span className="text-sm font-medium" style={{ color: '#111827' }}>{label}</span>
    </Link>
  );
}
