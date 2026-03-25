'use client';

/**
 * ThreeAxisFilters
 *
 * Filter controls for the Three-Axis Model:
 * - Work Category: Flooring, Paint, Finish Carpentry, Tile, Drywall, Overhead
 * - Stage: Demo, Prime & Prep, Finish, Punch List, Closeout
 * - Location: Kitchen, Master Bath, Living Room, etc.
 *
 * Same task appears in all three views - these are orthogonal filters.
 *
 * Mobile: Opens bottom sheet for selection (better for work gloves)
 * Desktop: Dropdown menus
 *
 * Follows Hooomz UI spec:
 * - 44px minimum touch targets (work gloves)
 * - Light, warm aesthetic
 * - Progressive disclosure
 */

import { useCallback, useState, useRef, useEffect } from 'react';

// Types for Three-Axis filter values
export interface ThreeAxisFilterValues {
  workCategory: string | null;
  stage: string | null;
  location: string | null;
}

export interface ThreeAxisOption {
  code: string;
  label: string;
}

interface ThreeAxisFiltersProps {
  /** Available work categories for this project */
  workCategories: ThreeAxisOption[];
  /** Available stages for this project */
  stages: ThreeAxisOption[];
  /** Available locations for this project */
  locations: ThreeAxisOption[];
  /** Current filter values */
  values: ThreeAxisFilterValues;
  /** Callback when filters change */
  onChange: (values: ThreeAxisFilterValues) => void;
  /** Optional class name */
  className?: string;
}

