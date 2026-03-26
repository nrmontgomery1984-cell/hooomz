'use client';

/**
 * Homeowner Passport View — /portal/[projectId]/passport
 * Public-facing Property Passport. Only renders if passportPublished.
 * No financial data, no internal notes, no edit actions.
 */

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PassportDocument } from '@/components/passport';
import type { PassportJobData } from '@/components/passport';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useQuery } from '@tanstack/react-query';

export default function PortalPassportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: project, isLoading } = useLocalProject(projectId);
  const { services } = useServicesContext();

  const { data: lineItems = [] } = useQuery({
    queryKey: ['passport', 'portal', 'lineItems', projectId],
    queryFn: async () => {
      if (!services) return [];
      return services.estimating.lineItems.findByProjectId(projectId);
    },
    enabled: !!services && !!projectId,
  });

  const passportData = useMemo(() => {
    if (!project) return null;

    const addr = project.address;
    const address = addr?.street || project.name || projectId;
    const city = [addr?.city, addr?.province].filter(Boolean).join(', ') || '';

    const materialMap = new Map<string, { name: string; spec: string; room: string }>();
    const tradeMap = new Map<string, string[]>();

    for (const li of lineItems) {
      const item = li as any;
      if (!item.isLabor) {
        if (!materialMap.has(item.description)) {
          materialMap.set(item.description, {
            name: item.description,
            spec: `${item.quantity} ${item.unit}`,
            room: item.locationLabel || 'General',
          });
        }
      }
      const trade = item.workCategoryCode || item.category || 'General';
      if (!tradeMap.has(trade)) tradeMap.set(trade, []);
      tradeMap.get(trade)!.push(item.description);
    }

    const job: PassportJobData = {
      jobNumber: projectId,
      title: project.name || 'Renovation',
      completedDate: project.metadata?.updatedAt
        ? new Date(project.metadata.updatedAt).toLocaleDateString('en-CA')
        : new Date().toLocaleDateString('en-CA'),
      scopeSummary: `${lineItems.length} line items across ${tradeMap.size} trade${tradeMap.size !== 1 ? 's' : ''}.`,
      rooms: Array.from(new Set(lineItems.map((li: any) => li.locationLabel || 'General').filter(Boolean))),
      materials: Array.from(materialMap.values()),
      trades: Array.from(tradeMap.entries()).map(([trade, descs]) => ({
        trade: trade.charAt(0).toUpperCase() + trade.slice(1),
        description: descs.slice(0, 3).join('. ') + '.',
      })),
      crew: [{ firstName: 'Nathan', role: 'Lead Installer' }],
    };

    return {
      address,
      city,
      homeownerName: 'Homeowner',
      jobs: [job],
      firstJobDate: project.metadata?.createdAt ? new Date(project.metadata.createdAt).toLocaleDateString('en-CA') : undefined,
      lastUpdated: new Date().toLocaleDateString('en-CA'),
    };
  }, [project, lineItems, projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading passport...</p>
      </div>
    );
  }

  if (!passportData) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{ background: 'var(--bg)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--mid)' }}>Passport not available</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>This property passport hasn&apos;t been published yet.</p>
      </div>
    );
  }

  return (
    <PassportDocument
      address={passportData.address}
      city={passportData.city}
      homeownerName={passportData.homeownerName}
      jobs={passportData.jobs}
      firstJobDate={passportData.firstJobDate}
      lastUpdated={passportData.lastUpdated}
    />
  );
}
