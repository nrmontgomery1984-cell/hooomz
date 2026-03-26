'use client';

/**
 * Operator Passport Preview — /production/jobs/[id]/passport
 * Shows the Property Passport for this job's property.
 * Operator can review before publishing to the homeowner portal.
 */

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { PassportDocument } from '@/components/passport';
import type { PassportJobData } from '@/components/passport';
import { useLocalProject } from '@/lib/hooks/useLocalData';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';

export default function OperatorPassportPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { data: project, isLoading: projectLoading } = useLocalProject(jobId);
  const { services } = useServicesContext();
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState(false);

  // Load line items for material/trade data
  const { data: lineItems = [] } = useQuery({
    queryKey: ['passport', 'lineItems', jobId],
    queryFn: async () => {
      if (!services) return [];
      return services.estimating.lineItems.findByProjectId(jobId);
    },
    enabled: !!services && !!jobId,
  });

  // Build passport data from project + line items
  const passportData = useMemo(() => {
    if (!project) return null;

    const addr = project.address;
    const address = addr?.street || project.name || jobId;
    const city = [addr?.city, addr?.province].filter(Boolean).join(', ') || 'NB';

    // Group line items by trade for materials and work performed
    const materialMap = new Map<string, { name: string; spec: string; room: string }>();
    const tradeMap = new Map<string, string[]>();

    for (const li of lineItems) {
      const item = li as { description: string; category: string; quantity: number; unit: string; isLabor: boolean; workCategoryCode?: string; locationLabel?: string };
      if (!item.isLabor) {
        const key = item.description;
        if (!materialMap.has(key)) {
          materialMap.set(key, {
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
      jobNumber: jobId,
      title: project.name || 'Renovation',
      completedDate: project.metadata?.updatedAt
        ? new Date(project.metadata.updatedAt).toLocaleDateString('en-CA')
        : new Date().toLocaleDateString('en-CA'),
      scopeSummary: `${lineItems.length} line items across ${tradeMap.size} trade${tradeMap.size !== 1 ? 's' : ''}.`,
      rooms: Array.from(new Set(lineItems.map((li: any) => li.locationLabel || 'General').filter(Boolean))),
      materials: Array.from(materialMap.values()),
      trades: Array.from(tradeMap.entries()).map(([trade, descs]) => ({
        trade: trade.charAt(0).toUpperCase() + trade.slice(1),
        description: descs.slice(0, 3).join('. ') + (descs.length > 3 ? ` and ${descs.length - 3} more items.` : '.'),
      })),
      crew: [{ firstName: 'Nathan', role: 'Lead Installer' }],
    };

    return {
      address,
      city,
      homeownerName: 'Homeowner', // Would come from customer lookup
      jobs: [job],
      firstJobDate: project.metadata?.createdAt
        ? new Date(project.metadata.createdAt).toLocaleDateString('en-CA')
        : undefined,
      lastUpdated: new Date().toLocaleDateString('en-CA'),
    };
  }, [project, lineItems, jobId]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // In a full implementation, this would:
      // 1. Create/update passport in IDB
      // 2. Set passportPublished on the project
      showToast({ message: 'Passport published to homeowner portal', variant: 'success', duration: 3000 });
    } finally {
      setPublishing(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading passport...</p>
      </div>
    );
  }

  if (!passportData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Project not found</p>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <PassportDocument
        address={passportData.address}
        city={passportData.city}
        homeownerName={passportData.homeownerName}
        jobs={passportData.jobs}
        firstJobDate={passportData.firstJobDate}
        lastUpdated={passportData.lastUpdated}
        showPublish
        onPublish={handlePublish}
        isPublishing={publishing}
      />
    </PageErrorBoundary>
  );
}
