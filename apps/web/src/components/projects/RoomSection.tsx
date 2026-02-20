'use client';

/**
 * Room Section — Collapsible accordion for tasks grouped by room
 *
 * Header: health dot, room icon, room name, completion fraction + percentage
 * Body: progress bar + TaskCard children
 * Collapse animation via CSS grid-template-rows
 */

import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getRoomIcon } from '@/lib/utils/taskParsing';

// Score color (from locked design language)
function getScoreColor(score: number) {
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#14B8A6';
  if (score >= 50) return '#F59E0B';
  if (score >= 30) return '#F97316';
  return '#EF4444';
}

interface RoomSectionProps {
  roomName: string;
  completedCount: number;
  totalCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
}

export function RoomSection({
  roomName,
  completedCount,
  totalCount,
  isCollapsed,
  onToggleCollapse,
  children,
}: RoomSectionProps) {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const scoreColor = getScoreColor(pct);
  const roomIcon = getRoomIcon(roomName);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
    >
      {/* Room Header — full-width tap target */}
      <button
        onClick={onToggleCollapse}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left"
        style={{ minHeight: '40px' }}
      >
        {/* Collapse chevron */}
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: '#9CA3AF',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        />

        {/* Health dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: scoreColor }}
        />

        {/* Room name + icon */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>
            {roomIcon} {roomName}
          </span>
        </div>

        {/* Completion fraction + percentage */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
            {completedCount}/{totalCount}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: scoreColor }}
          >
            {pct}%
          </span>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-3 pb-1.5">
        <div className="w-full h-1.5 rounded-full" style={{ background: '#F3F4F6' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-400"
            style={{
              width: `${pct}%`,
              background: scoreColor,
            }}
          />
        </div>
      </div>

      {/* Collapsible content */}
      <div
        ref={contentRef}
        style={{
          display: 'grid',
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 200ms ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
