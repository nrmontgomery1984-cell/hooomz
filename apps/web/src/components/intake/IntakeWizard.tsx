'use client';

/**
 * IntakeWizard - Homeowner Intake Flow (4 Steps)
 *
 * Step 1: Client & Property (name, contact, address)
 * Step 2: Bundle Selection (Floor Refresh / Room Refresh / Full Interior / Custom)
 * Step 3: Room Selection (toggle rooms included in project)
 * Step 4: Notes & Submit
 *
 * Design: Teal page background, white card, step dots, dark "Next" button.
 * Follows Hooomz UI Design Specification.
 */

import { useState, useCallback } from 'react';
import { useIntakeDraftAutoSave } from '@/lib/hooks/useIntakeDraftAutoSave';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Layers,
  Paintbrush,
  Hammer,
  Wrench,
  Check,
  ChevronLeft,
  StickyNote,
} from 'lucide-react';
import type { HomeownerIntakeData, ProjectType, RoomScope } from '@/lib/types/intake.types';
import { getActiveTradesFromScopes, TRADE_CODES } from '@/lib/types/intake.types';
import { RoomScopeBuilder } from './RoomScopeBuilder';

// =============================================================================
// Service definitions for mix-and-match selection
// =============================================================================

const SERVICES: {
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { code: 'FL', name: 'Flooring', description: 'LVP, hardwood, laminate, carpet', icon: <Layers size={22} /> },
  { code: 'PT', name: 'Paint', description: 'Walls, ceilings, trim paint', icon: <Paintbrush size={22} /> },
  { code: 'FC', name: 'Trim & Baseboard', description: 'Baseboard, casing, crown moulding', icon: <Hammer size={22} /> },
  { code: 'TL', name: 'Tile', description: 'Floor tile, backsplash, walls', icon: <Wrench size={22} /> },
  { code: 'DW', name: 'Drywall', description: 'Patching, taping, new install', icon: <Layers size={22} /> },
];

/** Derive project_type from selected trades for backward compat */
function deriveProjectType(trades: string[]): ProjectType {
  const sorted = [...trades].sort();
  const key = sorted.join(',');
  if (key === 'FC,FL') return 'floor_refresh';
  if (key === 'FC,FL,PT') return 'room_refresh';
  if (key === 'DW,FC,FL,PT,TL') return 'full_interior';
  return 'custom';
}

// =============================================================================
// Step Components
// =============================================================================

interface StepProps {
  data: HomeownerIntakeData;
  updateField: (path: string, value: unknown) => void;
  errors: Record<string, string>;
}

