/**
 * Client Floor Plan Component
 * Read-only floor plan viewer for client portal
 *
 * Key differences from contractor floor plan:
 * - Tap shows info only (name, status, last update)
 * - NO status change buttons
 * - NO note/photo actions
 * - Clean, simple UI focused on viewing progress
 *
 * CRITICAL PATTERN: Elements don't store status — they get it from linked loop.
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { FloorPlan, FloorPlanElement, Loop, LoopStatus } from '../../types/database';
import { statusColors } from '../ui/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface ClientFloorPlanProps {
  /** Floor plan data with SVG content */
  floorPlan: FloorPlan;
  /** Floor plan elements (linked to loops) */
  elements: FloorPlanElement[];
  /** Map of loop_id to Loop data */
  loops: Map<string, Loop>;
  /** Additional CSS classes */
  className?: string;
}

interface ElementInfo {
  element: FloorPlanElement;
  loop: Loop;
  status: LoopStatus;
  color: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getElementStatus(element: FloorPlanElement, loops: Map<string, Loop>): LoopStatus {
  const linkedLoop = loops.get(element.loop_id);
  return linkedLoop?.status || 'not_started';
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function parseSvgContent(svgContent: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(svgContent, 'image/svg+xml');
}

function serializeSvg(doc: Document): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

const statusLabels: Record<LoopStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Delayed',  // Client-friendly label
  complete: 'Complete',
};

// ============================================================================
// INFO MODAL COMPONENT
// ============================================================================

interface ElementInfoModalProps {
  info: ElementInfo | null;
  onClose: () => void;
}

function ElementInfoModal({ info, onClose }: ElementInfoModalProps) {
  if (!info) return null;

  const { element, loop, status, color } = info;
  const lastUpdate = loop.updated_at
    ? new Date(loop.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span
            className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {element.label || loop.name}
            </h3>
            {element.cost_code && (
              <p className="text-sm text-gray-500 font-mono">{element.cost_code}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <span
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: hexToRgba(color, 0.2),
                color: color,
              }}
            >
              {statusLabels[status]}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-600">Last Updated</span>
            <span className="text-sm text-gray-900">{lastUpdate}</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors min-h-[48px]"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ClientFloorPlan({
  floorPlan,
  elements,
  loops,
  className = '',
}: ClientFloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);

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

  // Apply status colors to SVG elements
  const colorizedSvgString = useMemo(() => {
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

    // Apply colors to each element
    elements.forEach((el) => {
      const svgElement = svgClone.getElementById(el.svg_element_id);
      if (svgElement) {
        const status = getElementStatus(el, loops);
        const color = statusColors[status];

        svgElement.setAttribute('stroke', color);
        svgElement.setAttribute('fill', hexToRgba(color, 0.2));
        svgElement.setAttribute('data-hooomz-element', el.id);
        svgElement.setAttribute('data-element-id', el.id);

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
  }, [svgDoc, elements, loops, floorPlan.svg_content]);

  // Handle click on SVG element - shows info modal only (READ-ONLY)
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as Element;
      const elementWithId = target.closest('[data-element-id]');
      if (!elementWithId) return;

      const elementId = elementWithId.getAttribute('data-element-id');
      if (!elementId) return;

      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      const loop = loops.get(element.loop_id);
      if (!loop) return;

      const status = getElementStatus(element, loops);
      const color = statusColors[status];

      setSelectedElement({ element, loop, status, color });
    },
    [elements, loops]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-100 overflow-hidden ${className}`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        limitToBounds
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: 'reset' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
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

            {/* Status Legend */}
            <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">Progress</div>
              <div className="flex flex-col gap-1.5">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-4 h-2 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600">
                      {statusLabels[status as LoopStatus]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tap instruction */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg px-3 py-2 text-xs text-gray-600">
              Tap an element to see details
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

      {/* Element Info Modal (READ-ONLY - no status change) */}
      <ElementInfoModal
        info={selectedElement}
        onClose={() => setSelectedElement(null)}
      />
    </div>
  );
}

export default ClientFloorPlan;
