import type { LoopStatus } from '../../types/database';
import { SphereSVG } from './SphereSVG';

export interface SphereProps {
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
  /** Renderer type - for future extensibility (currently only SVG) */
  renderer?: 'svg';
}

/**
 * Sphere - Main sphere component that wraps the renderer
 * Currently uses SphereSVG, but designed for future renderer options
 */
export function Sphere({
  score,
  size = 120,
  label,
  showScore = true,
  status,
  onClick,
  animate = true,
  className = '',
  renderer = 'svg',
}: SphereProps) {
  // Currently only SVG renderer is supported
  // Future: could switch between SVG, Canvas, or WebGL renderers
  if (renderer === 'svg') {
    return (
      <SphereSVG
        score={score}
        size={size}
        label={label}
        showScore={showScore}
        status={status}
        onClick={onClick}
        animate={animate}
        className={className}
      />
    );
  }

  // Default fallback to SVG
  return (
    <SphereSVG
      score={score}
      size={size}
      label={label}
      showScore={showScore}
      status={status}
      onClick={onClick}
      animate={animate}
      className={className}
    />
  );
}

export default Sphere;
