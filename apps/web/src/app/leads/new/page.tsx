'use client';

/**
 * Conversational Lead Capture — /leads/new
 *
 * 7-screen progressive flow for home show / website captures.
 * Screen 1: Scope signals (what trades)
 * Screen 2: Room details (add rooms with L×W dimensions)
 * Screen 3: Material preferences (per-trade material type)
 * Screen 4: Budget range
 * Screen 5: Instant estimate (the payoff — now sqft-based)
 * Screen 6: Contact info + source
 * Screen 7: Timeline
 * → Success confirmation
 *
 * Total flow: 60-90 seconds at a booth.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Plus,
  ArrowRight,
  X,
  Layers,
  Paintbrush,
  Scissors,
  Grid3X3,
  Home,
  HelpCircle,
  SquareDashedBottom,
} from 'lucide-react';
import { useCreateLead } from '@/lib/hooks/useLeadData';
import { useEffectiveCatalog } from '@/lib/hooks/useCostCatalog';
import { calculateSqftEstimate } from '@/lib/instantEstimate';
import type { CreateLeadInput } from '@/lib/hooks/useLeadData';
import type {
  InstantEstimateResult,
  RoomInput,
  MaterialPreferences,
  DoorWindowInput,
  FlooringMaterialPref,
  PaintScopePref,
  TrimScopePref,
  TileScopePref,
  DrywallScopePref,
} from '@/lib/instantEstimate';

// ============================================================================
// Constants
// ============================================================================

const TOTAL_SCREENS = 8;

const SCOPE_OPTIONS = [
  { value: 'floors', label: 'New Floors', desc: 'LVP, hardwood, laminate, carpet', icon: Layers },
  { value: 'paint', label: 'Paint & Walls', desc: 'Interior paint, accent walls, ceilings', icon: Paintbrush },
  { value: 'trim', label: 'Trim & Molding', desc: 'Baseboards, crown, door casings', icon: Scissors },
  { value: 'tile', label: 'Tile', desc: 'Bathroom, kitchen, backsplash', icon: Grid3X3 },
  { value: 'drywall', label: 'Drywall', desc: 'Patches, full walls, finishing', icon: SquareDashedBottom },
  { value: 'full_refresh', label: 'Full Interior', desc: 'Floors + paint + trim — the works', icon: Home },
  { value: 'not_sure', label: 'Not Sure Yet', desc: "We'll help figure it out", icon: HelpCircle },
] as const;

const ROOM_PRESETS = [
  { id: 'living', name: 'Living Room', icon: '🛋️' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
  { id: 'bedroom1', name: 'Primary Bedroom', icon: '🛏️' },
  { id: 'bedroom2', name: 'Bedroom 2', icon: '🛏️' },
  { id: 'bedroom3', name: 'Bedroom 3', icon: '🛏️' },
  { id: 'bathroom1', name: 'Bathroom', icon: '🚿' },
  { id: 'bathroom2', name: 'Bathroom 2', icon: '🚿' },
  { id: 'hallway', name: 'Hallway', icon: '🚪' },
  { id: 'laundry', name: 'Laundry', icon: '🧺' },
  { id: 'office', name: 'Office', icon: '💻' },
  { id: 'dining', name: 'Dining Room', icon: '🍽️' },
  { id: 'basement', name: 'Basement', icon: '🏠' },
] as const;

const FLOOR_MATERIAL_OPTIONS: { value: FlooringMaterialPref; label: string }[] = [
  { value: 'lvp', label: 'LVP / Vinyl Plank' },
  { value: 'hardwood', label: 'Hardwood' },
  { value: 'laminate', label: 'Laminate' },
  { value: 'carpet', label: 'Carpet' },
  { value: 'tile', label: 'Tile' },
  { value: 'not_sure', label: 'Not Sure' },
];

const PAINT_SCOPE_OPTIONS: { value: PaintScopePref; label: string }[] = [
  { value: 'walls', label: 'Walls Only' },
  { value: 'walls_ceiling', label: 'Walls + Ceiling' },
  { value: 'full', label: 'Full (walls, ceiling, trim)' },
];

const TRIM_SCOPE_OPTIONS: { value: TrimScopePref; label: string }[] = [
  { value: 'baseboard', label: 'Baseboard' },
  { value: 'casing', label: 'Casing' },
  { value: 'crown', label: 'Crown' },
  { value: 'other', label: 'Other' },
];

const TILE_SCOPE_OPTIONS: { value: TileScopePref; label: string }[] = [
  { value: 'floor', label: 'Floor Tile' },
  { value: 'backsplash', label: 'Backsplash' },
  { value: 'shower', label: 'Shower / Tub' },
  { value: 'not_sure', label: 'Not Sure' },
];

const DRYWALL_SCOPE_OPTIONS: { value: DrywallScopePref; label: string }[] = [
  { value: 'patches', label: 'Patches' },
  { value: 'accent', label: 'Accent Wall' },
  { value: 'full_room', label: 'Full Room' },
];

const BUDGET_OPTIONS = [
  { value: 'under-5k', label: 'Under $5,000', hint: 'Typical for a single room refresh' },
  { value: '5k-10k', label: '$5,000 – $10,000', hint: 'Typical for 2-3 rooms of flooring + paint' },
  { value: '10k-20k', label: '$10,000 – $20,000', hint: 'Typical for multi-room or full-floor renovation' },
  { value: '20k+', label: '$20,000+', hint: 'Full interior refresh or large space' },
  { value: 'unknown', label: 'Not sure yet', hint: "No problem — we'll help you figure it out" },
] as const;

const SOURCE_OPTIONS = [
  { value: 'home_show', label: 'Home Show' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'google', label: 'Google' },
  { value: 'social', label: 'Social Media' },
  { value: 'ritchies', label: 'Ritchies' },
  { value: 'repeat', label: 'Repeat Client' },
] as const;

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'As soon as possible', desc: "Let's get moving", color: '#EF4444' },
  { value: 'few_months', label: 'Next few months', desc: 'Planning ahead', color: '#F59E0B' },
  { value: 'exploring', label: 'Just exploring', desc: 'No rush — learning what\'s possible', color: '#3B82F6' },
] as const;

const CONTACT_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
] as const;

// ============================================================================
// Formatters
// ============================================================================

function formatCurrencyFull(value: number): string {
  return `$${value.toLocaleString()}`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Resolve which material trades to show based on scope tags */
