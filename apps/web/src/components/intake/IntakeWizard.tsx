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
import type { HomeownerIntakeData, ProjectType } from '@/lib/types/intake.types';
import { ROOM_LOCATIONS } from '@/lib/types/intake.types';

// =============================================================================
// Bundle definitions
// =============================================================================

const BUNDLES: {
  value: ProjectType;
  label: string;
  price: string;
  description: string;
  trades: string[];
  icon: React.ReactNode;
}[] = [
  {
    value: 'floor_refresh',
    label: 'Floor Refresh',
    price: '~$5,400',
    description: 'New flooring + baseboard throughout',
    trades: ['Flooring', 'Baseboard'],
    icon: <Layers size={24} />,
  },
  {
    value: 'room_refresh',
    label: 'Room Refresh',
    price: '~$8,200',
    description: 'Flooring + fresh paint + new baseboard',
    trades: ['Flooring', 'Paint', 'Baseboard'],
    icon: <Paintbrush size={24} />,
  },
  {
    value: 'full_interior',
    label: 'Full Interior',
    price: '~$11,800',
    description: 'Flooring + paint + full trim + tile + drywall',
    trades: ['Flooring', 'Paint', 'Trim', 'Tile', 'Drywall'],
    icon: <Hammer size={24} />,
  },
  {
    value: 'custom',
    label: 'Custom',
    price: 'Varies',
    description: 'Custom scope of work',
    trades: ['We\'ll discuss your needs'],
    icon: <Wrench size={24} />,
  },
];

// Rooms available for Interiors (no Exterior — that's Brisso)
const AVAILABLE_ROOMS = [
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'master-bath', name: 'Master Bath' },
  { id: 'master-bed', name: 'Master Bedroom' },
  { id: 'living', name: 'Living Room' },
  { id: 'dining', name: 'Dining Room' },
  { id: 'guest-bath', name: 'Guest Bath' },
  { id: 'guest-bed', name: 'Guest Bedroom' },
  { id: 'basement', name: 'Basement' },
  { id: 'laundry', name: 'Laundry' },
  { id: 'office', name: 'Office' },
  { id: 'hallway', name: 'Hallway' },
  { id: 'entryway', name: 'Entryway' },
];

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

// Step 2: Bundle Selection
function BundleStep({ data, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Choose a Bundle</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>What level of work are you looking for?</p>
      </div>

      <div className="space-y-3">
        {BUNDLES.map((bundle) => {
          const isSelected = data.project.project_type === bundle.value;
          return (
            <button
              key={bundle.value}
              type="button"
              onClick={() => updateField('project.project_type', bundle.value)}
              className="w-full text-left rounded-xl p-4 transition-all min-h-[80px]"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                border: isSelected ? '2px solid #0F766E' : '2px solid #E5E7EB',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isSelected ? '#0F766E' : '#F3F4F6',
                    color: isSelected ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  {bundle.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: '#111827' }}>{bundle.label}</span>
                    <span className="text-sm font-medium" style={{ color: '#0F766E' }}>{bundle.price}</span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>{bundle.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bundle.trades.map((trade) => (
                      <span
                        key={trade}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#F3F4F6', color: '#374151' }}
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#0F766E' }}
                  >
                    <Check size={14} color="#FFFFFF" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 3: Room Selection
function RoomsStep({ data, updateField, errors }: StepProps) {
  const selectedRooms = data.project.selected_rooms;

  const toggleRoom = (roomId: string) => {
    const newRooms = selectedRooms.includes(roomId)
      ? selectedRooms.filter((r) => r !== roomId)
      : [...selectedRooms, roomId];
    updateField('project.selected_rooms', newRooms);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>Select Rooms</h2>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Which areas are included in this project?</p>
      </div>

      {errors['project.selected_rooms'] && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{errors['project.selected_rooms']}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_ROOMS.map((room) => {
          const isSelected = selectedRooms.includes(room.id);
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => toggleRoom(room.id)}
              className="flex items-center gap-2 rounded-xl p-3 transition-all min-h-[52px] text-left"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                border: isSelected ? '2px solid #0F766E' : '2px solid #E5E7EB',
              }}
            >
              <span className="font-medium text-sm" style={{ color: isSelected ? '#0F766E' : '#374151' }}>
                {room.name}
              </span>
              {isSelected && (
                <Check size={16} className="ml-auto flex-shrink-0" style={{ color: '#0F766E' }} />
              )}
            </button>
          );
        })}
      </div>

      {selectedRooms.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: '#F0FDFA' }}>
          <p className="text-sm font-medium" style={{ color: '#0F766E' }}>
            {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
}

// Step 4: Notes & Submit
function NotesStep({ data, updateField }: StepProps) {
  const bundleLabel = BUNDLES.find((b) => b.value === data.project.project_type)?.label || 'Custom';
  const roomCount = data.project.selected_rooms.length;
  const roomNames = data.project.selected_rooms.map((id) => {
    const loc = ROOM_LOCATIONS[`loc-${id}` as keyof typeof ROOM_LOCATIONS];
    return loc?.name || id;
  });

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
            <span className="text-sm" style={{ color: '#6B7280' }}>Bundle</span>
            <span className="text-sm font-medium" style={{ color: '#0F766E' }}>{bundleLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: '#6B7280' }}>Rooms</span>
            <span className="text-sm font-medium" style={{ color: '#111827' }}>{roomCount}</span>
          </div>
          {roomNames.length > 0 && (
            <div className="pt-2" style={{ borderTop: '1px solid #E5E7EB' }}>
              <div className="flex flex-wrap gap-1.5">
                {roomNames.map((name) => (
                  <span
                    key={name}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#F0FDFA', color: '#0F766E' }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Project Name
        </label>
        <input
          type="text"
          value={data.project.name}
          onChange={(e) => updateField('project.name', e.target.value)}
          className="input"
          placeholder={`${data.contact.first_name || 'Client'}'s ${bundleLabel}`}
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
  { id: 'bundle', name: 'Bundle', component: BundleStep },
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
    project_type: 'room_refresh',
    selected_rooms: [],
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

    if (step.id === 'rooms') {
      if (formData.project.selected_rooms.length === 0) {
        newErrors['project.selected_rooms'] = 'Select at least one room';
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
          const bundleLabel = BUNDLES.find((b) => b.value === finalData.project.project_type)?.label || 'Project';
          finalData.project.name = `${finalData.contact.first_name}'s ${bundleLabel}`;
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
    <div className="min-h-screen" style={{ background: '#0F766E' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm font-medium min-h-[48px] min-w-[48px]"
            style={{ color: 'rgba(255,255,255,0.9)' }}
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
                  background: i <= currentStep ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>

          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="px-4 pb-4">
        <div
          className="max-w-lg mx-auto rounded-2xl p-5"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
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
