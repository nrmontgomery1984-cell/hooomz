'use client';

/**
 * Labs Dashboard — overview of all Labs data
 */

import Link from 'next/link';
import { ClipboardList, Package, FileText, FlaskConical, BookOpen, FileCheck } from 'lucide-react';
import { useLabsObservations, useLabsKnowledgeItems, useLabsActiveExperiments, useLabsPendingSubmissions } from '@/lib/hooks/useLabsData';
import { LabsStatsRow } from '@/components/labs';

export default function LabsPage() {
  const { data: observations = [] } = useLabsObservations();
  const { data: knowledgeItems = [] } = useLabsKnowledgeItems();
  const { data: activeExperiments = [] } = useLabsActiveExperiments();
  const { data: pendingSubmissions = [] } = useLabsPendingSubmissions();

  const publishedCount = knowledgeItems.filter((k) => k.status === 'published').length;
  const avgConfidence = knowledgeItems.length > 0
    ? Math.round(knowledgeItems.reduce((sum, k) => sum + k.confidenceScore, 0) / knowledgeItems.length)
    : 0;

  const stats = [
    { label: 'Observations', value: observations.length },
    { label: 'Knowledge Items', value: knowledgeItems.length },
    { label: 'Active Experiments', value: activeExperiments.length },
    { label: 'Pending Submissions', value: pendingSubmissions.length },
  ];

  const sections = [
    { href: '/labs/observations', title: 'Observations', subtitle: `${observations.length} field observations captured`, Icon: ClipboardList },
    { href: '/labs/catalogs', title: 'Catalogs', subtitle: 'Products, techniques, tools', Icon: Package },
    { href: '/labs/submissions', title: 'Submissions', subtitle: `${pendingSubmissions.length} pending review`, Icon: FileText },
    { href: '/labs/experiments', title: 'Experiments', subtitle: `${activeExperiments.length} active`, Icon: FlaskConical },
    { href: '/labs/knowledge', title: 'Knowledge Base', subtitle: `${publishedCount} published, avg ${avgConfidence}% confidence`, Icon: BookOpen },
    { href: '/labs/sops', title: 'SOPs', subtitle: 'Standard operating procedures', Icon: FileCheck },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Labs</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Field data collection &amp; knowledge engine</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Stats */}
        <LabsStatsRow stats={stats} />

        {/* Section links */}
        <div className="space-y-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block rounded-xl p-4"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#F0FDFA' }}
                >
                  <section.Icon size={20} style={{ color: '#0F766E' }} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>{section.title}</h2>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{section.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