// Step 1: Client & Property
function ClientStep({ data, updateField, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Client & Property</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Who is the project for?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            First Name *
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              value={data.contact.first_name}
              onChange={(e) => updateField('contact.first_name', e.target.value)}
              className="input pl-9"
              placeholder="John"
            />
          </div>
          {errors['contact.first_name'] && (
            <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors['contact.first_name']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Last Name *
          </label>
          <input
            type="text"
            value={data.contact.last_name}
            onChange={(e) => updateField('contact.last_name', e.target.value)}
            className="input"
            placeholder="Smith"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Email *
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="email"
            value={data.contact.email}
            onChange={(e) => updateField('contact.email', e.target.value)}
            className="input pl-9"
            placeholder="john@example.com"
          />
        </div>
        {errors['contact.email'] && (
          <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors['contact.email']}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Phone
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="tel"
            value={data.contact.phone || ''}
            onChange={(e) => updateField('contact.phone', e.target.value)}
            className="input pl-9"
            placeholder="(506) 555-1234"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Property Address *
        </label>
        <div className="relative mb-2">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            value={data.project.address.street}
            onChange={(e) => updateField('project.address.street', e.target.value)}
            className="input pl-9"
            placeholder="123 Main Street"
          />
        </div>
        {errors['project.address'] && (
          <p className="text-xs mt-1 mb-2" style={{ color: '#EF4444' }}>{errors['project.address']}</p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={data.project.address.city}
            onChange={(e) => updateField('project.address.city', e.target.value)}
            className="input"
            placeholder="City"
          />
          <input
            type="text"
            value={data.project.address.province}
            onChange={(e) => updateField('project.address.province', e.target.value)}
            className="input"
            placeholder="NB"
          />
          <input
            type="text"
            value={data.project.address.postal_code}
            onChange={(e) => updateField('project.address.postal_code', e.target.value)}
            className="input"
            placeholder="E1A 1A1"
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Services Selection (mix-and-match)
function ServicesStep({ data, updateField, errors }: StepProps) {
  const selected = data.project.selected_trades ?? [];

  const toggleTrade = (code: string) => {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    updateField('project.selected_trades', next);
    updateField('project.project_type', deriveProjectType(next));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>What do you need?</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Select all the services you&apos;re interested in.</p>
      </div>

      {errors['project.selected_trades'] && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{errors['project.selected_trades']}</p>
      )}

      <div className="space-y-2">
        {SERVICES.map((svc) => {
          const isOn = selected.includes(svc.code);
          return (
            <button
              key={svc.code}
              type="button"
              onClick={() => toggleTrade(svc.code)}
              className="w-full flex items-center gap-3 rounded-xl p-4 min-h-[64px] text-left transition-all"
              style={{
                background: isOn ? '#F0FDFA' : '#FFFFFF',
                border: isOn ? '2px solid #0F766E' : '2px solid #E5E7EB',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isOn ? '#0F766E' : '#F3F4F6',
                  color: isOn ? '#FFFFFF' : '#6B7280',
                }}
              >
                {svc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm" style={{ color: '#111827' }}>{svc.name}</span>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{svc.description}</p>
              </div>
              {isOn && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0F766E' }}
                >
                  <Check size={14} color="#FFFFFF" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: '#F0FDFA' }}>
          <p className="text-sm" style={{ color: '#0F766E' }}>
            <span className="font-medium">{selected.length} service{selected.length !== 1 ? 's' : ''} selected</span>
            {' — '}
            {selected.map((c) => SERVICES.find((s) => s.code === c)?.name).filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

// Step 3: Room Scope Builder
function RoomsStep({ data, updateField, errors }: StepProps) {
  const roomScopes = data.project.room_scopes ?? [];

  const handleRoomsChange = (rooms: RoomScope[]) => {
    updateField('project.room_scopes', rooms);
    // Derive selected_rooms for backward compat
    updateField('project.selected_rooms', rooms.map((r) => r.id.replace('loc-', '')));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Room Scope</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Add rooms, enter measurements, and configure trades per room.
        </p>
      </div>

      {errors['project.selected_rooms'] && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{errors['project.selected_rooms']}</p>
      )}

      <RoomScopeBuilder
        rooms={roomScopes}
        onChange={handleRoomsChange}
        enabledTrades={data.project.selected_trades}
      />
    </div>
  );
}

// Step 4: Notes & Submit
function NotesStep({ data, updateField }: StepProps) {
  const selectedTrades = data.project.selected_trades ?? [];
  const serviceNames = selectedTrades.map((c) => SERVICES.find((s) => s.code === c)?.name).filter(Boolean);
  const roomScopes = data.project.room_scopes ?? [];
  const totalSqft = roomScopes.reduce((sum, r) => sum + (r.measurements.sqft ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Review & Notes</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Anything else we should know?</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-4" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: '#6B7280' }}>Client</span>
            <span className="text-sm font-medium" style={{ color: '#111827' }}>
              {data.contact.first_name} {data.contact.last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: '#6B7280' }}>Services</span>
            <span className="text-sm font-medium" style={{ color: '#0F766E' }}>{serviceNames.join(', ') || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: '#6B7280' }}>Rooms</span>
            <span className="text-sm font-medium" style={{ color: '#111827' }}>
              {roomScopes.length}{totalSqft > 0 ? ` · ${totalSqft.toLocaleString()} sqft` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Room-by-room breakdown */}
      {roomScopes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Room Breakdown
          </p>
          {roomScopes.map((room) => {
            const activeTrades = getActiveTradesFromScopes(room.trades);
            const photoCount = room.photos?.length ?? 0;
            const mat = room.materials;
            return (
              <div
                key={room.id}
                className="rounded-xl p-3"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: '#111827' }}>{room.name}</span>
                  {room.measurements.sqft != null && room.measurements.sqft > 0 && (
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{room.measurements.sqft} sqft</span>
                  )}
                  {photoCount > 0 && (
                    <span className="text-xs" style={{ color: '#6B7280' }}>
                      {photoCount} photo{photoCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {activeTrades.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {activeTrades.map((code) => (
                      <span
                        key={code}
                        className="text-[10px] font-medium"
                        style={{ color: '#0F766E' }}
                      >
                        {TRADE_CODES[code as keyof typeof TRADE_CODES]?.name ?? code}
                      </span>
                    ))}
                  </div>
                )}
                {/* Material summary lines */}
                {mat && (
                  <div className="mt-1 space-y-0.5">
                    {mat.flooring?.product && (
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        Flooring: {mat.flooring.product}{mat.flooring.color ? ` (${mat.flooring.color})` : ''}
                      </p>
                    )}
                    {mat.paint?.brand && (
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        Paint: {mat.paint.brand} {mat.paint.finish}
                        {mat.paint.colors.walls ? ` — ${mat.paint.colors.walls}` : ''}
                      </p>
                    )}
                    {mat.trim?.profile && (
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        Trim: {mat.trim.profile} {mat.trim.material}
                      </p>
                    )}
                    {mat.tile?.type && (
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        Tile: {mat.tile.type}{mat.tile.size ? ` ${mat.tile.size}` : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Project Name
        </label>
        <input
          type="text"
          value={data.project.name}
          onChange={(e) => updateField('project.name', e.target.value)}
          className="input"
          placeholder={`${data.contact.first_name || 'Client'}'s ${serviceNames.join(' + ') || 'Project'}`}
        />
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Leave blank to auto-generate
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          <StickyNote size={14} />
          Notes / Special Requests
        </label>
        <textarea
          value={data.notes.special_requests || ''}
          onChange={(e) => updateField('notes.special_requests', e.target.value)}
          className="textarea"
          rows={3}
          placeholder="Pet damage to mention, tight deadline, specific preferences..."
        />
      </div>
    </div>
  );
}

// =============================================================================
// Main Wizard Component
// =============================================================================

const STEPS = [
  { id: 'client', name: 'Client', component: ClientStep },
  { id: 'services', name: 'Services', component: ServicesStep },
  { id: 'rooms', name: 'Rooms', component: RoomsStep },
  { id: 'notes', name: 'Review', component: NotesStep },
];

interface IntakeWizardProps {
  onComplete: (data: HomeownerIntakeData) => void;
  onCancel: () => void;
  initialData?: HomeownerIntakeData;
  initialStep?: number;
  draftId?: string | null;
  onDraftCreated?: (id: string) => void;
}

const initialData: HomeownerIntakeData = {
  contact: {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    preferred_contact: 'email',
  },
  project: {
    name: '',
    address: { street: '', city: '', province: 'NB', postal_code: '' },
    project_type: 'custom',
    selected_trades: [],
    selected_rooms: [],
    room_scopes: [],
  },
  notes: {
    special_requests: '',
  },
};

export function IntakeWizard({
  onComplete,
  onCancel,
  initialData: initialDataProp,
  initialStep,
  draftId: draftIdProp,
  onDraftCreated: onDraftCreatedProp,
}: IntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep ?? 0);
  const [formData, setFormData] = useState<HomeownerIntakeData>(initialDataProp ?? initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Draft auto-save
  const { debouncedSave, immediateSave } = useIntakeDraftAutoSave({
    draftId: draftIdProp ?? null,
    type: 'homeowner',
    currentStep,
    data: formData,
    onDraftCreated: onDraftCreatedProp ?? (() => {}),
  });

  const updateField = useCallback((path: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const parts = path.split('.');

      // Navigate to the right nested object and set the value
      let current: Record<string, unknown> = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown>) };
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;

      return newData as HomeownerIntakeData;
    });

    // Clear related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(path.split('.')[0])) delete newErrors[key];
      });
      return newErrors;
    });

    // Auto-save on field change (debounced)
    debouncedSave();
  }, [debouncedSave]);

  const validateStep = useCallback((): boolean => {
    const step = STEPS[currentStep];
    const newErrors: Record<string, string> = {};

    if (step.id === 'client') {
      if (!formData.contact.first_name.trim()) newErrors['contact.first_name'] = 'Required';
      if (!formData.contact.email.trim()) newErrors['contact.email'] = 'Required';
      if (!formData.project.address.street.trim()) newErrors['project.address'] = 'Required';
    }

    if (step.id === 'services') {
      if ((formData.project.selected_trades ?? []).length === 0) {
        newErrors['project.selected_trades'] = 'Select at least one service';
      }
    }

    if (step.id === 'rooms') {
      if ((formData.project.room_scopes ?? []).length === 0) {
        newErrors['project.selected_rooms'] = 'Add at least one room';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
        // Save immediately on step transition
        immediateSave();
      } else {
        // Auto-generate project name if blank
        const finalData = { ...formData };
        if (!finalData.project.name.trim()) {
          const trades = finalData.project.selected_trades ?? [];
          const serviceLabel = trades.length > 0
            ? trades.map((c) => SERVICES.find((s) => s.code === c)?.name).filter(Boolean).join(' + ')
            : 'Project';
          finalData.project.name = `${finalData.contact.first_name}'s ${serviceLabel}`;
        }
        onComplete(finalData);
      }
    }
  }, [currentStep, formData, onComplete, validateStep, immediateSave]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      // Save immediately on step transition
      immediateSave();
    } else {
      onCancel();
    }
  }, [currentStep, onCancel, immediateSave]);

  const CurrentStepComponent = STEPS[currentStep].component;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm font-medium min-h-[48px] min-w-[48px]"
            style={{ color: '#6B7280' }}
          >
            <ChevronLeft size={18} />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === currentStep ? 10 : 8,
                  height: i === currentStep ? 10 : 8,
                  background: i <= currentStep ? '#0F766E' : '#D1D5DB',
                }}
              />
            ))}
          </div>

          <span className="text-sm" style={{ color: '#9CA3AF' }}>
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="px-4 py-6">
        <div
          className="max-w-lg mx-auto rounded-2xl p-5"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            minHeight: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Step content */}
          <div className="flex-1">
            <CurrentStepComponent data={formData} updateField={updateField} errors={errors} />
          </div>

          {/* Footer button */}
          <div className="pt-5 mt-auto">
            <button
              onClick={handleNext}
              className="btn btn-dark w-full text-base font-semibold"
              style={{
                background: '#374151',
                color: '#FFFFFF',
                borderRadius: '12px',
                minHeight: '52px',
              }}
            >
              {isLastStep ? 'Create Project' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntakeWizard;
