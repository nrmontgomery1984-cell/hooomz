'use client';

/**
 * Discovery Wizard — /discovery/[projectId]
 *
 * 2-step flow:
 *   Step 1: Property Overview — physical home details
 *   Step 2: Design Preferences — aesthetic direction
 *
 * Auto-saves to IndexedDB every 500ms. Fires activity events on completion.
 * Mobile-first: pill grids (not dropdowns), 44px touch targets, minimal typing.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Home, Palette } from 'lucide-react';
import { useLocalProject, useLocalCustomer } from '@/lib/hooks/useLocalData';
import {
  useDiscoveryDraft,
  useCreateDiscoveryDraft,
  useCompleteDiscovery,
  useDiscoveryAutoSave,
} from '@/lib/hooks/useDiscoveryData';
import {
  EMPTY_PROPERTY,
  EMPTY_PREFERENCES,
} from '@/lib/types/discovery.types';
import type {
  PropertyData,
  DesignPreferences,
  HomeType,
  HomeAge,
  Storeys,
  ParkingType,
  OccupancyStatus,
  DesignStyle,
  ColorDirection,
  FloorLook,
  TrimStyle,
  DesignPriority,
} from '@/lib/types/discovery.types';

// ============================================================================
// Constants — pill grid options
// ============================================================================

const HOME_TYPES: { value: HomeType; label: string }[] = [
  { value: 'detached', label: 'Detached' },
  { value: 'semi', label: 'Semi-Detached' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'other', label: 'Other' },
];

const HOME_AGES: { value: HomeAge; label: string }[] = [
  { value: 'new', label: 'New Build' },
  { value: '1-10', label: '1-10 yr' },
  { value: '10-25', label: '10-25 yr' },
  { value: '25-50', label: '25-50 yr' },
  { value: '50+', label: '50+ yr' },
  { value: 'unknown', label: 'Not Sure' },
];

const STOREY_OPTIONS: { value: Storeys; label: string }[] = [
  { value: 1, label: '1 Storey' },
  { value: 1.5, label: '1.5 Storey' },
  { value: 2, label: '2 Storey' },
  { value: 3, label: '3 Storey' },
];

const PARKING_OPTIONS: { value: ParkingType; label: string }[] = [
  { value: 'driveway', label: 'Driveway' },
  { value: 'garage', label: 'Garage' },
  { value: 'street', label: 'Street' },
  { value: 'none', label: 'None' },
];

const OCCUPANCY_OPTIONS: { value: OccupancyStatus; label: string }[] = [
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'rental_occupied', label: 'Rental (Occupied)' },
  { value: 'rental_vacant', label: 'Rental (Vacant)' },
];

const STYLE_OPTIONS: { value: DesignStyle; label: string }[] = [
  { value: 'modern', label: 'Modern' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'transitional', label: 'Transitional' },
  { value: 'farmhouse', label: 'Farmhouse' },
  { value: 'coastal', label: 'Coastal' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'not_sure', label: 'Not Sure' },
];

const COLOR_OPTIONS: { value: ColorDirection; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'bold', label: 'Bold' },
  { value: 'not_sure', label: 'Not Sure' },
];

const FLOOR_LOOK_OPTIONS: { value: FloorLook; label: string }[] = [
  { value: 'warm_wood', label: 'Warm Wood' },
  { value: 'cool_gray', label: 'Cool Gray' },
  { value: 'natural', label: 'Natural' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'not_sure', label: 'Not Sure' },
];

const TRIM_STYLE_OPTIONS: { value: TrimStyle; label: string }[] = [
  { value: 'modern_clean', label: 'Modern / Clean' },
  { value: 'traditional_profile', label: 'Traditional Profile' },
  { value: 'craftsman', label: 'Craftsman' },
  { value: 'match_existing', label: 'Match Existing' },
  { value: 'not_sure', label: 'Not Sure' },
];

const PRIORITY_OPTIONS: { value: DesignPriority; label: string }[] = [
  { value: 'durability', label: 'Durability' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'budget', label: 'Budget' },
  { value: 'speed', label: 'Speed' },
  { value: 'low_maintenance', label: 'Low Maintenance' },
  { value: 'pet_friendly', label: 'Pet Friendly' },
  { value: 'resale', label: 'Resale Value' },
];

const MAX_PRIORITIES = 3;

// ============================================================================
// PillGrid — reusable inline selection component
// ============================================================================

function PillGrid<T extends string | number>({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="min-h-[44px] px-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: isSelected ? '#F0FDFA' : '#FFFFFF',
              color: isSelected ? '#0F766E' : '#374151',
              border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MultiPillGrid — multi-select with max constraint
// ============================================================================

function MultiPillGrid<T extends string>({
  options,
  selected,
  onChange,
  max,
  columns = 3,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
  max: number;
  columns?: number;
}) {
  const toggle = (val: T) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else if (selected.length < max) {
      onChange([...selected, val]);
    }
  };

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        const isDisabled = !isSelected && selected.length >= max;
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            disabled={isDisabled}
            className="min-h-[44px] px-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: isSelected ? '#F0FDFA' : '#FFFFFF',
              color: isSelected ? '#0F766E' : isDisabled ? '#9CA3AF' : '#374151',
              border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
              opacity: isDisabled ? 0.5 : 1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SectionCard — white card with label
// ============================================================================

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function DiscoveryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  // Load project + customer
  const { data: project, isLoading: projectLoading } = useLocalProject(projectId);
  const { data: customer, isLoading: customerLoading } = useLocalCustomer(
    project?.clientId
  );

  // Load or create discovery draft
  const { data: existingDraft, isLoading: draftLoading } = useDiscoveryDraft(projectId);
  const createDraft = useCreateDiscoveryDraft();
  const completeMutation = useCompleteDiscovery();

  // Form state
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyData>({ ...EMPTY_PROPERTY });
  const [preferences, setPreferences] = useState<DesignPreferences>({ ...EMPTY_PREFERENCES });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Customer name for display
  const customerName = useMemo(() => {
    if (customer) {
      return [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Customer';
    }
    return project?.name || 'Customer';
  }, [customer, project]);

  // Pre-fill address from project (intake saves it there) or fall back to customer
  useEffect(() => {
    if (draftId || existingDraft) return; // don't overwrite an existing draft

    const addr = project?.address || customer?.address;
    if (addr) {
      setProperty((prev) => ({
        ...prev,
        address: {
          street: addr.street || '',
          city: addr.city || '',
          province: addr.province || 'NB',
          postalCode: addr.postalCode || '',
        },
      }));
    }
  }, [project, customer, draftId, existingDraft]);

  // Restore existing draft
  useEffect(() => {
    if (existingDraft && !draftId) {
      setDraftId(existingDraft.id);
      setStep(existingDraft.currentStep || 1);
      setProperty({ ...EMPTY_PROPERTY, ...existingDraft.property });
      setPreferences({ ...EMPTY_PREFERENCES, ...existingDraft.preferences });
    }
  }, [existingDraft, draftId]);

  // Create draft on first interaction if none exists
  const ensureDraft = useCallback(async () => {
    if (draftId || createDraft.isPending) return;
    if (existingDraft) {
      setDraftId(existingDraft.id);
      return;
    }
    const draft = await createDraft.mutateAsync({
      projectId,
      customerName,
      initialProperty: property,
    });
    setDraftId(draft.id);
  }, [draftId, existingDraft, createDraft, projectId, customerName, property]);

  // Auto-save
  const { debouncedSave, immediateSave } = useDiscoveryAutoSave({
    draftId,
    projectId,
    currentStep: step,
    property,
    preferences,
  });

  // Trigger auto-save on data changes
  useEffect(() => {
    if (!draftId) return;
    setSaveStatus('saving');
    debouncedSave();
    const t = setTimeout(() => setSaveStatus('saved'), 600);
    return () => clearTimeout(t);
  }, [property, preferences, draftId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Property setters ──
  const updateProperty = useCallback(
    <K extends keyof PropertyData>(key: K, value: PropertyData[K]) => {
      ensureDraft();
      setProperty((prev) => ({ ...prev, [key]: value }));
    },
    [ensureDraft]
  );

  const updateAddress = useCallback(
    (field: keyof PropertyData['address'], value: string) => {
      ensureDraft();
      setProperty((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    },
    [ensureDraft]
  );

  // ── Preference setters ──
  const updatePreference = useCallback(
    <K extends keyof DesignPreferences>(key: K, value: DesignPreferences[K]) => {
      ensureDraft();
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [ensureDraft]
  );

  // ── Navigation ──
  const goNext = useCallback(() => {
    immediateSave();
    setStep(2);
  }, [immediateSave]);

  const goBack = useCallback(() => {
    immediateSave();
    setStep(1);
  }, [immediateSave]);

  const handleComplete = useCallback(async () => {
    if (!draftId) return;
    immediateSave();
    await completeMutation.mutateAsync({
      draftId,
      projectId,
      customerName,
      property,
      preferences,
    });
    router.push('/leads');
  }, [draftId, immediateSave, completeMutation, projectId, customerName, property, preferences, router]);

  // ── Loading ──
  if (projectLoading || customerLoading || draftLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0F766E' }} />
          <p className="mt-3 text-sm" style={{ color: '#6B7280' }}>Loading discovery...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>Project not found</p>
          <button
            onClick={() => router.push('/leads')}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: '#0F766E' }}
          >
            Back to Pipeline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push('/leads')}
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: '#6B7280' }}
            >
              <ArrowLeft size={16} /> Pipeline
            </button>
            <span className="text-xs font-medium" style={{ color: saveStatus === 'saved' ? '#10B981' : '#9CA3AF' }}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
            </span>
          </div>

          <p className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
            {customerName}
          </p>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            Discovery — Step {step} of 2
          </p>

          {/* Progress bar */}
          <div className="flex gap-2 mt-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="flex-1 h-1.5 rounded-full transition-colors"
                style={{ background: s <= step ? '#0F766E' : '#E5E7EB' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 ? (
          <>
            {/* Step 1 Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0FDFA' }}>
                <Home size={16} style={{ color: '#0F766E' }} />
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Property Overview</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>Tell us about the home</p>
              </div>
            </div>

            {/* Address */}
            <SectionCard label="Address">
              <input
                type="text"
                placeholder="Street address"
                value={property.address.street}
                onChange={(e) => updateAddress('street', e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-lg text-sm mb-2"
                style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={property.address.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  className="min-h-[44px] px-3 rounded-lg text-sm"
                  style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Prov"
                    value={property.address.province}
                    onChange={(e) => updateAddress('province', e.target.value)}
                    className="min-h-[44px] px-3 rounded-lg text-sm"
                    style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
                  />
                  <input
                    type="text"
                    placeholder="Postal"
                    value={property.address.postalCode}
                    onChange={(e) => updateAddress('postalCode', e.target.value)}
                    className="min-h-[44px] px-3 rounded-lg text-sm"
                    style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* Home Type */}
            <SectionCard label="Home Type">
              <PillGrid
                options={HOME_TYPES}
                value={property.homeType}
                onChange={(v) => updateProperty('homeType', v)}
                columns={3}
              />
            </SectionCard>

            {/* Home Age */}
            <SectionCard label="Approximate Age">
              <PillGrid
                options={HOME_AGES}
                value={property.homeAge}
                onChange={(v) => updateProperty('homeAge', v)}
                columns={3}
              />
            </SectionCard>

            {/* Storeys */}
            <SectionCard label="Storeys">
              <PillGrid
                options={STOREY_OPTIONS}
                value={property.storeys}
                onChange={(v) => updateProperty('storeys', v)}
                columns={4}
              />
            </SectionCard>

            {/* Total sqft */}
            <SectionCard label="Approximate Square Footage">
              <input
                type="number"
                placeholder="e.g. 1400"
                value={property.totalSqft ?? ''}
                onChange={(e) => updateProperty('totalSqft', e.target.value ? Number(e.target.value) : null)}
                className="w-full min-h-[44px] px-3 rounded-lg text-sm"
                style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
                inputMode="numeric"
              />
            </SectionCard>

            {/* Parking */}
            <SectionCard label="Parking / Access">
              <PillGrid
                options={PARKING_OPTIONS}
                value={property.parking}
                onChange={(v) => updateProperty('parking', v)}
                columns={4}
              />
            </SectionCard>

            {/* Occupancy */}
            <SectionCard label="Occupancy">
              <PillGrid
                options={OCCUPANCY_OPTIONS}
                value={property.occupancy}
                onChange={(v) => updateProperty('occupancy', v)}
                columns={2}
              />
            </SectionCard>

            {/* Pets */}
            <SectionCard label="Pets">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => updateProperty('pets', !property.pets)}
                  className="min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: property.pets ? '#F0FDFA' : '#FFFFFF',
                    color: property.pets ? '#0F766E' : '#374151',
                    border: property.pets ? '2px solid #0F766E' : '1px solid #E5E7EB',
                  }}
                >
                  {property.pets ? 'Yes — has pets' : 'No pets'}
                </button>
              </div>
              {property.pets && (
                <input
                  type="text"
                  placeholder="What kind? (e.g. 2 cats, 1 dog)"
                  value={property.petDetails}
                  onChange={(e) => updateProperty('petDetails', e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-lg text-sm"
                  style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
                />
              )}
            </SectionCard>

            {/* Access notes */}
            <SectionCard label="Access Notes">
              <textarea
                placeholder="Any access details? (gate code, locked doors, preferred entry...)"
                value={property.accessNotes}
                onChange={(e) => updateProperty('accessNotes', e.target.value)}
                rows={2}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg text-sm resize-none"
                style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
              />
            </SectionCard>

            {/* Next button */}
            <button
              onClick={goNext}
              className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2 mt-2"
              style={{ background: '#0F766E' }}
            >
              Next — Design Preferences <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            {/* Step 2 Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0FDFA' }}>
                <Palette size={16} style={{ color: '#0F766E' }} />
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Design Preferences</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>What look are you going for?</p>
              </div>
            </div>

            {/* Style */}
            <SectionCard label="Overall Style">
              <PillGrid
                options={STYLE_OPTIONS}
                value={preferences.style ?? null}
                onChange={(v) => updatePreference('style', v)}
                columns={3}
              />
            </SectionCard>

            {/* Color Direction */}
            <SectionCard label="Color Direction">
              <PillGrid
                options={COLOR_OPTIONS}
                value={preferences.colorDirection ?? null}
                onChange={(v) => updatePreference('colorDirection', v)}
                columns={3}
              />
            </SectionCard>

            {/* Floor Look */}
            <SectionCard label="Floor Look">
              <PillGrid
                options={FLOOR_LOOK_OPTIONS}
                value={preferences.floorLook ?? null}
                onChange={(v) => updatePreference('floorLook', v)}
                columns={3}
              />
            </SectionCard>

            {/* Trim Style */}
            <SectionCard label="Trim Style">
              <PillGrid
                options={TRIM_STYLE_OPTIONS}
                value={preferences.trimStyle ?? null}
                onChange={(v) => updatePreference('trimStyle', v)}
                columns={3}
              />
            </SectionCard>

            {/* Priorities */}
            <SectionCard label={`Top Priorities (pick up to ${MAX_PRIORITIES})`}>
              <MultiPillGrid
                options={PRIORITY_OPTIONS}
                selected={preferences.priorities ?? []}
                onChange={(v) => updatePreference('priorities', v)}
                max={MAX_PRIORITIES}
                columns={3}
              />
            </SectionCard>

            {/* Inspiration notes */}
            <SectionCard label="Inspiration / Notes">
              <textarea
                placeholder="Anything else? Pinterest links, magazine photos, &quot;I saw this at my friend's house&quot;..."
                value={preferences.inspirationNotes ?? ''}
                onChange={(e) => updatePreference('inspirationNotes', e.target.value)}
                rows={3}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg text-sm resize-none"
                style={{ border: '1px solid #E5E7EB', color: '#1A1A1A' }}
              />
            </SectionCard>

            {/* Navigation */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={goBack}
                className="flex-1 min-h-[52px] rounded-xl text-base font-semibold flex items-center justify-center gap-2"
                style={{ background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB' }}
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="flex-[2] min-h-[52px] rounded-xl text-base font-semibold text-white flex items-center justify-center gap-2"
                style={{
                  background: completeMutation.isPending ? '#9CA3AF' : '#0F766E',
                }}
              >
                <Check size={18} /> Complete Discovery
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
