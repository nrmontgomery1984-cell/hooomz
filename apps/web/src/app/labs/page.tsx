'use client';

/**
 * Labs Dashboard — Mission Control
 *
 * Overview: stats, active tests, recent observations, flywheel, quick access.
 * Follows the same visual pattern as Standards / Production dashboards.
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
  Plus,
  ChevronRight,
  Beaker,
  Wrench,
  TestTube2,
  Tag,
  Zap,
  Vote,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { useLabsDashboardData, useLabsActiveTests, useLabsTokens } from '@/lib/hooks/useLabsData';
import { ExperimentCreateModal } from '@/components/labs';
import { SECTION_COLORS } from '@/lib/viewmode';

const COLOR = SECTION_COLORS.labs;

export default function LabsPage() {
  const router = useRouter();
  const dashboard = useLabsDashboardData();
  const { data: activeTests = [] } = useLabsActiveTests();
  const { data: tokens = [] } = useLabsTokens();
  const [showCreateExperiment, setShowCreateExperiment] = useState(false);

  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading Labs...</p>
        </div>
      </div>
    );
  }

  const { stats, recentObservations, contentReadyItems, activeExperimentsList } = dashboard;

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR }} />
                <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  Labs
                </h1>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Field data collection &amp; knowledge engine</p>
            </div>
            <button
              onClick={() => setShowCreateExperiment(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: COLOR, color: '#fff', fontSize: 12, fontWeight: 600,
              }}
            >
              <Plus size={14} />
              New
            </button>
          </div>
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {/* Stat Row */}
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }} className="grid-cols-2 md:grid-cols-4">
            <StatCard icon={<TestTube2 size={14} />} label="Active Tests" value={activeTests.length} color={COLOR} href="/labs/tests" />
            <StatCard icon={<Eye size={14} />} label="Observations" value={stats.fieldObservations} color={COLOR} href="/labs/observations" />
            <StatCard icon={<Zap size={14} />} label="Content Ready" value={stats.contentReady} color={COLOR} href="/labs/knowledge" />
            <StatCard icon={<Tag size={14} />} label="Tokens Issued" value={tokens.length} color={COLOR} href="/labs/tokens" />
          </div>

          {/* Two-column content grid */}
          <div style={{ marginTop: 20, display: 'grid', gap: 16 }} className="md:grid-cols-2">

            {/* Recent Observations */}
            <div>
              <SectionHeader title="Recent Observations" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {recentObservations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <ClipboardList size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No observations yet</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Captured as crew members work on projects</p>
                  </div>
                ) : (
                  recentObservations.slice(0, 5).map((obs, i) => (
                    <div
                      key={obs.id}
                      style={{
                        padding: '10px 12px', minHeight: 44,
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderBottom: i < Math.min(recentObservations.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {obs.notes ? obs.notes.slice(0, 60) : obs.knowledgeType.replace(/_/g, ' ')}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                          {obs.trade ?? obs.knowledgeType.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <Link
                  href="/labs/observations"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px', fontSize: 11, fontWeight: 600,
                    color: COLOR, textDecoration: 'none',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  View All Observations <ChevronRight size={10} />
                </Link>
              </div>
            </div>

            {/* Active Experiments */}
            <div>
              <SectionHeader title="Active Experiments" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {activeExperimentsList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <Beaker size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No active experiments</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Start one to track field learnings</p>
                  </div>
                ) : (
                  activeExperimentsList.slice(0, 5).map((exp, i) => (
                    <button
                      key={exp.id}
                      onClick={() => router.push(`/labs/experiments/${exp.id}`)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px', minHeight: 44,
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < Math.min(activeExperimentsList.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.title}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                          {exp.knowledgeType.replace(/_/g, ' ')} · {exp.status}
                        </p>
                      </div>
                      <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                    </button>
                  ))
                )}
                <Link
                  href="/labs/experiments"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px', fontSize: 11, fontWeight: 600,
                    color: COLOR, textDecoration: 'none',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  View All Experiments <ChevronRight size={10} />
                </Link>
              </div>
            </div>

          </div>

          {/* Content Ready for Knowledge */}
          {contentReadyItems.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionHeader title="Ready for Content" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {contentReadyItems.slice(0, 5).map((item, i) => (
                  <Link
                    key={item.id}
                    href={`/labs/knowledge/${item.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', minHeight: 44, textDecoration: 'none',
                      borderBottom: i < Math.min(contentReadyItems.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <BookOpen size={14} style={{ color: COLOR, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {item.observationCount} observations · {item.confidenceScore}% confidence
                      </p>
                    </div>
                    <ChevronRight size={11} style={{ color: 'var(--border-strong)', flexShrink: 0 }} />
                  </Link>
                ))}
                <Link
                  href="/labs/knowledge"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px 12px', fontSize: 11, fontWeight: 600,
                    color: COLOR, textDecoration: 'none',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  View Knowledge Base <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          )}

          {/* Revenue Flywheel */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="Revenue Flywheel" />
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Every test generates 5 revenue streams</p>
              </div>
              {[
                { label: 'YouTube Content', icon: '01' },
                { label: 'Affiliate Revenue', icon: '02' },
                { label: 'Cost Catalogue Data', icon: '03' },
                { label: 'Partner Referrals', icon: '04' },
                { label: 'DIY Kit Development', icon: '05' },
              ].map((feed, i, arr) => (
                <div
                  key={feed.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', minHeight: 40,
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: COLOR, flexShrink: 0, minWidth: 20 }}>
                    {feed.icon}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)' }}>{feed.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Grid */}
          <div style={{ marginTop: 16 }}>
            <SectionHeader title="Quick Access" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <QuickAccessCard href="/labs/observations" icon={ClipboardList} label="Observations" />
              <QuickAccessCard href="/labs/tests" icon={TestTube2} label="Tests" />
              <QuickAccessCard href="/labs/voting" icon={Vote} label="Voting" />
              <QuickAccessCard href="/labs/tokens" icon={Tag} label="Tokens" />
              <QuickAccessCard href="/labs/catalogs" icon={Package} label="Catalogs" />
              <QuickAccessCard href="/labs/knowledge" icon={Lightbulb} label="Knowledge" />
              <QuickAccessCard href="/labs/experiments" icon={FlaskConical} label="Experiments" />
              <QuickAccessCard href="/labs/tool-research" icon={Wrench} label="Tool Research" />
            </div>
          </div>

        </div>

        {/* Create Experiment Modal */}
        <ExperimentCreateModal
          isOpen={showCreateExperiment}
          onClose={() => setShowCreateExperiment(false)}
        />

      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {title}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color, href }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--charcoal)' }}>
          {value}
        </span>
      </div>
    </Link>
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
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderRadius: 'var(--radius)', padding: '10px 12px', minHeight: 44,
        background: 'var(--surface)', border: '1px solid var(--border)',
        textDecoration: 'none', boxShadow: 'var(--shadow-card)',
      }}
    >
      <Icon size={16} style={{ color: COLOR }} strokeWidth={1.5} />
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)' }}>{label}</span>
    </Link>
  );
}