export function ThreeAxisFilters({
  workCategories,
  stages,
  locations,
  values,
  onChange,
  className = '',
}: ThreeAxisFiltersProps) {
  const handleCategoryChange = useCallback(
    (code: string | null) => {
      onChange({ ...values, workCategory: code });
    },
    [values, onChange]
  );

  const handleStageChange = useCallback(
    (code: string | null) => {
      onChange({ ...values, stage: code });
    },
    [values, onChange]
  );

  const handleLocationChange = useCallback(
    (code: string | null) => {
      onChange({ ...values, location: code });
    },
    [values, onChange]
  );

  // Count active filters
  const activeCount = [values.workCategory, values.stage, values.location].filter(Boolean).length;

  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 ${className}`}>
      {/* Work Category Filter */}
      <FilterButton
        icon="🔧"
        label="Category"
        options={workCategories}
        value={values.workCategory}
        onChange={handleCategoryChange}
        placeholder="All Categories"
      />

      {/* Stage Filter */}
      <FilterButton
        icon="📐"
        label="Stage"
        options={stages}
        value={values.stage}
        onChange={handleStageChange}
        placeholder="All Stages"
      />

      {/* Location Filter */}
      <FilterButton
        icon="📍"
        label="Location"
        options={locations}
        value={values.location}
        onChange={handleLocationChange}
        placeholder="All Locations"
      />

      {/* Clear All Button (only when filters active) */}
      {activeCount > 0 && (
        <button
          onClick={() =>
            onChange({ workCategory: null, stage: null, location: null })
          }
          className="
            flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium
            whitespace-nowrap min-h-[44px]
            text-coral border border-coral/30
            hover:bg-coral/10 transition-colors
          "
        >
          <span>Clear ({activeCount})</span>
        </button>
      )}
    </div>
  );
}

/**
 * Filter button that opens a bottom sheet on mobile or dropdown on desktop
 */
interface FilterButtonProps {
  icon: string;
  label: string;
  options: ThreeAxisOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
}

function FilterButton({
  icon,
  label,
  options,
  value,
  onChange,
  placeholder,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside (for desktop dropdown)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Find current label
  const currentOption = options.find((opt) => opt.code === value);
  const displayLabel = currentOption ? currentOption.label : placeholder;
  const isActive = value !== null;

  const handleSelect = useCallback(
    (code: string | null) => {
      onChange(code);
      setIsOpen(false);
    },
    [onChange]
  );

  // Disabled state when no options
  if (options.length === 0) {
    return (
      <div
        className="
          flex items-center gap-2 px-3 py-2 rounded-full text-sm
          whitespace-nowrap min-h-[44px]
          bg-[var(--surface)] text-[var(--muted)] cursor-not-allowed
        "
      >
        <span className="text-base" role="img" aria-hidden>
          {icon}
        </span>
        <span>{placeholder}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
          whitespace-nowrap transition-all duration-200 ease-out
          min-h-[44px]
          ${
            isActive
              ? 'bg-[var(--accent)] text-white shadow-sm'
              : 'bg-white text-[var(--mid)] border border-[var(--border)] hover:border-[var(--accent-border)]'
          }
        `}
      >
        <span className="text-base" role="img" aria-hidden>
          {icon}
        </span>
        <span className="max-w-[100px] truncate">{displayLabel}</span>
        <span
          className={`
            text-xs transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        >
          ▼
        </span>
      </button>

      {/* Bottom Sheet (mobile) / Dropdown (desktop) */}
      {isOpen && (
        <>
          {/* Backdrop for bottom sheet */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Options container */}
          <div
            role="listbox"
            aria-label={label}
            className="
              fixed bottom-0 left-0 right-0 z-50
              md:absolute md:bottom-auto md:top-full md:left-0 md:right-auto
              md:mt-1 md:min-w-[200px]
              bg-white rounded-t-2xl md:rounded-xl shadow-lg
              max-h-[60vh] md:max-h-[320px] overflow-y-auto
              animate-in slide-in-from-bottom-4 md:slide-in-from-top-2 md:fade-in duration-200
            "
          >
            {/* Handle bar (mobile only) */}
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="font-medium text-[var(--charcoal)]">{label}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--mid)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* All Option */}
            <button
              role="option"
              aria-selected={value === null}
              onClick={() => handleSelect(null)}
              className={`
                w-full text-left px-4 py-4 text-sm
                min-h-[52px] flex items-center gap-3
                transition-colors
                ${
                  value === null
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
                    : 'text-[var(--mid)] hover:bg-[var(--surface)] active:bg-[var(--surface)]'
                }
              `}
            >
              <span className="w-6 text-center">
                {value === null && <span className="text-[var(--accent)]">✓</span>}
              </span>
              <span>{placeholder}</span>
            </button>

            {/* Divider */}
            <div className="h-px bg-[var(--border)]" />

            {/* Options */}
            {options.map((option) => (
              <button
                key={option.code}
                role="option"
                aria-selected={value === option.code}
                onClick={() => handleSelect(option.code)}
                className={`
                  w-full text-left px-4 py-4 text-sm
                  min-h-[52px] flex items-center gap-3
                  transition-colors
                  ${
                    value === option.code
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
                      : 'text-[var(--mid)] hover:bg-[var(--surface)] active:bg-[var(--surface)]'
                  }
                `}
              >
                <span className="w-6 text-center">
                  {value === option.code && <span className="text-[var(--accent)]">✓</span>}
                </span>
                <span>{option.label}</span>
              </button>
            ))}

            {/* Bottom safe area padding (mobile) */}
            <div className="h-8 md:hidden" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact version with chips for active filters only
 */
interface ThreeAxisChipsProps {
  values: ThreeAxisFilterValues;
  workCategories: ThreeAxisOption[];
  stages: ThreeAxisOption[];
  locations: ThreeAxisOption[];
  onClear: (axis: keyof ThreeAxisFilterValues) => void;
}

export function ThreeAxisChips({
  values,
  workCategories,
  stages,
  locations,
  onClear,
}: ThreeAxisChipsProps) {
  const chips: Array<{ key: keyof ThreeAxisFilterValues; label: string; icon: string }> = [];

  if (values.workCategory) {
    const option = workCategories.find((o) => o.code === values.workCategory);
    if (option) {
      chips.push({ key: 'workCategory', label: option.label, icon: '🔧' });
    }
  }

  if (values.stage) {
    const option = stages.find((o) => o.code === values.stage);
    if (option) {
      chips.push({ key: 'stage', label: option.label, icon: '📐' });
    }
  }

  if (values.location) {
    const option = locations.find((o) => o.code === values.location);
    if (option) {
      chips.push({ key: 'location', label: option.label, icon: '📍' });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            bg-[var(--accent-bg)] text-[var(--accent)] text-sm rounded-full
          "
        >
          <span role="img" aria-hidden>{chip.icon}</span>
          <span>{chip.label}</span>
          <button
            onClick={() => onClear(chip.key)}
            className="ml-1 hover:text-[var(--accent)] transition-colors min-w-[24px] min-h-[24px]"
            aria-label={`Clear ${chip.label} filter`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * Clickable breadcrumb that triggers filter by axis
 */
interface ClickableBreadcrumbProps {
  /** Work category code */
  workCategoryCode?: string | null;
  /** Work category label */
  workCategoryLabel?: string;
  /** Stage code */
  stageCode?: string | null;
  /** Stage label */
  stageLabel?: string;
  /** Location ID */
  locationId?: string | null;
  /** Location label */
  locationLabel?: string;
  /** Callback when a breadcrumb segment is clicked */
  onFilterClick?: (axis: keyof ThreeAxisFilterValues, code: string) => void;
  /** Whether segments are clickable */
  interactive?: boolean;
}

export function ClickableBreadcrumb({
  workCategoryCode,
  workCategoryLabel,
  stageCode,
  stageLabel,
  locationId,
  locationLabel,
  onFilterClick,
  interactive = true,
}: ClickableBreadcrumbProps) {
  const segments: Array<{
    axis: keyof ThreeAxisFilterValues;
    code: string;
    label: string;
    icon: string;
  }> = [];

  if (locationId && locationLabel) {
    segments.push({
      axis: 'location',
      code: locationId,
      label: locationLabel,
      icon: '📍',
    });
  }

  if (workCategoryCode && workCategoryLabel) {
    segments.push({
      axis: 'workCategory',
      code: workCategoryCode,
      label: workCategoryLabel,
      icon: '🔧',
    });
  }

  if (stageCode && stageLabel) {
    segments.push({
      axis: 'stage',
      code: stageCode,
      label: stageLabel,
      icon: '📐',
    });
  }

  if (segments.length === 0) return null;

  return (
    <span className="text-xs text-[var(--muted)] flex items-center gap-1 truncate">
      {segments.map((segment, index) => (
        <span key={segment.axis} className="flex items-center">
          {index > 0 && <span className="mx-1 text-[var(--border)]">›</span>}
          {interactive && onFilterClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFilterClick(segment.axis, segment.code);
              }}
              className="hover:text-[var(--accent)] hover:underline transition-colors"
              aria-label={`Filter by ${segment.label}`}
            >
              {segment.label}
            </button>
          ) : (
            <span>{segment.label}</span>
          )}
        </span>
      ))}
    </span>
  );
}
