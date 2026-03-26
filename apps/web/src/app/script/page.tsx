'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useLocalProjects } from '@/lib/hooks/useLocalData';

const MONO = "'DM Mono', monospace";
const FIG = "'Figtree', sans-serif";

const SCRIPT_PHASES = [
  { letter: 'S', name: 'Shield', href: '/script/shield', stage: 'shield' },
  { letter: 'C', name: 'Clear', href: '/script/clear', stage: 'clear' },
  { letter: 'R', name: 'Ready', href: '/script/ready', stage: 'ready' },
  { letter: 'I', name: 'Install', href: '/script/install', stage: 'install' },
  { letter: 'P', name: 'Punch', href: '/script/punch', stage: 'punch' },
  { letter: 'T', name: 'Turnover', href: '/script/turnover', stage: 'turnover' },
];

const SCRIPT_STAGE_SET = new Set(SCRIPT_PHASES.map((p) => p.stage));

function formatCAD(value: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function stageName(stage: string): string {
  const found = SCRIPT_PHASES.find((p) => p.stage === stage);
  return found ? found.name : stage;
}

export default function ScriptDashboardPage() {
  const { data, isLoading } = useLocalProjects();

  const projects = useMemo(() => {
    const all = data?.projects ?? [];
    return all.filter((p) => p.jobStage && SCRIPT_STAGE_SET.has(p.jobStage));
  }, [data]);

  const phaseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const phase of SCRIPT_PHASES) {
      map[phase.stage] = projects.filter((p) => p.jobStage === phase.stage).length;
    }
    return map;
  }, [projects]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9C9690' }}>
          Loading production...
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: '#2C2926', letterSpacing: '-0.02em' }}>
            SCRIPT
          </div>
          <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660', marginTop: 4, marginBottom: 48 }}>
            Production — Shield through Turnover
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <div style={{ fontFamily: FIG, fontSize: 16, color: '#6B6660' }}>
              No active jobs in production
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: '#2C2926', letterSpacing: '-0.02em' }}>
            SCRIPT
          </div>
          <div style={{ fontFamily: FIG, fontSize: 14, color: '#6B6660', marginTop: 4 }}>
            Production — Shield through Turnover
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#9C9690', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {projects.length} active job{projects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Phase Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 40 }}>
          {SCRIPT_PHASES.map((phase) => (
            <Link
              key={phase.letter}
              href={phase.href}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #E0DCD7',
                  borderRadius: 10,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#C4BFB8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E0DCD7'; }}
              >
                <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 600, color: '#2C2926', lineHeight: 1 }}>
                  {phase.letter}
                </div>
                <div style={{ fontFamily: FIG, fontSize: 12, color: '#6B6660', marginTop: 6, marginBottom: 12 }}>
                  {phase.name}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: '#2C2926' }}>
                  {phaseCounts[phase.stage] ?? 0}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: '#9C9690', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  job{(phaseCounts[phase.stage] ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Active Jobs List */}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 12 }}>
            Active Jobs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #E0DCD7',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FIG, fontSize: 14, fontWeight: 500, color: '#2C2926', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                  </div>
                  <div style={{ fontFamily: FIG, fontSize: 12, color: '#9C9690', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.address.street}, {project.address.city}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#2D7A4F',
                      background: '#EEF5F1',
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {stageName(project.jobStage ?? '')}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: '#6B6660', minWidth: 72, textAlign: 'right' }}>
                    {project.budget.estimatedCost > 0 ? formatCAD(project.budget.estimatedCost) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