function getActiveTrades(scopeTags: string[]): string[] {
  if (scopeTags.includes('full_refresh')) return ['floors', 'paint', 'trim'];
  if (scopeTags.includes('not_sure')) return ['floors', 'paint'];
  return scopeTags.filter((t) => ['floors', 'paint', 'trim', 'tile', 'drywall'].includes(t));
}

// ============================================================================
// Page
// ============================================================================

export default function NewLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();
  const catalog = useEffectiveCatalog();
  const nameRef = useRef<HTMLInputElement>(null);

  // ── Screen state ──
  const [screen, setScreen] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // ── Form data ──
  const [scopeTags, setScopeTags] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomInput[]>([]);
  const [materials, setMaterials] = useState<MaterialPreferences>({});
  const [doorWindows, setDoorWindows] = useState<DoorWindowInput>({
    exteriorDoors: 0, interiorDoors: 0, closetDoors: 0, patioDoors: 0,
    windowsSmall: 0, windowsMedium: 0, windowsLarge: 0,
    replaceHardware: false, replaceKnobs: false,
  });
  const [budgetRange, setBudgetRange] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [preferredContact, setPreferredContact] = useState('text');
  const [timeline, setTimeline] = useState('');

  // ── Derived ──
  const [estimate, setEstimate] = useState<InstantEstimateResult | null>(null);

  // ── Success state ──
  const [view, setView] = useState<'flow' | 'success'>('flow');
  const [savedName, setSavedName] = useState('');
  const [savedPhone, setSavedPhone] = useState('');

  // ── Auto-advance timer ──
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => clearAutoAdvance, [clearAutoAdvance]);

  // ── Navigation ──
  const goForward = useCallback(() => {
    clearAutoAdvance();
    setDirection('forward');
    setScreen((s) => Math.min(s + 1, TOTAL_SCREENS));
  }, [clearAutoAdvance]);

  const goBack = useCallback(() => {
    clearAutoAdvance();
    setDirection('back');
    setScreen((s) => {
      if (s <= 1) {
        router.push('/leads');
        return s;
      }
      return s - 1;
    });
  }, [router, clearAutoAdvance]);

  const scheduleAutoAdvance = useCallback((delay = 400) => {
    clearAutoAdvance();
    autoAdvanceRef.current = setTimeout(goForward, delay);
  }, [goForward, clearAutoAdvance]);

  // ── Calculate estimate when entering screen 6 ──
  useEffect(() => {
    if (screen === 6) {
      const hasDoorData = doorWindows.exteriorDoors + doorWindows.interiorDoors + doorWindows.closetDoors + doorWindows.patioDoors + doorWindows.windowsSmall + doorWindows.windowsMedium + doorWindows.windowsLarge > 0;
      const result = calculateSqftEstimate({
        rooms,
        materials,
        scopeTags,
        doorWindows: hasDoorData ? doorWindows : undefined,
      }, catalog);
      setEstimate(result);
    }
  }, [screen, rooms, materials, scopeTags, doorWindows]);

  // ── Scope selection (Screen 1) ──
  const toggleScope = useCallback((value: string) => {
    setScopeTags((prev) => {
      let next: string[];
      if (value === 'not_sure') {
        // "Not sure" is exclusive — auto-advance since there's nothing else to pick
        next = prev.includes('not_sure') ? [] : ['not_sure'];
        if (next.length > 0) {
          clearAutoAdvance();
          autoAdvanceRef.current = setTimeout(goForward, 800);
        }
      } else {
        const without = prev.filter((v) => v !== 'not_sure');
        next = without.includes(value)
          ? without.filter((v) => v !== value)
          : [...without, value];
      }
      return next;
    });
  }, [goForward, clearAutoAdvance]);

  // ── Room management (Screen 2) ──
  const addRoom = useCallback((_presetId: string, presetName: string) => {
    setRooms((prev) => {
      if (prev.some((r) => r.name === presetName)) return prev;
      return [...prev, { name: presetName, lengthFt: 0, widthFt: 0, sqft: 0 }];
    });
  }, []);

  const removeRoom = useCallback((index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRoomDimension = useCallback((index: number, field: 'lengthFt' | 'widthFt', value: number) => {
    setRooms((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, [field]: value };
      updated.sqft = Math.round(updated.lengthFt * updated.widthFt);
      return updated;
    }));
  }, []);

  // ── Material selection (Screen 3) ──
  const updateMaterial = useCallback((trade: string, value: string) => {
    setMaterials((prev) => {
      // Trim supports multi-select (comma-separated)
      if (trade === 'trim') {
        const current = ((prev.trim as string) || '').split(',').filter(Boolean);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, trim: next.join(',') as TrimScopePref };
      }
      return { ...prev, [trade]: value };
    });
  }, []);

  // ── Budget selection (Screen 4) ──
  const selectBudget = useCallback((value: string) => {
    setBudgetRange(value);
    scheduleAutoAdvance();
  }, [scheduleAutoAdvance]);

  // ── Timeline selection (Screen 7) ──
  const selectTimeline = useCallback((value: string) => {
    setTimeline(value);
  }, []);

  // ── Contact validation ──
  const hasContact = name.trim().length > 0 && (phone.trim().length > 0 || email.trim().length > 0);
  const canSubmitScreen6 = hasContact && source.length > 0;

  // ── Computed ──
  const totalSqft = rooms.reduce((sum, r) => sum + r.sqft, 0);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!timeline || createLead.isPending) return;

    const materialPrefs: Record<string, string> = {};
    for (const [trade, pref] of Object.entries(materials)) {
      if (pref) materialPrefs[trade] = pref;
    }

    const hasDoorData = doorWindows.exteriorDoors + doorWindows.interiorDoors + doorWindows.closetDoors + doorWindows.patioDoors + doorWindows.windowsSmall + doorWindows.windowsMedium + doorWindows.windowsLarge > 0 || doorWindows.replaceHardware || doorWindows.replaceKnobs;

    const input: CreateLeadInput = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      scopeTags,
      source,
      timeline,
      budgetRange: budgetRange || 'unknown',
      roomCount: rooms.length || 0,
      totalSqft: totalSqft > 0 ? totalSqft : undefined,
      materialPrefs: Object.keys(materialPrefs).length > 0 ? materialPrefs : undefined,
      doorWindows: hasDoorData ? doorWindows : undefined,
      preferredContact,
      instantEstimate: estimate ? { low: estimate.low, mid: estimate.mid, high: estimate.high } : undefined,
      referralSource: referralSource.trim() || undefined,
    };

    try {
      await createLead.mutateAsync(input);
      setSavedName(name.trim());
      setSavedPhone(phone.trim());
      setView('success');
    } catch {
      // Error is available via createLead.error
    }
  };

  const resetForm = useCallback(() => {
    setScopeTags([]);
    setRooms([]);
    setMaterials({});
    setDoorWindows({
      exteriorDoors: 0, interiorDoors: 0, closetDoors: 0, patioDoors: 0,
      windowsSmall: 0, windowsMedium: 0, windowsLarge: 0,
      replaceHardware: false, replaceKnobs: false,
    });
    setBudgetRange('');
    setName('');
    setPhone('');
    setEmail('');
    setSource('');
    setReferralSource('');
    setPreferredContact('text');
    setTimeline('');
    setEstimate(null);
    setScreen(1);
    setView('flow');
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  // ══════════════════ SUCCESS VIEW ══════════════════
  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center px-6 max-w-sm w-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#D1FAE5' }}
          >
            <Check size={32} style={{ color: '#10B981' }} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>
            Lead Saved!
          </h2>
          <p className="text-base font-medium" style={{ color: '#111827' }}>
            {savedName}
          </p>
          <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
            {savedPhone}
          </p>

          {estimate && (
            <div
              className="rounded-xl p-3 mb-6 mx-auto max-w-[260px]"
              style={{ background: '#F0FDFA', border: '1px solid #CCFBF1' }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#0F766E' }}>
                Preliminary Range
              </p>
              <p className="text-lg font-bold" style={{ color: '#0F766E' }}>
                {formatCurrencyFull(estimate.low)} – {formatCurrencyFull(estimate.high)}
              </p>
              {totalSqft > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {totalSqft.toLocaleString()} sqft
                </p>
              )}
            </div>
          )}

          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
            We&apos;ll be in touch within 24 hours.
          </p>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium"
              style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB' }}
            >
              <Plus size={16} /> Another
            </button>
            <button
              onClick={() => router.push('/leads')}
              className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium text-white"
              style={{ background: '#0F766E' }}
            >
              Pipeline <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════ FLOW VIEW ══════════════════
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft size={20} style={{ color: '#6B7280' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>
            New Lead
          </h1>
          <span className="ml-auto text-xs font-medium" style={{ color: '#9CA3AF' }}>
            {screen}/{TOTAL_SCREENS}
          </span>
        </div>
      </div>

      {/* Screen content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-24">
        <div
          key={screen}
          className="animate-fadeIn"
          style={{
            animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.25s ease-out`,
          }}
        >
          {screen === 1 && (
            <ScreenScope
              selected={scopeTags}
              onToggle={toggleScope}
              onNext={goForward}
            />
          )}
          {screen === 2 && (
            <ScreenRooms
              rooms={rooms}
              totalSqft={totalSqft}
              onAddRoom={addRoom}
              onRemoveRoom={removeRoom}
              onUpdateDimension={updateRoomDimension}
              onNext={goForward}
            />
          )}
          {screen === 3 && (
            <ScreenMaterials
              scopeTags={scopeTags}
              materials={materials}
              onUpdateMaterial={updateMaterial}
              onNext={goForward}
            />
          )}
          {screen === 4 && (
            <ScreenDoorsWindows
              doorWindows={doorWindows}
              onUpdate={(field, value) => setDoorWindows((prev) => ({ ...prev, [field]: value }))}
              onNext={goForward}
            />
          )}
          {screen === 5 && (
            <ScreenBudget
              selected={budgetRange}
              onSelect={selectBudget}
            />
          )}
          {screen === 6 && (
            <ScreenEstimate
              estimate={estimate}
              onNext={goForward}
            />
          )}
          {screen === 7 && (
            <ScreenContact
              name={name}
              phone={phone}
              email={email}
              source={source}
              referralSource={referralSource}
              preferredContact={preferredContact}
              nameRef={nameRef}
              onNameChange={setName}
              onPhoneChange={setPhone}
              onEmailChange={setEmail}
              onSourceChange={setSource}
              onReferralSourceChange={setReferralSource}
              onPreferredContactChange={setPreferredContact}
              canAdvance={canSubmitScreen6}
              onNext={goForward}
            />
          )}
          {screen === 8 && (
            <ScreenTimeline
              selected={timeline}
              onSelect={selectTimeline}
              onSubmit={handleSubmit}
              isPending={createLead.isPending}
              error={createLead.error}
            />
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 pt-3" style={{ background: 'linear-gradient(transparent, #F3F4F6 30%)' }}>
        <div className="flex justify-center gap-2">
          {Array.from({ length: TOTAL_SCREENS }, (_, i) => {
            const step = i + 1;
            const isComplete = step < screen;
            const isCurrent = step === screen;
            return (
              <div
                key={step}
                className="rounded-full transition-all duration-300"
                style={{
                  width: isCurrent ? 24 : 8,
                  height: 8,
                  background: isComplete ? '#0F766E' : isCurrent ? '#0F766E' : '#D1D5DB',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Screen 1: Scope (unchanged)
// ============================================================================

function ScreenScope({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        What are you thinking about?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        Select all that apply — we&apos;ll figure out the details together.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {SCOPE_OPTIONS.map(({ value, label, desc, icon: Icon }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              className="rounded-xl p-4 text-left transition-all duration-150 min-h-[90px]"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
                boxShadow: isSelected ? '0 0 0 1px #0F766E' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Icon
                size={20}
                className="mb-2"
                style={{ color: isSelected ? '#0F766E' : '#6B7280' }}
                strokeWidth={1.5}
              />
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: isSelected ? '#0F766E' : '#111827' }}
              >
                {label}
              </p>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                {desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Next button — visible once at least one scope is selected */}
      {selected.length > 0 && (
        <button
          onClick={onNext}
          className="w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{
            minHeight: '48px',
            background: '#0F766E',
            color: '#FFFFFF',
          }}
        >
          Next
        </button>
      )}
    </>
  );
}

