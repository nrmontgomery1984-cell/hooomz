'use client';

/**
 * Client Portal — Homeowner-facing project view
 *
 * Read-only, calm, professional. No budget data. No internal events.
 * Accessed at /portal/[projectId]. No auth required (MVP).
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileCheck,
  Camera,
  User,
  MessageCircle,
  X,
  Check,
} from 'lucide-react';
import { groupEventsByDayArray } from '@hooomz/shared';
import { usePortalData } from '@/lib/hooks/usePortalData';
import type { PortalUpdate, TradeProgressItem, PortalTeamMember } from '@/lib/hooks/usePortalData';
import type { Photo } from '@hooomz/shared-contracts';

// ============================================================================
// Page
// ============================================================================

export default function PortalPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const portal = usePortalData(projectId);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  if (portal.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="text-center">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }}
          />
          <p className="text-base" style={{ color: '#6B7280' }}>Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!portal.project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="text-center px-6">
          <p className="text-lg font-medium mb-2" style={{ color: '#1F2937' }}>Project not found</p>
          <p className="text-base" style={{ color: '#6B7280' }}>
            This link may have expired or the project may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const statusColor = portal.projectStatus === 'complete'
    ? '#10B981'
    : portal.projectStatus === 'needs-attention'
    ? '#F59E0B'
    : '#10B981';

  return (
    <div className="min-h-screen pb-8" style={{ background: '#FAFAFA' }}>
      {/* ================================================================
          Header
          ================================================================ */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-md mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold" style={{ color: '#1F2937' }}>Hooomz</span>
            <div className="flex items-center gap-1.5">
              <Lock size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Secure</span>
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
            {portal.project.address.street}
            {portal.project.address.unit ? `, ${portal.project.address.unit}` : ''}
          </p>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#1F2937' }}>
            {portal.project.name}
          </h1>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: statusColor }}
            />
            <span className="text-sm font-medium" style={{ color: statusColor }}>
              {portal.statusLabel}
            </span>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>
              &middot; Est. completion {portal.estimatedCompletion}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5">
        {/* ================================================================
            Section 1: Overall Progress
            ================================================================ */}
        <div className="mt-5">
          <PortalCard>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
              Project Progress
            </h2>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-3 rounded-full" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${portal.progressPercent}%`,
                    background: '#10B981',
                    minWidth: portal.progressPercent > 0 ? '12px' : '0',
                  }}
                />
              </div>
              <span className="text-lg font-bold" style={{ color: '#1F2937' }}>
                {portal.progressPercent}%
              </span>
            </div>
            <p className="text-base" style={{ color: '#6B7280' }}>
              {portal.completedTasks} of {portal.totalTasks} tasks complete
            </p>
          </PortalCard>
        </div>

        {/* ================================================================
            Section 2: Progress by Trade
            ================================================================ */}
        {portal.tradeProgress.length > 0 && (
          <div className="mt-5">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
              Work Progress
            </h2>
            <PortalCard>
              <div className="space-y-4">
                {portal.tradeProgress.map((trade) => (
                  <TradeProgressRow key={trade.tradeCode} trade={trade} />
                ))}
              </div>
            </PortalCard>
          </div>
        )}

        {/* ================================================================
            Section 3: Recent Updates
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Recent Updates
          </h2>
          <PortalCard>
            {portal.recentUpdates.length === 0 ? (
              <p className="text-base py-2" style={{ color: '#9CA3AF' }}>
                Updates will appear here as work begins on your project.
              </p>
            ) : (
              <UpdateFeed updates={portal.recentUpdates} />
            )}
          </PortalCard>
        </div>

        {/* ================================================================
            Section 4: Photos
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Project Photos
          </h2>
          <PortalCard>
            {portal.photos.length === 0 ? (
              <div className="text-center py-4">
                <Camera size={32} style={{ color: '#D1D5DB' }} className="mx-auto mb-2" />
                <p className="text-base" style={{ color: '#9CA3AF' }}>
                  Photos will appear here as work progresses.
                </p>
              </div>
            ) : (
              <PhotoGallery photos={portal.photos} onSelect={setSelectedPhoto} />
            )}
          </PortalCard>
        </div>

        {/* ================================================================
            Section 5: Your Team
            ================================================================ */}
        <div className="mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1F2937' }}>
            Your Team
          </h2>
          <PortalCard>
            {portal.team.length === 0 ? (
              <p className="text-base py-2" style={{ color: '#9CA3AF' }}>
                Your project team will be shown here.
              </p>
            ) : (
              <div className="space-y-3">
                {portal.team.map((member) => (
                  <TeamMemberRow key={member.id} member={member} />
                ))}
              </div>
            )}
            <button
              onClick={() => setShowMessageModal(true)}
              className="w-full mt-4 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-colors"
              style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}
            >
              <MessageCircle size={18} />
              Message Your Team
            </button>
          </PortalCard>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: '#D1D5DB' }}>
            Powered by Hooomz
          </p>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal onClose={() => setShowMessageModal(false)} />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

