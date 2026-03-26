/**
 * Interactive Floor Plan Component
 * Displays SVG floor plan with status-colored elements and pan/zoom support
 *
 * CRITICAL PATTERN: Elements don't store status — they get it from linked loop.
 *
 * // CORRECT
 * const status = loops.get(element.loop_id)?.status;
 *
 * // WRONG — NEVER DO THIS
 * element.status = 'complete';
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { FloorPlan, FloorPlanElement, Loop, LoopStatus } from '../../types/database';
import { statusColors } from '../ui/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface InteractiveFloorPlanProps {
  /** Floor plan data with SVG content */
  floorPlan: FloorPlan;
  /** Floor plan elements (linked to loops) */
  elements: FloorPlanElement[];
  /** Map of loop_id to Loop data */
  loops: Map<string, Loop>;
  /** Callback when element is tapped */
  onElementTap: (element: FloorPlanElement, loop: Loop) => void;
  /** Show element labels */
  showLabels?: boolean;
  /** Filter to show only certain trades/types */
  tradeFilter?: string[];
  /** Filter to show only certain statuses */
  statusFilter?: LoopStatus[];
  /** Minimum scale for zoom */
  minScale?: number;
  /** Maximum scale for zoom */
  maxScale?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get element status from linked loop
 * THIS IS THE CORRECT PATTERN — elements don't store status
 */
function getElementStatus(element: FloorPlanElement, loops: Map<string, Loop>): LoopStatus {
  const linkedLoop = loops.get(element.loop_id);
  return linkedLoop?.status || 'not_started';
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Parse SVG content string to Document
 */
function parseSvgContent(svgContent: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(svgContent, 'image/svg+xml');
}

/**
 * Serialize Document back to string
 */
function serializeSvg(doc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InteractiveFloorPlan({
  floorPlan,
  elements,
  loops,
  onElementTap,
  showLabels = true,
  tradeFilter,
  statusFilter,
  minScale = 0.5,
  maxScale = 4,
  className = '',
}: InteractiveFloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  // Parse SVG content
  const svgDoc = useMemo(() => {
    return parseSvgContent(floorPlan.svg_content);
  }, [floorPlan.svg_content]);

  // Extract viewBox dimensions
  useEffect(() => {
    const svg = svgDoc.querySelector('svg');
    if (svg) {
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ').map(Number);
        setSvgSize({ width, height });
      } else {
        const width = parseFloat(svg.getAttribute('width') || '500');
        const height = parseFloat(svg.getAttribute('height') || '400');
        setSvgSize({ width, height });
      }
    }
  }, [svgDoc]);

  // Filter visible elements based on trade and status filters
  const visibleElements = useMemo(() => {
    return elements.filter((el) => {
      const loop = loops.get(el.loop_id);
      if (!loop) return false;

      // Apply trade filter (check loop type or cost_code)
      if (tradeFilter && tradeFilter.length > 0) {
        const matchesTrade = tradeFilter.some(
          (t) => loop.type === t || el.cost_code?.includes(t)
        );
        if (!matchesTrade) return false;
      }

      // Apply status filter
      if (statusFilter && statusFilter.length > 0) {
        if (!statusFilter.includes(loop.status)) return false;
      }

      return true;
    });
  }, [elements, loops, tradeFilter, statusFilter]);

  // Apply status colors to SVG elements
  const colorizedSvgString = useMemo(() => {
    // Clone the document to avoid mutating the original
    const svgClone = svgDoc.cloneNode(true) as Document;
    const svg = svgClone.querySelector('svg');

    if (!svg) return floorPlan.svg_content;

    // Add cursor pointer and transition styles
    const style = svgClone.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      [data-hooomz-element] {
        cursor: pointer;
        transition: stroke 0.2s ease, fill 0.2s ease, stroke-width 0.2s ease;
      }
      [data-hooomz-element]:hover {
        stroke-width: inherit;
        filter: brightness(1.1);
      }
    `;
    svg.insertBefore(style, svg.firstChild);

    // Apply colors to each visible element
    visibleElements.forEach((el) => {
      const svgElement = svgClone.getElementById(el.svg_element_id);
      if (svgElement) {
        // Get status from linked loop (CORRECT PATTERN)
        const status = getElementStatus(el, loops);
        const color = statusColors[status];

        // Apply stroke color
        svgElement.setAttribute('stroke', color);

        // Apply 20% opacity fill
        svgElement.setAttribute('fill', hexToRgba(color, 0.2));

        // Mark as interactive element
        svgElement.setAttribute('data-hooomz-element', el.id);
        svgElement.setAttribute('data-element-id', el.id);

        // Ensure good stroke width for visibility
        const currentStrokeWidth = svgElement.getAttribute('stroke-width');
        if (!currentStrokeWidth || parseFloat(currentStrokeWidth) < 2) {
          svgElement.setAttribute('stroke-width', '3');
        }
      }
    });

    // Dim non-tracked elements
    const allElements = svg.querySelectorAll('path, line, rect, polygon, polyline');
    allElements.forEach((el) => {
      if (!el.hasAttribute('data-hooomz-element')) {
        const currentOpacity = el.getAttribute('opacity');
        if (!currentOpacity) {
          el.setAttribute('opacity', '0.3');
        }
      }
    });

    return serializeSvg(svgClone);
  }, [svgDoc, visibleElements, loops, floorPlan.svg_content]);

  // Handle click on SVG element
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element;

      // Find the element with data-element-id (might be the target or a parent)
      let elementWithId = target.closest('[data-element-id]');
      if (!elementWithId) return;

      const elementId = elementWithId.getAttribute('data-element-id');
      if (!elementId) return;

      // Find matching element and loop
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      const loop = loops.get(element.loop_id);
      if (!loop) return;

      onElementTap(element, loop);
    },
    [elements, loops, onElementTap]
  );

  // Build element labels for overlay
  const labelElements = useMemo(() => {
    if (!showLabels) return [];

    return visibleElements
      .filter((el) => el.bounds)
      .map((el) => {
        const loop = loops.get(el.loop_id);
        const status = getElementStatus(el, loops);
        const color = statusColors[status];
        const bounds = el.bounds!;

        return {
          id: el.id,
          label: el.label || loop?.name || 'Unknown',
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
          color,
        };
      });
  }, [visibleElements, loops, showLabels]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-100 overflow-hidden ${className}`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={minScale}
        maxScale={maxScale}
        centerOnInit
        limitToBounds
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: 'reset' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls - 44px touch targets */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="w-11 h-11 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                aria-label="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-11 h-11 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                aria-label="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-11 h-11 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                aria-label="Reset view"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">Status</div>
              <div className="flex flex-col gap-1.5">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-4 h-2 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Container */}
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <div
                onClick={handleSvgClick}
                className="floor-plan-svg"
                style={{
                  width: svgSize.width || '100%',
                  height: svgSize.height || '100%',
                }}
                dangerouslySetInnerHTML={{ __html: colorizedSvgString }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Labels Overlay - rendered outside transform for crisp text */}
      {showLabels && labelElements.length > 0 && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.8 }}
        >
          {/* Labels would need transform sync - simplified version */}
        </div>
      )}
    </div>
  );
}

export default InteractiveFloorPlan;