// ============================================================================
// Screen 2: Rooms with dimensions
// ============================================================================

function ScreenRooms({
  rooms,
  totalSqft,
  onAddRoom,
  onRemoveRoom,
  onUpdateDimension,
  onNext,
}: {
  rooms: RoomInput[];
  totalSqft: number;
  onAddRoom: (id: string, name: string) => void;
  onRemoveRoom: (index: number) => void;
  onUpdateDimension: (index: number, field: 'lengthFt' | 'widthFt', value: number) => void;
  onNext: () => void;
}) {
  const [showPicker, setShowPicker] = useState(rooms.length === 0);
  const addedNames = rooms.map((r) => r.name);

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        Which rooms?
      </h2>
      <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
        Add rooms and rough dimensions — don&apos;t worry about being exact.
      </p>

      {/* Added rooms */}
      {rooms.length > 0 && (
        <div className="space-y-3 mb-4">
          {rooms.map((room, idx) => (
            <div
              key={`${room.name}-${idx}`}
              className="rounded-xl p-3"
              style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                  {room.name}
                </span>
                <div className="flex items-center gap-2">
                  {room.sqft > 0 && (
                    <span className="text-xs font-medium" style={{ color: '#0F766E' }}>
                      {room.sqft} sqft
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveRoom(idx)}
                    className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg"
                    style={{ color: '#9CA3AF' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: '#9CA3AF' }}>
                    Length (ft)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={room.lengthFt || ''}
                    onChange={(e) => onUpdateDimension(idx, 'lengthFt', parseFloat(e.target.value) || 0)}
                    placeholder="12"
                    className="w-full min-h-[40px] px-3 rounded-lg text-sm"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
                  />
                </div>
                <span className="text-sm font-medium pt-4" style={{ color: '#9CA3AF' }}>×</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: '#9CA3AF' }}>
                    Width (ft)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    value={room.widthFt || ''}
                    onChange={(e) => onUpdateDimension(idx, 'widthFt', parseFloat(e.target.value) || 0)}
                    placeholder="15"
                    className="w-full min-h-[40px] px-3 rounded-lg text-sm"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total sqft */}
          {totalSqft > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#0F766E' }}>
                {totalSqft.toLocaleString()} sqft
              </span>
            </div>
          )}
        </div>
      )}

      {/* Room picker */}
      {showPicker ? (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            Tap to add
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROOM_PRESETS.filter((r) => !addedNames.includes(r.name)).map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onAddRoom(preset.id, preset.name);
                  if (rooms.length >= 2) setShowPicker(false);
                }}
                className="rounded-xl p-2.5 text-center transition-colors min-h-[52px]"
                style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
              >
                <span className="text-base block mb-0.5">{preset.icon}</span>
                <span className="text-[11px] font-medium" style={{ color: '#374151' }}>
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full min-h-[44px] rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 mb-4"
          style={{ background: '#FFFFFF', border: '1px dashed #D1D5DB', color: '#6B7280' }}
        >
          <Plus size={16} /> Add Room
        </button>
      )}

      {/* Next */}
      <button
        onClick={onNext}
        disabled={rooms.length === 0}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-2"
        style={{
          background: rooms.length > 0 ? '#0F766E' : '#9CA3AF',
        }}
      >
        Next
      </button>
    </>
  );
}

