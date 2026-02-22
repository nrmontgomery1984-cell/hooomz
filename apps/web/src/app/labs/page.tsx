'use client';

/**
 * Labs Dashboard — Mission Control
 *
 * Overview: stats, active experiments, recent field data,
 * knowledge ready for content, flywheel, quick access grid.
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
  TestTube2,
  Tag,
  Zap,
} from 'lucide-react';
import { useLabsDashboardData, useLabsActiveTests, useLabsTests, useLabsTokens } from '@/lib/hooks/useLabsData';
import { ObservationCard, ExperimentCard, ExperimentCreateModal } from '@/components/labs';
import { ToolResearchWidget } from '@/components/labs/tool-research';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ObservationDetailContent } from '@/components/labs/ObservationDetailContent';
import { SECTION_COLORS } from '@/lib/viewmode';
import type { FieldObservation } from '@hooomz/shared-contracts';

const LABS_COLOR = SECTION_COLORS.labs;

export default function LabsPage() {
  const router = useRouter();
  const dashboard = useLabsDashboardData();
  const { data: activeTests = [] } = useLabsActiveTests();
  const { data: allTests = [] } = useLabsTests();
  const { data: tokens = [] } = useLabsTokens();
  const [showCreateExperiment, setShowCreateExperiment] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<FieldObservation | null>(null);

  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--border)', borderTopColor: LABS_COLOR }}
          />
          <p style={{ color: 'var(--text-3)' }}>Loading Labs...</p>
        </div>
      </div>
    );
  }

  const { stats, recentObservations, contentReadyItems, activeExperimentsList } = dashboard;
  const publishedTests = allTests.filter((t) => t.status === 'published').length;

  return (
    <PageErrorBoundary>
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: LABS_COLOR }} />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-cond)', letterSpacing: '0.02em' }}>
              Labs Dashboard
            </h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            Field data collection &amp; knowledge engine
          </p>
        </div>
      </div>

      <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

        {/* Stat Row — 4 cards */}
        <div
          style={{ marginTop: 16, display: 'grid', gap: 10 }}
          className="grid-cols-2 md:grid-cols-4"
        >
          <StatCard icon={<TestTube2 size={14} />} label="Active Tests" value={activeTests.length} color={LABS_COLOR} />
          <StatCard icon={<FileCheck size={14} />} label="Published" value={publishedTests} color={LABS_COLOR} />
          <StatCard icon={<Zap size={14} />} label="Revenue Streams" value={5} color={LABS_COLOR} />
          <StatCard icon={<Tag size={14} />} label="Tokens Issued" value={tokens.length} color={LABS_COLOR} />
        </div>

        {/* Overview Stats Strip */}
        <div className="mt-4 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
            <SmallPill label="Active Expts" value={stats.activeExperiments} />
            <SmallPill label="Field Obs." value={stats.fieldObservations} />
            <SmallPill label="Knowledge" value={stats.knowledgeItems} />
            <SmallPill label="Content Ready" value={stats.contentReady} accent />
            <SmallPill label="Products Rated" value={stats.productsRated} />
          </div>
        </div>

        {/* Active Experiments */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Active Experiments
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateExperiment(true)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 min-h-[32px] rounded-lg"
                style={{ background: LABS_COLOR, color: '#FFFFFF' }}
              >
                <Plus size={14} />
                New
              </button>
              {activeExperimentsList.length > 0 && (
                <Link
                  href="/labs/experiments"
                  className="flex items-center gap-0.5 text-xs font-medium min-h-[32px]"
                  style={{ color: LABS_COLOR }}
                >
                  View All <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>

          {activeExperimentsList.length === 0 ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <Beaker size={24} style={{ color: 'var(--text-3)' }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
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

        {/* Recent Field Data */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Recent Field Data
            </h2>
            {recentObservations.length > 0 && (
              <Link
                href="/labs/observations"
                className="flex items-center gap-0.5 text-xs font-medium min-h-[32px]"
                style={{ color: LABS_COLOR }}
              >
                View All <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {recentObservations.length === 0 ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <ClipboardList size={24} style={{ color: 'var(--text-3)' }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
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

        {/* Knowledge Ready for Content */}
        {contentReadyItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
              Ready for Content
            </h2>
            <div className="space-y-2">
              {contentReadyItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/labs/knowledge/${item.id}`}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${LABS_COLOR}15` }}
                  >
                    <BookOpen size={16} style={{ color: LABS_COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {item.title}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      {item.observationCount} observations · {item.confidenceScore}% confidence
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-3)' }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Flywheel — Revenue Feeds */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Revenue Flywheel
          </h2>
          <div
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 16,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
              Every test generates 5 revenue streams:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'YouTube Content', icon: '1' },
                { label: 'Affiliate Revenue', icon: '2' },
                { label: 'Cost Catalogue Data', icon: '3' },
                { label: 'Partner Referrals', icon: '4' },
                { label: 'DIY Kit Development', icon: '5' },
              ].map((feed) => (
                <div key={feed.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `${LABS_COLOR}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: LABS_COLOR,
                    flexShrink: 0,
                  }}>
                    {feed.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{feed.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tool Research */}
        <div className="mt-6">
          <ToolResearchWidget />
        </div>

        {/* Quick Access Grid */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
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

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-1)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

function SmallPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="rounded-xl px-3 py-2 flex-shrink-0"
      style={{
        background: accent ? `${LABS_COLOR}10` : 'var(--surface-1)',
        border: accent ? `1px solid ${LABS_COLOR}30` : '1px solid var(--border)',
        minWidth: '90px',
      }}
    >
      <p className="text-lg font-bold" style={{ color: accent ? LABS_COLOR : 'var(--text)' }}>
        {value}
      </p>
      <p className="text-[10px] font-medium" style={{ color: accent ? LABS_COLOR : 'var(--text-3)' }}>
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
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
    >
      <Icon size={18} style={{ color: LABS_COLOR }} strokeWidth={1.5} />
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
    </Link>
  );
}
