'use client';

/**
 * Main Dashboard — Operator/Owner view
 *
 * First screen after auth. Full visibility across active divisions.
 * Read-only summary — all numbers link through to relevant pages.
 *
 * Four questions at a glance:
 * 1. What is happening right now? (active jobs, today's schedule)
 * 2. Where is the money? (revenue, margin, outstanding)
 * 3. What needs attention? (flags, blocked stages, overdue)
 * 4. What does the pipeline look like? (leads → estimates → active → complete)
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useAllInvoices } from '@/lib/hooks/useInvoices';
import { useLocalRecentActivity } from '@/lib/hooks/useLocalData';
import { useTeamWeekSchedule } from '@/lib/hooks/useSchedule';
import { useLeadPipeline } from '@/lib/hooks/useLeadData';
import { useDarkMode } from '@/lib/hooks/useDarkMode';
import type { InvoiceRecord } from '@hooomz/shared-contracts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Nathan';
  if (h < 18) return 'Good afternoon, Nathan';
  return 'Good evening, Nathan';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatRelativeTime(ts: unknown): string {
  if (!ts) return '';
  const d = new Date(String(ts));
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString()}`;
}

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/** Map jobStage to a numeric position (0-11) for the progress bar */
const STAGE_ORDER: Record<string, number> = {
  lead: 0, estimate: 1, consultation: 2, quote: 3, contracted: 4,
  shield: 5, clear: 6, ready: 7, install: 8, punch: 9, turnover: 10, complete: 11,
};

function stageBadgeColor(stage?: string): string {
  if (!stage) return 'var(--text-3)';
  const pos = STAGE_ORDER[stage] ?? 0;
  if (pos <= 0) return 'var(--text-3)';
  if (pos <= 4) return 'var(--blue)';
  if (pos <= 8) return 'var(--clay)';
  if (pos === 9) return 'var(--amber)';
  return 'var(--green)';
}

