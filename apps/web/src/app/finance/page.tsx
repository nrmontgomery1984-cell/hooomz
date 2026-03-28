'use client';

/**
 * Finance Dashboard — Revenue, forecast, cost tracking
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { TrendingUp, DollarSign, ChevronRight, BarChart3, Users } from 'lucide-react';
import { useProjectVarianceSummary } from '@/lib/hooks/useLabourEstimation';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { SECTION_COLORS } from '@/lib/viewmode';
import { ExpenseListPanel } from '@/components/expenses/ExpenseListPanel';
import { useAllInvoices } from '@/lib/hooks/useInvoices';
import { useInvoiceAging } from '@/lib/hooks/useInvoiceAging';
import { ARAgingTable } from '@/components/finance/ARAgingTable';
import { FinancialScoreWidget } from '@/components/finance/FinancialScoreWidget';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useActiveCrewMembers } from '@/lib/hooks/useCrewData';
import {
  usePendingReimbursements,
  usePendingExpenseReview,
  useRetroactivePOsPending,
} from '@/lib/hooks/useExpenseTracker';

const FINANCE_COLOR = SECTION_COLORS.finance;

type TransactionRow = {
  id: string;
  date: string;
  description: string;
  type: 'Invoice' | 'Payment' | 'Expense';
  amount: number;
};

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reporting'>('overview');
  const { services, isLoading: servicesLoading } = useServicesContext();
  const { projectId: crewProjectId } = useActiveCrew();
  const { data: labourVariance } = useProjectVarianceSummary(crewProjectId);
  const { data: allInvoices } = useAllInvoices();
  const aging = useInvoiceAging(allInvoices);

  // All expenses for recent transactions
  const { data: allExpenses = [] } = useQuery({
    queryKey: ['finance', 'allExpenses'],
    queryFn: () => services!.expenses.findAll(),
    enabled: !servicesLoading && !!services,
    staleTime: 15_000,
  });

  // ── Reporting tab data (real from timeclock) ──
  const { data: crewMembers = [] } = useActiveCrewMembers();

  // Payroll: today's entries per crew member
  const { data: payrollData = [] } = useQuery({
    queryKey: ['reporting', 'payroll', 'today', crewMembers.map((m) => m.id).join(',')],
    queryFn: async () => {
      if (!services) return [];
      return Promise.all(
        crewMembers.map(async (member) => {
          const entries = await services.timeClock.getTodayEntries(member.id);
          const closed = entries.filter((e) => e.clock_out !== null);
          const installHours = closed
            .filter((e) => e.entryType !== 'overhead' && e.entryType !== 'break')
            .reduce((sum, e) => sum + (e.total_hours ?? 0), 0);
          const indirectHours = closed
            .filter((e) => e.entryType === 'overhead')
            .reduce((sum, e) => sum + (e.total_hours ?? 0), 0);
          const totalHours = installHours + indirectHours;
          const rate = member.wageRate ?? 0;
          return {
            name: member.name,
            role: `${member.role ?? 'Installer'} · $${rate}/hr`,
            installStr: `${installHours.toFixed(1)}h`,
            indirectStr: `${indirectHours.toFixed(1)}h`,
            totalStr: `${totalHours.toFixed(1)}h`,
            payStr: `$${(totalHours * rate).toFixed(0)}`,
            totalHours,
            indirectHours,
            payNum: totalHours * rate,
          };
        })
      );
    },
    enabled: crewMembers.length > 0 && !servicesLoading && !!services,
    staleTime: 15_000,
  });

  // Indirect breakdown: today's overhead entries grouped by note/category
  const { data: indirectData = [] } = useQuery({
    queryKey: ['reporting', 'indirect', 'today', crewMembers.map((m) => m.id).join(',')],
    queryFn: async () => {
      if (!services) return [];
      const allEntries = await Promise.all(
        crewMembers.map((m) => services.timeClock.getTodayEntries(m.id))
      );
      const flat = allEntries.flat().filter((e) =>
        e.entryType === 'overhead' && e.clock_out !== null
      );
      const grouped: Record<string, { hours: number; cost: number }> = {};
      for (const entry of flat) {
        const tag = entry.note || 'Admin';
        if (!grouped[tag]) grouped[tag] = { hours: 0, cost: 0 };
        grouped[tag].hours += entry.total_hours ?? 0;
        grouped[tag].cost += (entry.total_hours ?? 0) * (entry.hourly_rate ?? 0);
      }
      return Object.entries(grouped)
        .map(([tag, data]) => ({
          tag,
          detail: '',
          hours: `${data.hours.toFixed(1)}h`,
          cost: `$${data.cost.toFixed(0)}`,
          hoursNum: data.hours,
          costNum: data.cost,
          warn: data.hours > 1,
        }))
        .sort((a, b) => b.hoursNum - a.hoursNum);
    },
    enabled: crewMembers.length > 0 && !servicesLoading && !!services,
    staleTime: 15_000,
  });

  const indirectTotalHours = indirectData.reduce((s, r) => s + r.hoursNum, 0);
  const indirectTotalCost = indirectData.reduce((s, r) => s + r.costNum, 0);
  const payrollTotalInstall = payrollData.reduce((s, r) => s + r.totalHours - r.indirectHours, 0);
  const payrollTotalIndirect = payrollData.reduce((s, r) => s + r.indirectHours, 0);
  const payrollTotalHours = payrollData.reduce((s, r) => s + r.totalHours, 0);
  const payrollTotalPay = payrollData.reduce((s, r) => s + r.payNum, 0);

  // Merge invoices + expenses into a unified transaction list (last 10)
  const recentTransactions = useMemo<TransactionRow[]>(() => {
    const rows: TransactionRow[] = [];

    for (const inv of allInvoices ?? []) {
      rows.push({
        id: inv.id,
        date: inv.metadata.createdAt,
        description: `${inv.invoiceNumber} — ${inv.invoiceType}`,
        type: 'Invoice',
        amount: inv.totalAmount,
      });
      if (inv.amountPaid > 0) {
        rows.push({
          id: `${inv.id}-pay`,
          date: inv.paidAt ?? inv.metadata.updatedAt,
          description: `Payment on ${inv.invoiceNumber}`,
          type: 'Payment',
          amount: inv.amountPaid,
        });
      }
    }

    for (const exp of allExpenses) {
      rows.push({
        id: exp.id,
        date: exp.date || exp.metadata.createdAt,
        description: exp.description,
        type: 'Expense',
        amount: exp.amount,
      });
    }

    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows.slice(0, 10);
  }, [allInvoices, allExpenses]);

  const isLoading = servicesLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: FINANCE_COLOR, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6 py-3 md:py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: FINANCE_COLOR }} />
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                Finance Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Revenue, forecasting, and cost tracking</p>
          </div>
        </div>

        {/* TAB BAR */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          paddingLeft: 20,
          gap: 0,
        }}>
          {(['overview', 'reporting'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--charcoal)' : 'var(--muted)',
                borderBottom: activeTab === tab ? '2px solid var(--charcoal)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="max-w-lg md:max-w-full mx-auto px-4 md:px-6">

          {activeTab === 'overview' && (
          <div>
          {/* Financial Score Widget */}
          <div style={{ marginTop: 16 }}>
            <FinancialScoreWidget />
          </div>

          {/* Stat Row */}
          <div
            style={{ marginTop: 16, display: 'grid', gap: 10 }}
            className="grid-cols-2 md:grid-cols-4"
          >
            <StatCard icon={<DollarSign size={14} />} label="Revenue MTD" value="—" color={FINANCE_COLOR} />
            <StatCard icon={<TrendingUp size={14} />} label="Forecast" value="→" color={FINANCE_COLOR} />
            <StatCard icon={<DollarSign size={14} />} label="Outstanding AR" value={aging.totalOutstanding > 0 ? `$${Math.round(aging.totalOutstanding).toLocaleString()}` : '—'} color={FINANCE_COLOR} />
            <StatCard icon={<BarChart3 size={14} />} label="Gross Margin" value="—" color={FINANCE_COLOR} />
          </div>

          {/* Content Grid */}
          <div className="mt-5" style={{ display: 'grid', gap: 16 }}>

            {/* Forecast Link Card */}
            <Link
              href="/finance/forecast"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderRadius: 'var(--radius)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)', textDecoration: 'none', color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={16} style={{ color: FINANCE_COLOR }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', display: 'block' }}>View Forecast</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Revenue projections & scenario planning</span>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
            </Link>

            {/* Labour Performance */}
            <div>
              <SectionHeader title="Labour Performance" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-card)' }}>
                {!labourVariance || (labourVariance.totalSellBudget === 0 && labourVariance.tasksWithoutEstimate.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Users size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No labour estimates applied yet</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                      Apply estimates to deployed tasks to see performance data
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Budget summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Total Sell Budget</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
                          ${labourVariance.totalSellBudget.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>Total Cost Budget</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>
                          ${labourVariance.totalCostBudget.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Efficiency + actuals */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--mid)' }}>
                          Budgeted: {labourVariance.totalBudgetedHours.toFixed(1)}h
                        </span>
                        {labourVariance.overallEfficiency !== null && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                              color: labourVariance.overallEfficiency > 1.15 ? 'var(--red)'
                                : labourVariance.overallEfficiency > 1.0 ? 'var(--amber)'
                                : 'var(--green)',
                            }}
                          >
                            {Math.round(labourVariance.overallEfficiency * 100)}% efficiency
                          </span>
                        )}
                      </div>
                      {labourVariance.totalActualCost !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' }}>
                          <span>Actual cost: ${labourVariance.totalActualCost.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          {labourVariance.totalActualHours !== null && (
                            <span>Actual hours: {labourVariance.totalActualHours.toFixed(1)}h</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Crew breakdown */}
                    {labourVariance.varianceByCrewMember.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>By Crew Member</span>
                        {labourVariance.varianceByCrewMember.map((cv) => (
                          <div key={cv.crewMemberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--mid)' }}>
                              {cv.crewMemberName} ({cv.taskCount} task{cv.taskCount !== 1 ? 's' : ''})
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                                color: cv.totalVariance > 0.15 ? 'var(--red)'
                                  : cv.totalVariance > 0 ? 'var(--amber)'
                                  : 'var(--green)',
                              }}
                            >
                              {cv.totalVariance > 0 ? '+' : ''}{Math.round(cv.totalVariance * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Missing estimates warning */}
                    {labourVariance.tasksWithoutEstimate.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: 'var(--amber-dim)' }}>
                        <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>
                          {labourVariance.tasksWithoutEstimate.length} task{labourVariance.tasksWithoutEstimate.length !== 1 ? 's' : ''} missing estimates
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AR Aging */}
            <div>
              <SectionHeader title="Accounts Receivable" />
              <ARAgingTable aging={aging} />
            </div>

            {/* Expenses (active project) */}
            <div>
              <SectionHeader title="Project Expenses" />
              {crewProjectId ? (
                <ExpenseListPanel projectId={crewProjectId} />
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                  <DollarSign size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>Select a crew session to see project expenses</p>
                </div>
              )}
            </div>

            {/* Expense Tracker Summary */}
            <ExpenseTrackerCards />

            {/* Overdue Invoices */}
            <div>
              <SectionHeader title="Overdue Invoices" />
              {aging.overdue.length === 0 ? (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                  <DollarSign size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>No overdue invoices</p>
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {aging.overdue.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="hover-surface"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mid)' }}>{inv.invoiceNumber}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--red)', background: 'var(--red-bg)', padding: '1px 5px', borderRadius: 3 }}>OVERDUE</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--red)' }}>${inv.balanceDue.toFixed(0)}</span>
                      <ChevronRight size={12} color="var(--muted)" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <SectionHeader title="Recent Transactions" />
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {recentTransactions.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <DollarSign size={20} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>No transactions yet</p>
                  </div>
                ) : (
                  recentTransactions.map((tx, i) => {
                    const typeColor = tx.type === 'Invoice' ? 'var(--blue)' : tx.type === 'Payment' ? 'var(--green)' : 'var(--amber)';
                    const typeBg = tx.type === 'Invoice' ? 'var(--blue-bg)' : tx.type === 'Payment' ? 'var(--green-bg)' : 'var(--amber-dim)';
                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', minHeight: 40,
                          borderBottom: i < recentTransactions.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0, width: 56 }}>
                          {new Date(tx.date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--charcoal)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '1px 5px', borderRadius: 2,
                          background: typeBg, color: typeColor, flexShrink: 0,
                        }}>
                          {tx.type}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--charcoal)', flexShrink: 0, width: 70, textAlign: 'right' }}>
                          ${tx.amount.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>
          )}

          {activeTab === 'reporting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 20 }}>

            {/* PAYROLL SUMMARY — real data from timeclock */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <SectionHeader title="Crew Hours — Today" />
                <button style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em',
                  textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '6px 12px', cursor: 'pointer', borderRadius: 'var(--radius)',
                }}>Export →</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                {['Crew', 'Install hrs', 'Indirect hrs', 'Total hrs', 'Pay'].map((h) => (
                  <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--muted)', textAlign: h === 'Crew' ? 'left' : 'right' }}>{h}</div>
                ))}
              </div>

              {payrollData.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>No time entries today</div>
              ) : payrollData.map((row, i, arr) => (
                <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', gap: 8, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{row.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 1 }}>{row.role}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--charcoal)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.installStr}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--yellow)', textAlign: 'right' }}>{row.indirectStr}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', textAlign: 'right' }}>{row.totalStr}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)', textAlign: 'right' }}>{row.payStr}</div>
                </div>
              ))}

              {payrollData.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 100px', gap: 8, padding: '10px 0 0', borderTop: '1px solid var(--border)', marginTop: 4, alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>Today total</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', textAlign: 'right' }}>{payrollTotalInstall.toFixed(1)}h</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--yellow)', textAlign: 'right' }}>{payrollTotalIndirect.toFixed(1)}h</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--charcoal)', textAlign: 'right' }}>{payrollTotalHours.toFixed(1)}h</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--green)', textAlign: 'right' }}>${payrollTotalPay.toFixed(0)}</div>
                </div>
              )}
            </div>

            {/* INDIRECT PRODUCTION BREAKDOWN — real data */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <SectionHeader title="Indirect Production — Today" />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {indirectData.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>No indirect time logged today</div>
                ) : indirectData.map((row) => (
                  <div key={row.tag} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 70px 70px',
                    alignItems: 'center', padding: '10px 12px', gap: 12,
                    background: row.warn ? 'rgba(217,119,6,0.04)' : 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                      padding: '3px 7px', borderRadius: 2, textTransform: 'uppercase' as const,
                      background: 'rgba(217,119,6,0.1)', color: 'var(--yellow)',
                      width: 'fit-content',
                    }}>{row.tag}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.detail}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: row.warn ? 'var(--yellow)' : 'var(--charcoal)', textAlign: 'right', fontWeight: row.warn ? 700 : 400 }}>{row.hours}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{row.cost}</div>
                  </div>
                ))}

                {indirectData.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px 70px', alignItems: 'center', padding: '10px 12px', gap: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>Total</div>
                    <div/>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--yellow)', textAlign: 'right' }}>{indirectTotalHours.toFixed(1)}h</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--charcoal)', textAlign: 'right' }}>${indirectTotalCost.toFixed(0)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* LINE ITEM TIME DETAIL — placeholder until deployed tasks are populated */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
              <SectionHeader title="Line Item Time Detail — Active Jobs" />
              <div style={{ marginTop: 12, padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
                Line item detail requires deployed tasks with labour estimates.
                <br />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
                  Apply estimates via the job passport to see budgeted vs actual hours per task.
                </span>
              </div>
            </div>

          </div>
          )}

        </div>
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
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
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
  );
}

function fmtCurrency(n: number) {
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ExpenseTrackerCards() {
  const { data: pendingReimb = [] } = usePendingReimbursements();
  const { data: pendingReview = [] } = usePendingExpenseReview();
  const { data: retroPOs = [] } = useRetroactivePOsPending();

  const reimbTotal = pendingReimb.reduce((s, e) => s + e.amount, 0);
  const reimbCrewCount = new Set(pendingReimb.map((e) => e.crewMemberId)).size;
  const retroTotal = retroPOs.reduce((s, po) => s + po.total, 0);

  if (pendingReimb.length === 0 && pendingReview.length === 0 && retroPOs.length === 0) return null;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        Expense Tracker
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {pendingReimb.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--amber)', padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Reimbursements Owing
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--amber)', lineHeight: 1 }}>
              {fmtCurrency(reimbTotal)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {reimbCrewCount} crew member{reimbCrewCount !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        {pendingReview.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--blue)', padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Expenses Pending Review
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1 }}>
              {pendingReview.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              across active jobs
            </div>
          </div>
        )}
        {retroPOs.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Retroactive POs Pending
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--charcoal)', lineHeight: 1 }}>
              {retroPOs.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {fmtCurrency(retroTotal)} total value
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