// ============================================================================
// Screen 3: Material Preferences
// ============================================================================

function ScreenMaterials({
  scopeTags,
  materials,
  onUpdateMaterial,
  onNext,
}: {
  scopeTags: string[];
  materials: MaterialPreferences;
  onUpdateMaterial: (trade: string, value: string) => void;
  onNext: () => void;
}) {
  const activeTrades = getActiveTrades(scopeTags);

  // Map trade → options
  const tradeConfig: Record<string, { label: string; options: { value: string; label: string }[] }> = {
    floors: { label: 'Flooring Type', options: FLOOR_MATERIAL_OPTIONS },
    paint: { label: 'Paint Scope', options: PAINT_SCOPE_OPTIONS },
    trim: { label: 'Trim Scope', options: TRIM_SCOPE_OPTIONS },
    tile: { label: 'Tile Type', options: TILE_SCOPE_OPTIONS },
    drywall: { label: 'Drywall Scope', options: DRYWALL_SCOPE_OPTIONS },
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        Material preferences
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        Helps us give you a better estimate. You can always change your mind later.
      </p>

      <div className="space-y-5">
        {activeTrades.map((trade) => {
          const config = tradeConfig[trade];
          if (!config) return null;
          const currentValue = (materials as Record<string, string | undefined>)[trade] || '';

          return (
            <div key={trade}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
                {config.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {config.options.map((opt) => {
                  // Trim supports multi-select (comma-separated)
                  const isSelected = trade === 'trim'
                    ? (currentValue || '').split(',').includes(opt.value)
                    : currentValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onUpdateMaterial(trade, opt.value)}
                      className="min-h-[40px] px-3.5 rounded-xl text-sm font-medium transition-colors"
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
            </div>
          );
        })}
      </div>

      {activeTrades.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>
          No specific material choices needed — we&apos;ll discuss during the site visit.
        </p>
      )}

      <button
        onClick={onNext}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-6"
        style={{ background: '#0F766E' }}
      >
        Next
      </button>
    </>
  );
}

// ============================================================================
// Screen 4: Doors & Windows
// ============================================================================

function ScreenDoorsWindows({
  doorWindows,
  onUpdate,
  onNext,
}: {
  doorWindows: DoorWindowInput;
  onUpdate: (field: keyof DoorWindowInput, value: number | boolean) => void;
  onNext: () => void;
}) {
  const totalDoors = doorWindows.exteriorDoors + doorWindows.interiorDoors + doorWindows.closetDoors + doorWindows.patioDoors;

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        Doors & Windows
      </h2>
      <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
        Quick counts help us estimate trim and hardware. Skip if not sure.
      </p>

      {/* Doors */}
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
        Doors
      </p>
      <div className="space-y-2 mb-5">
        <CounterRow label="Exterior" hint="Both sides trimmed" value={doorWindows.exteriorDoors} onChange={(v) => onUpdate('exteriorDoors', v)} />
        <CounterRow label="Interior" hint="Both sides for trim" value={doorWindows.interiorDoors} onChange={(v) => onUpdate('interiorDoors', v)} />
        <CounterRow label="Closet" hint="Bifold / sliding" value={doorWindows.closetDoors} onChange={(v) => onUpdate('closetDoors', v)} />
        <CounterRow label="Patio" hint="Sliding / french" value={doorWindows.patioDoors} onChange={(v) => onUpdate('patioDoors', v)} />
      </div>

      {/* Windows */}
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
        Windows
      </p>
      <div className="space-y-2 mb-5">
        <CounterRow label="Small" hint="Bathroom, basement" value={doorWindows.windowsSmall} onChange={(v) => onUpdate('windowsSmall', v)} />
        <CounterRow label="Medium" hint="Standard bedroom" value={doorWindows.windowsMedium} onChange={(v) => onUpdate('windowsMedium', v)} />
        <CounterRow label="Large" hint="Picture, bay window" value={doorWindows.windowsLarge} onChange={(v) => onUpdate('windowsLarge', v)} />
      </div>

      {/* Hardware upsells — only show if doors > 0 */}
      {totalDoors > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
            Upsells
          </p>
          <div className="space-y-2 mb-5">
            <ToggleRow
              label="Replace hardware"
              hint="Hinges & handles — $45/door"
              checked={doorWindows.replaceHardware}
              onChange={(v) => onUpdate('replaceHardware', v)}
            />
            <ToggleRow
              label="Replace knobs"
              hint="$25/door"
              checked={doorWindows.replaceKnobs}
              onChange={(v) => onUpdate('replaceKnobs', v)}
            />
          </div>
        </>
      )}

      <button
        onClick={onNext}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-2"
        style={{ background: '#0F766E' }}
      >
        Next
      </button>
      <button
        onClick={onNext}
        className="w-full min-h-[44px] rounded-xl text-sm font-medium mt-2"
        style={{ color: '#6B7280' }}
      >
        Skip — not sure yet
      </button>
    </>
  );
}