function stageLabel(stage?: string): string {
  if (!stage) return '';
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function getEventIcon(event: Record<string, unknown>): { icon: string; color: string } {
  const type = String(event.event_type || event.eventType || '');
  if (type.includes('created') || type.includes('project')) return { icon: '◈', color: 'var(--clay)' };
  if (type.includes('stage') || type.includes('advance')) return { icon: '›', color: 'var(--green)' };
  if (type.includes('estimate') || type.includes('quote')) return { icon: '⊞', color: 'var(--blue)' };
  if (type.includes('flag') && type.includes('resolve')) return { icon: '✓', color: 'var(--green)' };
  if (type.includes('flag') || type.includes('block')) return { icon: '⚑', color: 'var(--amber)' };
  if (type.includes('invoice')) return { icon: '$', color: 'var(--clay)' };
  if (type.includes('payment')) return { icon: '✓', color: 'var(--green)' };
  if (type.includes('photo')) return { icon: '◎', color: 'var(--text-3)' };
  if (type.includes('note') || type.includes('comment')) return { icon: '—', color: 'var(--text-3)' };
  return { icon: '·', color: 'var(--text-3)' };
}

function formatEventLabel(event: Record<string, unknown>): string {
  const type = String(event.event_type || event.eventType || '');
  const desc = String(event.description || event.summary || '');
  if (desc && desc !== 'undefined') return desc;
  return type.replace(/[._]/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// StatCard component
// ---------------------------------------------------------------------------

function StatCard({
  label, value, sub, color, href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div
      style={{
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 6, padding: '16px 18px',
        cursor: href ? 'pointer' : 'default',
        transition: 'transform 150ms ease', flex: 1, minWidth: 0,
      }}
      onMouseEnter={e => { if (href) (e.currentTarget).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', marginBottom: 3 }}>{sub}</div>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {label}
      </div>
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0, display: 'flex' }}>{inner}</Link>;
  return inner;
}

// ---------------------------------------------------------------------------
// Theme Toggle
// ---------------------------------------------------------------------------

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 15,
          borderRadius: 99,
          background: isDark ? 'var(--border)' : 'var(--clay)',
          position: 'relative',
          transition: 'background 200ms',
        }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: isDark ? 2 : 15,
            transition: 'left 200ms',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          color: 'var(--text-3)',
        }}
      >
        {isDark ? 'DARK' : 'LIGHT'}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  // Theme
  const { isDark, toggle: toggleTheme } = useDarkMode();

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Data
  const dashboard = useDashboardData();
  const { data: allInvoices = [] } = useAllInvoices();
  const { data: activityData } = useLocalRecentActivity(8);
  useLeadPipeline(); // warm the cache for pipeline navigation
  const weekStart = useMemo(() => getWeekStart(now), [now]);
  const { data: weekBlocks = [] } = useTeamWeekSchedule(weekStart);

  // Derived: revenue this month
  const today = getToday();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const mtdRevenue = useMemo(() => {
    // Revenue = amountPaid on invoices where payment was received this month
    // Use paidAt if available, else metadata.createdAt, else dueDate
    return allInvoices
      .filter((inv: InvoiceRecord) => {
        if (inv.amountPaid <= 0) return false;
        if (inv.status === 'cancelled') return false;
        const dateStr = inv.paidAt ?? inv.metadata?.createdAt ?? inv.dueDate;
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.amountPaid, 0);
  }, [allInvoices, currentMonth, currentYear]);

  const outstanding = useMemo(() => {
    return allInvoices
      .filter((inv: InvoiceRecord) => inv.status !== 'cancelled' && inv.status !== 'draft' && inv.balanceDue > 0)
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.balanceDue, 0);
  }, [allInvoices]);

  const pipelineValue = useMemo(() => {
    // Pipeline = total value of all unpaid/partially paid invoices (not cancelled, not fully paid)
    return allInvoices
      .filter((inv: InvoiceRecord) => inv.status !== 'cancelled' && inv.status !== 'paid' && inv.totalAmount > 0)
      .reduce((sum: number, inv: InvoiceRecord) => sum + inv.totalAmount, 0);
  }, [allInvoices]);

  // Today's schedule blocks
  const todayBlocks = useMemo(() => {
    return weekBlocks.filter(b => b.date === today).sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });
  }, [weekBlocks, today]);

  // Recent events
  const recentEvents = useMemo(() => {
    return ((activityData?.events as unknown as Array<Record<string, unknown>>) ?? []).slice(0, 8);
  }, [activityData]);

  // Pipeline stage counts
  const pipelineCounts = useMemo(() => {
    const projects = dashboard.activeProjects;
    const allP = [...projects];
    return {
      leads: dashboard.leadCount,
      estimates: dashboard.quotedCount,
      active: dashboard.activeProjectCount,
      punch: allP.filter(p => p.jobStage === 'punch').length,
      complete: 0,
    };
  }, [dashboard]);

  // Flags
  const flags = useMemo(() => {
    const items: Array<{ desc: string; job: string; age: string }> = [];
    if (dashboard.overBudgetTasks.length > 0) {
      for (const t of dashboard.overBudgetTasks.slice(0, 4)) {
        items.push({ desc: `Over budget: ${t.sopCode || 'task'}`, job: t.projectId?.slice(0, 8) ?? '', age: '' });
      }
    }
    if (dashboard.pendingChangeOrders.length > 0) {
      for (const co of dashboard.pendingChangeOrders.slice(0, 2)) {
        items.push({ desc: `Pending CO: ${co.description?.slice(0, 40) || 'Change Order'}`, job: co.projectId?.slice(0, 8) ?? '', age: '' });
      }
    }
    return items;
  }, [dashboard]);

  // Loading state
  if (dashboard.isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)', fontFamily: 'var(--font-body)', display: 'flex' }}>

      {/* ================================================================ */}
      {/* CENTRE COLUMN                                                    */}
      {/* ================================================================ */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>

        {/* ---- 1. Page Header ---- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-1)', margin: 0 }}>
            Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-3)' }}>{getGreeting()}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>{formatDate(now)} {'·'} {formatTime(now)}</span>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>

        {/* ---- 2. KPI Strip ---- */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <StatCard label="Active Jobs" value={dashboard.activeProjectCount} href="/projects" color="var(--clay)" />
          <StatCard label="MTD Revenue" value={formatCurrency(mtdRevenue)} sub={mtdRevenue === 0 ? 'No data yet' : undefined} href="/finance" color="var(--green)" />
          <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} sub={pipelineValue === 0 ? 'No data yet' : undefined} href="/leads" color="var(--blue)" />
          <StatCard label="Avg Job Margin" value={dashboard.activeProjectCount > 0 ? '35%' : '—'} sub={dashboard.activeProjectCount === 0 ? 'No data yet' : undefined} color="var(--clay)" />
          <StatCard label="Outstanding" value={outstanding > 0 ? formatCurrency(outstanding) : '$0'} sub={outstanding === 0 ? 'No data yet' : undefined} href="/invoices" color={outstanding > 0 ? 'var(--amber)' : 'var(--text-3)'} />
        </div>

        {/* ---- 3. Active Jobs ---- */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)' }}>Active Jobs</div>
            {dashboard.activeProjectCount > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '2px 8px', borderRadius: 10, border: '1px solid var(--clay)', background: 'var(--sidebar-active)', color: 'var(--clay)', textTransform: 'uppercase', letterSpacing: '.07em', opacity: 0.8 }}>
                {dashboard.activeProjectCount} active
              </span>
            )}
          </div>

          {dashboard.activeProjects.length === 0 ? (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>No active jobs</div>
              <Link href="/leads" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--clay)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Start by adding a lead {'→'}
              </Link>
            </div>
          ) : (
            <>
              {dashboard.activeProjects.slice(0, 5).map(project => {
                const prog = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
                const badgeColor = stageBadgeColor(project.jobStage);
                return (
                  <Link key={project.id} href={`/jobs/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div
                      style={{
                        background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6,
                        padding: '14px 18px', marginBottom: 6, cursor: 'pointer',
                        transition: 'transform 150ms ease',
                      }}
                      onMouseEnter={e => { (e.currentTarget).style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor, flexShrink: 0 }} />
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-1)', flex: 1 }}>{project.name}</div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '2px 8px', borderRadius: 10, border: `1px solid ${badgeColor}`, background: 'var(--sidebar-active)', color: badgeColor, textTransform: 'uppercase', letterSpacing: '.07em', opacity: 0.8 }}>
                          {stageLabel(project.jobStage)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '2px 8px', borderRadius: 10, border: '1px solid var(--clay)', background: 'var(--sidebar-active)', color: 'var(--clay)', textTransform: 'uppercase', letterSpacing: '.07em', opacity: 0.8 }}>
                          Interiors
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{'›'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)' }}>
                          {project.completedCount}/{project.taskCount} tasks
                        </div>
                        {project.nextTask && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)' }}>
                            Next: {project.nextTask}
                          </div>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--clay)', borderRadius: 2, width: `${prog}%`, transition: 'width .4s' }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
              {dashboard.activeProjectCount > 5 && (
                <Link href="/projects" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--clay)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginTop: 8 }}>
                  View all {dashboard.activeProjectCount} jobs {'→'}
                </Link>
              )}
            </>
          )}
        </div>

        {/* ---- 4. Pipeline Funnel ---- */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)' }}>Pipeline</div>
          </div>

          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
            {([
              ['Leads', pipelineCounts.leads],
              ['Estimates', pipelineCounts.estimates],
              ['Active', pipelineCounts.active],
              ['Punch', pipelineCounts.punch],
              ['Complete', pipelineCounts.complete],
            ] as const).map(([name, count], i, arr) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Link href="/leads" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <div
                    style={{
                      background: 'var(--surface-1)', border: name === 'Active' ? '1px solid var(--clay)' : '1px solid var(--border)',
                      borderRadius: 6, padding: '12px 14px', textAlign: 'center',
                      cursor: 'pointer', transition: 'border-color 150ms',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: 4 }}>{name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--clay)' }}>{count}</div>
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-3)', padding: '0 4px', flexShrink: 0 }}>{'›'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---- 5. Recent Activity ---- */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)' }}>Recent Activity</div>
            <Link href="/activity" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--clay)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '.08em' }}>View all {'→'}</Link>
          </div>

          {recentEvents.length === 0 ? (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>No recent activity</div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {recentEvents.map((event, i) => {
                const { icon, color } = getEventIcon(event);
                const ts = event.created_at || event.createdAt || event.timestamp;
                const jobName = String(event.project_name || event.projectName || '');
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                    borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4 }}>
                        {formatEventLabel(event)}
                      </div>
                      {jobName && jobName !== 'undefined' && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--clay)', marginTop: 2 }}>{jobName}</div>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatRelativeTime(ts)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT PANEL                                                      */}
      {/* ================================================================ */}
      <div style={{ width: 280, background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', padding: '28px 20px', overflowY: 'auto', flexShrink: 0 }}>

        {/* ---- 1. Today's Schedule ---- */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)', marginBottom: 4 }}>Today</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 12 }}>{formatDate(now)}</div>

          {todayBlocks.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>No items scheduled for today</div>
          ) : (
            todayBlocks.map((block, i) => (
              <div key={block.id || i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--clay)', flexShrink: 0, minWidth: 44 }}>
                  {block.startTime || `${block.estimatedHours}h`}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4 }}>{block.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)' }}>{block.trade || 'General'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---- 2. Needs Attention ---- */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)', marginBottom: 12 }}>Needs Attention</div>

          {flags.length === 0 && dashboard.blockedCount === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)' }}>All clear</span>
            </div>
          ) : (
            <>
              {dashboard.blockedCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)', flexShrink: 0 }}>{'⚑'}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-1)' }}>{dashboard.blockedCount} blocked task{dashboard.blockedCount !== 1 ? 's' : ''}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)' }}>Across active jobs</div>
                  </div>
                </div>
              )}
              {flags.map((flag, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', flexShrink: 0 }}>{'⚑'}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-1)' }}>{flag.desc}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--clay)' }}>{flag.job}</div>
                  </div>
                </div>
              ))}
              {(flags.length + (dashboard.blockedCount > 0 ? 1 : 0)) > 4 && (
                <Link href="/projects" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--clay)', textDecoration: 'none', textTransform: 'uppercase' }}>View all {'→'}</Link>
              )}
            </>
          )}
        </div>

        {/* ---- 3. Quick Actions ---- */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)', marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {([
              ['◈', 'New Lead', '/leads'],
              ['+', 'New Job', '/projects'],
              ['$', 'Record Payment', '/invoices'],
              ['◎', 'Site Visit', '/intake'],
            ] as const).map(([icon, label, href]) => (
              <Link key={label} href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6,
                    padding: '10px 12px', cursor: 'pointer', transition: 'background 150ms',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--clay)' }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ---- 4. Division Split ---- */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--text-3)', marginBottom: 12 }}>By Division</div>
          {([
            ['Interiors', 'var(--clay)', dashboard.activeProjectCount, mtdRevenue],
            ['Exteriors', 'var(--blue)', 0, 0],
          ] as const).map(([name, color, active, revenue]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-1)', width: 64, flexShrink: 0 }}>{name}</div>
              <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: color, borderRadius: 2,
                  width: mtdRevenue > 0 ? `${Math.min(100, (revenue / Math.max(mtdRevenue, 1)) * 100)}%` : '0%',
                }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', width: 48, textAlign: 'right' }}>{formatCurrency(revenue)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-3)', width: 48, textAlign: 'right' }}>{active} active</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