/** Shared card wrapper for portal sections */
function PortalCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid #F3F4F6',
      }}
    >
      {children}
    </div>
  );
}

/** Trade progress row with bar and label */
function TradeProgressRow({ trade }: { trade: TradeProgressItem }) {
  const percent = trade.totalTasks > 0
    ? Math.round((trade.completedTasks / trade.totalTasks) * 100)
    : 0;
  const isComplete = percent === 100;
  const isNotStarted = percent === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-base font-medium" style={{ color: '#1F2937' }}>
          {trade.tradeName}
        </span>
        <span className="text-sm" style={{ color: isComplete ? '#10B981' : '#6B7280' }}>
          {isComplete ? (
            <span className="flex items-center gap-1">
              Complete <Check size={14} style={{ color: '#10B981' }} />
            </span>
          ) : isNotStarted ? (
            'Not started'
          ) : trade.iterationLabel ? (
            trade.iterationLabel
          ) : (
            `${trade.completedTasks}/${trade.totalTasks}`
          )}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: '#E5E7EB' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: '#10B981',
            minWidth: percent > 0 ? '8px' : '0',
          }}
        />
      </div>
    </div>
  );
}

/** Update feed grouped by day */
function UpdateFeed({ updates }: { updates: PortalUpdate[] }) {
  // Group by day using timestamps
  const eventsForGrouping = updates.map((u) => ({
    ...u,
    id: u.id,
    timestamp: u.timestamp,
  }));
  const grouped = groupEventsByDayArray(eventsForGrouping as any);

  return (
    <div className="space-y-4">
      {grouped.map(([dayLabel, dayUpdates]) => (
        <div key={dayLabel}>
          <p className="text-sm font-medium mb-2" style={{ color: '#9CA3AF' }}>
            {dayLabel}
          </p>
          <div className="space-y-2">
            {(dayUpdates as unknown as PortalUpdate[]).map((update) => (
              <UpdateRow key={update.id} update={update} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single update row */
function UpdateRow({ update }: { update: PortalUpdate }) {
  const iconMap: Record<PortalUpdate['type'], React.ReactNode> = {
    completed: <CheckCircle2 size={16} style={{ color: '#10B981' }} />,
    started: <ArrowRight size={16} style={{ color: '#3B82F6' }} />,
    deployed: <Calendar size={16} style={{ color: '#6B7280' }} />,
    approved: <FileCheck size={16} style={{ color: '#10B981' }} />,
    photo: <Camera size={16} style={{ color: '#6B7280' }} />,
    other: <ArrowRight size={16} style={{ color: '#6B7280' }} />,
  };

  return (
    <div className="flex items-start gap-3 py-1">
      <div className="mt-0.5 flex-shrink-0">{iconMap[update.type]}</div>
      <p className="text-base" style={{ color: '#1F2937' }}>{update.summary}</p>
    </div>
  );
}

/** Photo gallery with horizontal scroll */
function PhotoGallery({ photos, onSelect }: {
  photos: Photo[];
  onSelect: (photo: Photo) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex gap-2 px-1">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => onSelect(photo)}
            className="flex-shrink-0 rounded-xl overflow-hidden min-h-[48px]"
            style={{ width: 120, height: 90, background: '#F3F4F6', border: '1px solid #E5E7EB' }}
          >
            {photo.thumbnailPath || photo.filePath ? (
              <img
                src={photo.thumbnailPath || photo.filePath}
                alt={photo.caption || 'Project photo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={24} style={{ color: '#D1D5DB' }} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Team member row */
function TeamMemberRow({ member }: { member: PortalTeamMember }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#F3F4F6' }}
      >
        <User size={20} style={{ color: '#9CA3AF' }} />
      </div>
      <div>
        <p className="text-base font-medium" style={{ color: '#1F2937' }}>
          {member.displayName}
        </p>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {member.displayRole}
        </p>
      </div>
    </div>
  );
}

/** Full-screen photo lightbox */
function PhotoLightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X size={24} color="#FFFFFF" />
      </button>
      <div className="max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.filePath}
          alt={photo.caption || 'Project photo'}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        {photo.caption && (
          <p className="text-center mt-3 text-base text-white">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}

/** Messaging placeholder modal */
function MessageModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full"
        style={{ background: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#1F2937' }}>
            Message Your Team
          </h3>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={20} style={{ color: '#9CA3AF' }} />
          </button>
        </div>
        <p className="text-base mb-1" style={{ color: '#1F2937' }}>
          Messaging is coming soon.
        </p>
        <p className="text-base mb-5" style={{ color: '#6B7280' }}>
          For urgent questions, please call your project lead directly.
        </p>
        <button
          onClick={onClose}
          className="w-full min-h-[48px] rounded-xl text-base font-medium text-white"
          style={{ background: '#0F766E' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