/** Stepper row: Label + hint on left, [–] count [+] on right */
function CounterRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl p-3"
      style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: '#111827' }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{hint}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-lg font-medium"
          style={{ background: '#F3F4F6', color: value > 0 ? '#374151' : '#D1D5DB' }}
        >
          −
        </button>
        <span
          className="w-8 text-center text-sm font-semibold"
          style={{ color: value > 0 ? '#111827' : '#D1D5DB' }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-lg font-medium"
          style={{ background: '#F0FDFA', color: '#0F766E' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Toggle row: Label + hint on left, toggle switch on right */
function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between rounded-xl p-3 text-left"
      style={{
        background: checked ? '#F0FDFA' : '#FFFFFF',
        border: checked ? '2px solid #0F766E' : '1px solid #E5E7EB',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: checked ? '#0F766E' : '#111827' }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{hint}</p>
      </div>
      <div
        className="w-10 h-6 rounded-full flex-shrink-0 relative transition-colors"
        style={{ background: checked ? '#0F766E' : '#D1D5DB' }}
      >
        <div
          className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </div>
    </button>
  );
}

// ============================================================================
// Screen 5: Budget
// ============================================================================

function ScreenBudget({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        Do you have a budget range in mind?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        This helps us tailor our recommendations. No wrong answers.
      </p>
      <div className="space-y-3">
        {BUDGET_OPTIONS.map(({ value, label, hint }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className="w-full rounded-xl p-4 text-left transition-all duration-150 min-h-[60px]"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
                boxShadow: isSelected ? '0 0 0 1px #0F766E' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <p
                className="text-base font-semibold"
                style={{ color: isSelected ? '#0F766E' : '#111827' }}
              >
                {label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                {hint}
              </p>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============================================================================
// Screen 5: Instant Estimate
// ============================================================================

function ScreenEstimate({
  estimate,
  onNext,
}: {
  estimate: InstantEstimateResult | null;
  onNext: () => void;
}) {
  if (!estimate) return null;

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        Here&apos;s what we&apos;re seeing.
      </h2>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
        {estimate.description} in the Moncton area.
      </p>

      <div
        className="rounded-2xl p-6 text-center mb-4"
        style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#9CA3AF' }}>
          Preliminary Range
        </p>
        <p className="text-4xl font-bold mb-1" style={{ color: '#111827' }}>
          {formatCurrencyFull(estimate.low)} – {formatCurrencyFull(estimate.high)}
        </p>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          CAD, before tax
        </p>
      </div>

      <p className="text-[11px] text-center mb-8 px-4" style={{ color: '#9CA3AF' }}>
        This is a preliminary range based on your room sizes and material preferences.
        Your actual estimate will be based on a site visit and detailed scope.
      </p>

      <button
        onClick={onNext}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mb-3"
        style={{ background: '#0F766E' }}
      >
        Let&apos;s get specific — book a free site visit
      </button>
      <button
        onClick={onNext}
        className="w-full min-h-[44px] rounded-xl text-sm font-medium"
        style={{ color: '#6B7280' }}
      >
        Just exploring? No problem — we&apos;ll follow up.
      </button>
    </>
  );
}

// ============================================================================
// Screen 6: Contact
// ============================================================================

function ScreenContact({
  name,
  phone,
  email,
  source,
  referralSource,
  preferredContact,
  nameRef,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onSourceChange,
  onReferralSourceChange,
  onPreferredContactChange,
  canAdvance,
  onNext,
}: {
  name: string;
  phone: string;
  email: string;
  source: string;
  referralSource: string;
  preferredContact: string;
  nameRef: React.Ref<HTMLInputElement>;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onReferralSourceChange: (v: string) => void;
  onPreferredContactChange: (v: string) => void;
  canAdvance: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        How should we reach you?
      </h2>
      <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
        We&apos;ll follow up within 24 hours.
      </p>

      {/* Name */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Name
        </label>
        <input
          ref={nameRef}
          type="text"
          autoCapitalize="words"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Sarah Johnson"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
        />
      </div>

      {/* Phone */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="506-555-0123"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          Email <span className="font-normal" style={{ color: '#9CA3AF' }}>(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="sarah@example.com"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
        />
      </div>

      {/* Preferred contact method */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          Best way to reach you
        </label>
        <div className="flex gap-2">
          {CONTACT_OPTIONS.map(({ value, label }) => {
            const isSelected = preferredContact === value;
            return (
              <button
                key={value}
                onClick={() => onPreferredContactChange(value)}
                className="flex-1 min-h-[40px] rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isSelected ? '#F0FDFA' : '#FFFFFF',
                  color: isSelected ? '#0F766E' : '#374151',
                  border: isSelected ? '2px solid #0F766E' : '1px solid #D1D5DB',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
          How did you hear about us?
        </label>
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map(({ value, label }) => {
            const isSelected = source === value;
            return (
              <button
                key={value}
                onClick={() => onSourceChange(value)}
                className="min-h-[40px] px-4 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isSelected ? '#F0FDFA' : '#FFFFFF',
                  color: isSelected ? '#0F766E' : '#374151',
                  border: isSelected ? '2px solid #0F766E' : '1px solid #D1D5DB',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Referral source */}
      {source === 'referral' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
            Who referred you?
          </label>
          <input
            type="text"
            value={referralSource}
            onChange={(e) => onReferralSourceChange(e.target.value)}
            placeholder="e.g., Jim at Ritchies"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
          />
        </div>
      )}

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-4 transition-opacity"
        style={{
          background: canAdvance ? '#0F766E' : '#9CA3AF',
          opacity: 1,
        }}
      >
        Almost done
      </button>
    </>
  );
}

// ============================================================================
// Screen 7: Timeline
// ============================================================================

function ScreenTimeline({
  selected,
  onSelect,
  onSubmit,
  isPending,
  error,
}: {
  selected: string;
  onSelect: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: Error | null;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        When are you looking to get started?
      </h2>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        This helps us prioritize your project.
      </p>

      <div className="space-y-3 mb-8">
        {TIMELINE_OPTIONS.map(({ value, label, desc, color }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className="w-full rounded-xl p-4 text-left transition-all duration-150 min-h-[60px] flex items-center gap-4"
              style={{
                background: isSelected ? '#F0FDFA' : '#FFFFFF',
                border: isSelected ? '2px solid #0F766E' : '1px solid #E5E7EB',
                boxShadow: isSelected ? '0 0 0 1px #0F766E' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ color: isSelected ? '#0F766E' : '#111827' }}
                >
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                  {desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!selected || isPending}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white transition-opacity"
        style={{
          background: selected ? '#0F766E' : '#9CA3AF',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Saving...' : 'Get My Estimate'}
      </button>

      {error && (
        <p className="text-sm mt-2 text-center" style={{ color: '#EF4444' }}>
          Failed to save lead. Please try again.
        </p>
      )}
    </>
  );
}
