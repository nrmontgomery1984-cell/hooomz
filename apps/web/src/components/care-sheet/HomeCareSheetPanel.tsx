'use client';

/**
 * HomeCareSheetPanel — Compact panel for project detail page.
 *
 * Self-gates: only renders when jobStage is punch, turnover, or complete.
 * Shows trade count, material count, and a "View" link to the full page.
 */

import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';
import { PanelSection } from '@/components/ui/PanelSection';
import { useHomeCareSheet } from '@/lib/hooks/useHomeCareSheet';
import type { JobStage } from '@hooomz/shared-contracts';

const VISIBLE_STAGES: Set<string> = new Set(['punch', 'turnover', 'complete']);

interface HomeCareSheetPanelProps {
  projectId: string;
  customerId: string | undefined;
  jobStage: JobStage | string | undefined;
}

export function HomeCareSheetPanel({ projectId, customerId, jobStage }: HomeCareSheetPanelProps) {
  const careSheet = useHomeCareSheet(projectId, customerId);

  // Gate: only show at punch / turnover / complete
  if (!jobStage || !VISIBLE_STAGES.has(jobStage)) return null;
  if (!careSheet) return null;

  const tradeCount = careSheet.tradeSections.length;
  const materialCount = careSheet.tradeSections.reduce(
    (sum, s) => sum + s.materialsInstalled.length, 0,
  );

  if (tradeCount === 0) return null;

  const action = (
    <Link
      href={`/projects/${projectId}/care-sheet`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        color: 'var(--blue)',
        fontWeight: 600,
        textDecoration: 'none',
        fontFamily: 'var(--font-mono)',
      }}
    >
      View <ArrowRight size={9} />
    </Link>
  );

  return (
    <PanelSection label="Home Care Sheet" action={action}>
      <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileCheck size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--charcoal)' }}>
            {tradeCount} trade{tradeCount !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6 }}>
            {materialCount} material{materialCount !== 1 ? 's' : ''} documented
          </span>
        </div>
      </div>
    </PanelSection>
  );
}
