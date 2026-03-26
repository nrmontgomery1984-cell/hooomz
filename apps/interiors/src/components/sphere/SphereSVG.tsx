import { useCallback, useId } from 'react';
import type { LoopStatus } from '../../types/database';
import { statusColors, scoreToColor, scoreToGlowIntensity } from '../ui/colors';

export interface SphereSVGProps {
  /** Health score from 0-100, undefined/null for loading state */
  score?: number | null;
  /** Size in pixels (default: 120) */
  size?: number;
  /** Optional label below the sphere */
  label?: string;
  /** Show score number on sphere (default: true) */
  showScore?: boolean;
  /** Override color based on status instead of score */
  status?: LoopStatus;
  /** Click handler */
  onClick?: () => void;
  /** Enable breathing animation (default: true) */
  animate?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Get glow CSS based on color and intensity
 */
function getGlowFilter(color: string, intensity: 'strong' | 'medium' | 'low' | 'pulsing'): string {
  const blurs: Record<typeof intensity, string> = {
    strong: `drop-shadow(0 0 12px ${color}80) drop-shadow(0 0 20px ${color}40)`,
    medium: `drop-shadow(0 0 8px ${color}60) drop-shadow(0 0 14px ${color}30)`,
    low: `drop-shadow(0 0 6px ${color}40)`,
    pulsing: `drop-shadow(0 0 10px ${color}70)`,
  };
  return blurs[intensity];
}

// CSS keyframes injected once
const KEYFRAMES_ID = 'sphere-keyframes';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes sphere-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.015); }
    }
    @keyframes sphere-loading {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    @keyframes sphere-blocked-glow {
      0%, 100% { filter: var(--sphere-glow-base); }
      50% { filter: var(--sphere-glow-pulse); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * SphereSVG - Pure SVG sphere component with radial gradient
 * Creates a "Pixar meets Google Material" aesthetic sphere
 */
export function SphereSVG({
  score,
  size = 120,
  label,
  showScore = true,
  status,
  onClick,
  animate = true,
  className = '',
}: SphereSVGProps) {
  // Ensure keyframes are injected
  ensureKeyframes();

  // Use React's useId for stable, unique IDs
  const instanceId = useId();
  const gradientId = `sphere-gradient-${instanceId}`;
  const shadowGradientId = `sphere-shadow-${instanceId}`;

  // Loading state: score is undefined or null
  const isLoading = score === undefined || score === null;
  const displayScore = isLoading ? 0 : score;

  // Determine color based on loading, status override, or score
  const baseColor = isLoading
    ? '#9CA3AF' // Grey for loading
    : status
      ? statusColors[status]
      : scoreToColor(displayScore);

  const glowIntensity = isLoading
    ? 'low'
    : status === 'blocked'
      ? 'pulsing'
      : status
        ? 'medium'
        : scoreToGlowIntensity(displayScore);

  // Create gradient colors for 3D effect
  const highlightColor = lightenColor(baseColor, 0.4);
  const midColor = lightenColor(baseColor, 0.15);

  // Calculate dimensions
  const sphereRadius = 42;
  const sphereCenterX = 50;
  const sphereCenterY = 46;

  // Glow filter
  const glowFilter = getGlowFilter(baseColor, glowIntensity);

  // For blocked pulsing, we need a stronger glow for the pulse
  const glowFilterPulse = status === 'blocked'
    ? getGlowFilter(baseColor, 'strong')
    : glowFilter;

  // Interactive styles
  const isInteractive = !!onClick;

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Determine if we should animate
  const shouldAnimate = animate && !prefersReducedMotion;
  const isBlocked = status === 'blocked';

  // Build aria-label
  const ariaLabel = isLoading
    ? `Loading${label ? `: ${label}` : ''}`
    : status
      ? `${label || 'Item'}: ${status.replace('_', ' ')}`
      : `${label || 'Health score'}: ${Math.round(displayScore)}%`;

  // Build animation style
  const getAnimationStyle = (): React.CSSProperties => {
    if (isLoading) {
      return {
        animation: 'sphere-loading 1.5s ease-in-out infinite',
        filter: glowFilter,
      };
    }

    if (isBlocked && shouldAnimate) {
      return {
        '--sphere-glow-base': glowFilter,
        '--sphere-glow-pulse': glowFilterPulse,
        animation: 'sphere-blocked-glow 1.5s ease-in-out infinite',
      } as React.CSSProperties;
    }

    return {
      filter: glowFilter,
    };
  };

  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      style={{ width: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={isInteractive ? 0 : undefined}
        className={`
          transition-all duration-200 ease-out
          ${isInteractive ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full' : ''}
          ${shouldAnimate && !isLoading && !isBlocked ? 'hover:[animation-play-state:paused] active:[animation-play-state:paused]' : ''}
        `}
        style={{
          ...getAnimationStyle(),
          animation: shouldAnimate && !isLoading && !isBlocked
            ? 'sphere-breathe 4s ease-in-out infinite'
            : getAnimationStyle().animation,
          transformOrigin: 'center center',
        }}
        role={isInteractive ? 'button' : 'img'}
        aria-label={ariaLabel}
        aria-busy={isLoading}
      >
        <defs>
          {/* Radial gradient for 3D sphere effect */}
          <radialGradient
            id={gradientId}
            cx="35%"
            cy="35%"
            r="60%"
            fx="30%"
            fy="30%"
          >
            <stop offset="0%" stopColor={highlightColor} />
            <stop offset="40%" stopColor={midColor} />
            <stop offset="100%" stopColor={baseColor} />
          </radialGradient>

          {/* Shadow gradient */}
          <radialGradient id={shadowGradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow ellipse beneath sphere */}
        <ellipse
          cx={sphereCenterX}
          cy={92}
          rx={30}
          ry={6}
          fill={`url(#${shadowGradientId})`}
        />

        {/* Main sphere */}
        <circle
          cx={sphereCenterX}
          cy={sphereCenterY}
          r={sphereRadius}
          fill={`url(#${gradientId})`}
        />

        {/* Subtle rim highlight for extra depth */}
        <circle
          cx={sphereCenterX}
          cy={sphereCenterY}
          r={sphereRadius}
          fill="none"
          stroke="white"
          strokeWidth="0.5"
          strokeOpacity="0.1"
        />

        {/* Score number - hidden during loading */}
        {showScore && !isLoading && (
          <text
            x={sphereCenterX}
            y={sphereCenterY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize={sphereRadius * 0.8}
            fontWeight="700"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {Math.round(displayScore)}
          </text>
        )}

        {/* Loading indicator - three dots */}
        {isLoading && showScore && (
          <text
            x={sphereCenterX}
            y={sphereCenterY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize={sphereRadius * 0.5}
            fontWeight="700"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            •••
          </text>
        )}
      </svg>

      {/* Label below sphere */}
      {label && (
        <span
          className="mt-2 text-sm text-gray-600 font-medium text-center truncate w-full"
          style={{ maxWidth: size }}
          title={label}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default SphereSVG;
