'use client';

/**
 * LoopVisualization
 *
 * Circular loop visualization inspired by Looops app.
 * Shows an outer ring (parent context) with inner spheres (children) arranged in a circle.
 *
 * Usage:
 * - Portfolio view: outer = company health, inner = projects
 * - Project view: outer = project health, inner = categories/stages/locations
 *
 * Supports drill-down: tap a sphere to make it the new outer ring.
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type HealthStatus = 'healthy' | 'progress' | 'attention' | 'blocked';

interface LoopItem {
  id: string;
  name: string;
  icon?: string;
  score: number;           // 0-100 health score
  status?: HealthStatus;   // Override auto-calculated status
  taskCount?: number;      // Number of tasks/items inside
}

interface LoopVisualizationProps {
  /** The parent context (outer ring) */
  parentLoop: LoopItem;
  /** Child items (inner spheres) - max 8 recommended */
  childLoops: LoopItem[];
  /** Called when a child sphere is tapped */
  onSelectChild?: (childId: string) => void;
  /** Called when the outer ring is tapped */
  onSelectParent?: () => void;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function getStatusFromScore(score: number): HealthStatus {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'progress';
  if (score >= 20) return 'attention';
  return 'blocked';
}

function getStatusColor(status: HealthStatus): string {
  const colors = {
    healthy: 'var(--theme-status-green, #10b981)',
    progress: 'var(--theme-status-blue, #3B82F6)',
    attention: 'var(--theme-status-amber, #f59e0b)',
    blocked: 'var(--theme-status-red, #ef4444)',
  };
  return colors[status];
}

// Calculate circular positions for N items
function getCircularPosition(index: number, total: number, radiusPercent: number = 32) {
  const angle = -Math.PI / 2 + (index / total) * 2 * Math.PI;
  const x = 50 + Math.cos(angle) * radiusPercent;
  const y = 50 + Math.sin(angle) * radiusPercent;
  return { x, y };
}

// ============================================================================
// Sub-Components
// ============================================================================

interface OuterRingProps {
  loop: LoopItem;
  isHovered: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onHover: (hovered: boolean) => void;
}

function OuterRing({ loop, isHovered, isSelected, onClick, onHover }: OuterRingProps) {
  const status = loop.status || getStatusFromScore(loop.score);
  const color = getStatusColor(status);

  return (
    <div
      className={cn(
        'absolute inset-0 cursor-pointer transition-all duration-300',
        isHovered && 'scale-[1.02]'
      )}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <defs>
          <filter id="glow-outer" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle
          cx="200"
          cy="200"
          r="195"
          fill="none"
          stroke={color}
          strokeWidth={isSelected || isHovered ? 4 : 2}
          opacity={isSelected || isHovered ? 0.8 : 0.4}
          filter={isSelected || isHovered ? 'url(#glow-outer)' : undefined}
          className="transition-all duration-300"
        />

        {/* Inner dashed ring */}
        <circle
          cx="200"
          cy="200"
          r="185"
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="8 4"
          opacity="0.2"
        />

        {/* Label at top */}
        <text
          x="200"
          y="28"
          textAnchor="middle"
          fontSize="14"
          fill={color}
          opacity={isSelected || isHovered ? 1 : 0.7}
          fontWeight="500"
          className="select-none"
        >
          {loop.icon && `${loop.icon} `}{loop.name}
        </text>

        {/* Score at bottom */}
        <text
          x="200"
          y="382"
          textAnchor="middle"
          fontSize="13"
          fill={color}
          opacity={isSelected || isHovered ? 0.9 : 0.5}
          className="select-none"
        >
          {loop.score}% Health
        </text>
      </svg>
    </div>
  );
}

interface InnerSphereProps {
  loop: LoopItem;
  position: { x: number; y: number };
  isHovered: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onHover: (hovered: boolean) => void;
}

function InnerSphere({ loop, position, isHovered, isSelected, onClick, onHover }: InnerSphereProps) {
  const status = loop.status || getStatusFromScore(loop.score);
  const color = getStatusColor(status);

  return (
    <div
      className={cn(
        'absolute flex flex-col items-center gap-2 cursor-pointer transition-all duration-300',
        'transform -translate-x-1/2 -translate-y-1/2',
        isHovered && 'scale-110 z-10',
        isSelected && 'scale-115 z-10'
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Sphere SVG */}
      <svg viewBox="0 0 120 120" className="w-20 h-20 md:w-24 md:h-24">
        <defs>
          <filter id={`glow-${loop.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id={`grad-${loop.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.7"/>
          </linearGradient>
        </defs>

        {/* Main sphere circle */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill={`url(#grad-${loop.id})`}
          stroke={color}
          strokeWidth={isSelected || isHovered ? 3 : 2}
          filter={isSelected || isHovered ? `url(#glow-${loop.id})` : undefined}
          className="transition-all duration-300"
        />

        {/* Highlight gradient overlay */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="url(#sphereHighlight)"
          opacity="0.6"
        />

        {/* Icon in center (if provided) */}
        {loop.icon && (
          <text
            x="60"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            opacity="0.3"
            fill="white"
            className="select-none"
          >
            {loop.icon}
          </text>
        )}

        {/* Score number */}
        <text
          x="60"
          y={loop.icon ? "75" : "65"}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="300"
          fill="white"
          className="select-none"
        >
          {loop.score}
        </text>
      </svg>

      {/* Label below sphere */}
      <span className="text-xs md:text-sm text-slate-600 font-medium text-center max-w-[80px] truncate">
        {loop.name}
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LoopVisualization({
  parentLoop,
  childLoops,
  onSelectChild,
  onSelectParent,
  className,
}: LoopVisualizationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleChildClick = useCallback((childId: string) => {
    setSelectedId(childId);
    onSelectChild?.(childId);
  }, [onSelectChild]);

  const handleParentClick = useCallback(() => {
    setSelectedId(null);
    onSelectParent?.();
  }, [onSelectParent]);

  return (
    <div className={cn('relative w-full aspect-square max-w-[500px] mx-auto', className)}>
      {/* Global SVG definitions */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="sphereHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
            <stop offset="50%" stopColor="white" stopOpacity="0"/>
            <stop offset="100%" stopColor="black" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>

      {/* Outer ring (parent context) */}
      <OuterRing
        loop={parentLoop}
        isHovered={hoveredId === 'parent'}
        isSelected={selectedId === null}
        onClick={handleParentClick}
        onHover={(h) => setHoveredId(h ? 'parent' : null)}
      />

      {/* Inner spheres (children) */}
      {childLoops.map((child, index) => {
        const position = getCircularPosition(index, childLoops.length);
        return (
          <InnerSphere
            key={child.id}
            loop={child}
            position={position}
            isHovered={hoveredId === child.id}
            isSelected={selectedId === child.id}
            onClick={() => handleChildClick(child.id)}
            onHover={(h) => setHoveredId(h ? child.id : null)}
          />
        );
      })}

      {/* Empty state */}
      {childLoops.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-400 text-sm">No items</p>
        </div>
      )}
    </div>
  );
}

export default LoopVisualization;
