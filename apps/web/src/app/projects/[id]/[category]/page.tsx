'use client';

/**
 * Category/Stage/Location Detail Page
 *
 * Third level of drill-down:
 * Portfolio -> Project -> Category/Stage/Location
 *
 * Shows the LoopVisualization with:
 * - Outer ring: The selected category/stage/location
 * - Inner spheres: Sub-items (e.g., locations within a work category)
 */

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LoopVisualization } from '@/components/visualization/LoopVisualization';
import { BreadcrumbSpheres } from '@/components/navigation/BreadcrumbSpheres';
import { useProject } from '@/lib/api/hooks';
import { useBusinessHealth } from '@/lib/api/hooks/useBusinessHealth';

// Icon mapping for Interiors work categories and locations
const CATEGORY_ICONS: Record<string, string> = {
  // Work categories (Interiors)
  'FL': '🪵',           // Flooring
  'flooring': '🪵',
  'PT': '🎨',           // Paint
  'paint': '🎨',
  'FC': '📐',           // Finish Carpentry
  'finish-carpentry': '📐',
  'trim': '📐',
  'TL': '🔲',           // Tile
  'tile': '🔲',
  'DW': '🧱',           // Drywall
  'drywall': '🧱',
  'OH': '⚙️',           // Overhead
  'overhead': '⚙️',
  // Stages
  'demo': '🔨',
  'prep': '🧹',
  'finish': '✨',
  'punch-list': '📋',
  'closeout': '✅',
  // Locations
  'kitchen': '🍳',
  'master-bath': '🛁',
  'living-room': '🛋️',
  'bedroom': '🛏️',
  'hallway': '🚪',
  'dining-room': '🍽️',
};

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const categorySlug = params.category as string;

  const { data: project, isLoading } = useProject(projectId);
  const { healthScore: portfolioHealth } = useBusinessHealth();

  // Convert slug to display name
  const categoryName = categorySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const categoryIcon = CATEGORY_ICONS[categorySlug] || '📦';

  // Handle location selection - drill down further
  const handleSelectChild = useCallback((childId: string) => {
    router.push(`/projects/${projectId}/${categorySlug}/${childId}`);
  }, [router, projectId, categorySlug]);

  // Handle back to project
  const handleSelectParent = useCallback(() => {
    router.push(`/projects/${projectId}`);
  }, [router, projectId]);

  // Category loop (outer ring)
  const categoryLoop = {
    id: categorySlug,
    name: categoryName,
    icon: categoryIcon,
    score: 72, // TODO: Calculate from actual data
  };

  // Child loops - locations or tasks within this category
  // TODO: Connect to actual LoopService.getLoopTree()
  const childLoops = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', score: 85 },
    { id: 'master-bath', name: 'Master Bath', icon: '🛁', score: 60 },
    { id: 'living-room', name: 'Living Room', icon: '🛋️', score: 45 },
    { id: 'guest-bath', name: 'Guest Bath', icon: '🚿', score: 90 },
  ];

  // Breadcrumbs
  const breadcrumbs = [
    { id: 'home', label: 'Portfolio', href: '/', score: portfolioHealth },
    {
      id: projectId,
      label: project?.name || 'Project',
      href: `/projects/${projectId}`,
      score: 75,
    },
    {
      id: categorySlug,
      label: categoryName,
      href: `/projects/${projectId}/${categorySlug}`,
      score: 72,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-64 h-64 rounded-full border-2 border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <BreadcrumbSpheres items={breadcrumbs} />
      </div>

      {/* Loop Visualization - Category -> Locations/Tasks */}
      <div className="px-4 pt-4">
        <LoopVisualization
          parentLoop={categoryLoop}
          childLoops={childLoops}
          onSelectChild={handleSelectChild}
          onSelectParent={handleSelectParent}
        />
      </div>
    </div>
  );
}
