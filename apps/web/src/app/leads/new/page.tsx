'use client';

/**
 * Conversational Lead Capture — /leads/new
 *
 * 9-screen progressive flow for home show / website captures.
 * Screen 1: Scope signals (what trades)
 * Screen 2: Room details (add rooms with L×W dimensions)
 * Screen 3: Material preferences (per-trade material type)
 * Screen 4: Door/window counts
 * Screen 5: Budget range
 * Screen 6: Instant estimate (the payoff — now sqft-based)
 * Screen 7: Contact info + source
 * Screen 8: Property address
 * Screen 9: Timeline
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

const TOTAL_SCREENS = 9;

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
  { value: 'asap', label: 'As soon as possible', desc: "Let's get moving", color: 'var(--red)' },
  { value: 'few_months', label: 'Next few months', desc: 'Planning ahead', color: 'var(--yellow)' },
  { value: 'exploring', label: 'Just exploring', desc: 'No rush — learning what\'s possible', color: 'var(--blue)' },
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
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('Moncton');
  const [propertyProvince, setPropertyProvince] = useState('NB');
  const [propertyPostalCode, setPropertyPostalCode] = useState('');
  const [propertyType, setPropertyType] = useState<'residential' | 'multi-unit' | 'commercial'>('residential');

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
      propertyAddress: propertyAddress.trim() || undefined,
      propertyCity: propertyCity.trim() || undefined,
      propertyProvince: propertyProvince.trim() || undefined,
      propertyPostalCode: propertyPostalCode.trim() || undefined,
      propertyType,
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
    setPropertyAddress('');
    setPropertyCity('Moncton');
    setPropertyProvince('NB');
    setPropertyPostalCode('');
    setPropertyType('residential');
    setEstimate(null);
    setScreen(1);
    setView('flow');
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  // ══════════════════ SUCCESS VIEW ══════════════════
  if (view === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
        <div className="text-center px-6 max-w-sm w-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--green-bg)' }}
          >
            <Check size={32} style={{ color: 'var(--green)' }} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
            Lead Saved!
          </h2>
          <p className="text-base font-medium" style={{ color: 'var(--charcoal)' }}>
            {savedName}
          </p>
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            {savedPhone}
          </p>

          {estimate && (
            <div
              className="rounded-xl p-3 mb-6 mx-auto max-w-[260px]"
              style={{ background: 'var(--green-bg)', border: '1px solid var(--accent-border)' }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>
                Preliminary Range
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrencyFull(estimate.low)} – {formatCurrencyFull(estimate.high)}
              </p>
              {totalSqft > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {totalSqft.toLocaleString()} sqft
                </p>
              )}
            </div>
          )}

          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            We&apos;ll be in touch within 24 hours.
          </p>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium"
              style={{ background: 'var(--surface)', color: 'var(--charcoal)', border: '1px solid var(--border)' }}
            >
              <Plus size={16} /> Another
            </button>
            <button
              onClick={() => router.push('/leads')}
              className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-base font-medium text-white"
              style={{ background: 'var(--accent)' }}
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft size={20} style={{ color: 'var(--muted)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>
            New Lead
          </h1>
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--muted)' }}>
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
            <ScreenAddress
              propertyAddress={propertyAddress}
              propertyCity={propertyCity}
              propertyProvince={propertyProvince}
              propertyPostalCode={propertyPostalCode}
              propertyType={propertyType}
              onAddressChange={setPropertyAddress}
              onCityChange={setPropertyCity}
              onProvinceChange={setPropertyProvince}
              onPostalCodeChange={setPropertyPostalCode}
              onPropertyTypeChange={setPropertyType}
              canAdvance={propertyAddress.trim().length > 0 && propertyPostalCode.trim().length > 0}
              onNext={goForward}
            />
          )}
          {screen === 9 && (
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
      <div className="fixed bottom-0 left-0 right-0 pb-6 pt-3" style={{ background: 'linear-gradient(transparent, var(--surface-2) 30%)' }}>
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
                  background: isComplete ? 'var(--accent)' : isCurrent ? 'var(--accent)' : 'var(--border)',
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        What are you thinking about?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
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
                background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Icon
                size={20}
                className="mb-2"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--muted)' }}
                strokeWidth={1.5}
              />
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--charcoal)' }}
              >
                {label}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
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
            background: 'var(--accent)',
            color: '#fff',
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Which rooms?
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Add rooms and rough dimensions — don&apos;t worry about being exact.
      </p>

      {/* Added rooms */}
      {rooms.length > 0 && (
        <div className="space-y-3 mb-4">
          {rooms.map((room, idx) => (
            <div
              key={`${room.name}-${idx}`}
              className="rounded-xl p-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
                  {room.name}
                </span>
                <div className="flex items-center gap-2">
                  {room.sqft > 0 && (
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                      {room.sqft} sqft
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveRoom(idx)}
                    className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
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
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
                  />
                </div>
                <span className="text-sm font-medium pt-4" style={{ color: 'var(--muted)' }}>×</span>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
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
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total sqft */}
          {totalSqft > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {totalSqft.toLocaleString()} sqft
              </span>
            </div>
          )}
        </div>
      )}

      {/* Room picker */}
      {showPicker ? (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
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
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-base block mb-0.5">{preset.icon}</span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--mid)' }}>
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
          style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--muted)' }}
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
          background: rooms.length > 0 ? 'var(--accent)' : 'var(--muted)',
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Material preferences
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Helps us give you a better estimate. You can always change your mind later.
      </p>

      <div className="space-y-5">
        {activeTrades.map((trade) => {
          const config = tradeConfig[trade];
          if (!config) return null;
          const currentValue = (materials as Record<string, string | undefined>)[trade] || '';

          return (
            <div key={trade}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
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
                        background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                        color: isSelected ? 'var(--accent)' : 'var(--mid)',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
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
        <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
          No specific material choices needed — we&apos;ll discuss during the site visit.
        </p>
      )}

      <button
        onClick={onNext}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-6"
        style={{ background: 'var(--accent)' }}
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Doors & Windows
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Quick counts help us estimate trim and hardware. Skip if not sure.
      </p>

      {/* Doors */}
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
        Doors
      </p>
      <div className="space-y-2 mb-5">
        <CounterRow label="Exterior" hint="Both sides trimmed" value={doorWindows.exteriorDoors} onChange={(v) => onUpdate('exteriorDoors', v)} />
        <CounterRow label="Interior" hint="Both sides for trim" value={doorWindows.interiorDoors} onChange={(v) => onUpdate('interiorDoors', v)} />
        <CounterRow label="Closet" hint="Bifold / sliding" value={doorWindows.closetDoors} onChange={(v) => onUpdate('closetDoors', v)} />
        <CounterRow label="Patio" hint="Sliding / french" value={doorWindows.patioDoors} onChange={(v) => onUpdate('patioDoors', v)} />
      </div>

      {/* Windows */}
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
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
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
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
        style={{ background: 'var(--accent)' }}
      >
        Next
      </button>
      <button
        onClick={onNext}
        className="w-full min-h-[44px] rounded-xl text-sm font-medium mt-2"
        style={{ color: 'var(--muted)' }}
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
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>{label}</p>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{hint}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-lg font-medium"
          style={{ background: 'var(--surface-2)', color: value > 0 ? 'var(--mid)' : 'var(--border)' }}
        >
          −
        </button>
        <span
          className="w-8 text-center text-sm font-semibold"
          style={{ color: value > 0 ? 'var(--charcoal)' : 'var(--border)' }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-lg font-medium"
          style={{ background: 'var(--green-bg)', color: 'var(--accent)' }}
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
        background: checked ? 'var(--green-bg)' : 'var(--surface)',
        border: checked ? '2px solid var(--accent)' : '1px solid var(--border)',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: checked ? 'var(--accent)' : 'var(--charcoal)' }}>{label}</p>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{hint}</p>
      </div>
      <div
        className="w-10 h-6 rounded-full flex-shrink-0 relative transition-colors"
        style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Do you have a budget range in mind?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
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
                background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <p
                className="text-base font-semibold"
                style={{ color: isSelected ? 'var(--accent)' : 'var(--charcoal)' }}
              >
                {label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Here&apos;s what we&apos;re seeing.
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        {estimate.description} in the Moncton area.
      </p>

      <div
        className="rounded-2xl p-6 text-center mb-4"
        style={{ background: 'var(--surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
          Preliminary Range
        </p>
        <p className="text-4xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
          {formatCurrencyFull(estimate.low)} – {formatCurrencyFull(estimate.high)}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          CAD, before tax
        </p>
      </div>

      <p className="text-[11px] text-center mb-8 px-4" style={{ color: 'var(--muted)' }}>
        This is a preliminary range based on your room sizes and material preferences.
        Your actual estimate will be based on a site visit and detailed scope.
      </p>

      <button
        onClick={onNext}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mb-3"
        style={{ background: 'var(--accent)' }}
      >
        Let&apos;s get specific — book a free site visit
      </button>
      <button
        onClick={onNext}
        className="w-full min-h-[44px] rounded-xl text-sm font-medium"
        style={{ color: 'var(--muted)' }}
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        How should we reach you?
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        We&apos;ll follow up within 24 hours.
      </p>

      {/* Name */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
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
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
        />
      </div>

      {/* Phone */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="506-555-0123"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
          Email <span className="font-normal" style={{ color: 'var(--muted)' }}>(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="sarah@example.com"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
        />
      </div>

      {/* Preferred contact method */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--mid)' }}>
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
                  background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                  color: isSelected ? 'var(--accent)' : 'var(--mid)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
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
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--mid)' }}>
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
                  background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                  color: isSelected ? 'var(--accent)' : 'var(--mid)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
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
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
            Who referred you?
          </label>
          <input
            type="text"
            value={referralSource}
            onChange={(e) => onReferralSourceChange(e.target.value)}
            placeholder="e.g., Jim at Ritchies"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
          />
        </div>
      )}

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-4 transition-opacity"
        style={{
          background: canAdvance ? 'var(--accent)' : 'var(--muted)',
          opacity: 1,
        }}
      >
        Almost done
      </button>
    </>
  );
}

// ============================================================================
// Screen 7b: Property Address
// ============================================================================

const PROPERTY_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'multi-unit', label: 'Multi-Unit' },
  { value: 'commercial', label: 'Commercial' },
] as const;

function ScreenAddress({
  propertyAddress,
  propertyCity,
  propertyProvince,
  propertyPostalCode,
  propertyType,
  onAddressChange,
  onCityChange,
  onProvinceChange,
  onPostalCodeChange,
  onPropertyTypeChange,
  canAdvance,
  onNext,
}: {
  propertyAddress: string;
  propertyCity: string;
  propertyProvince: string;
  propertyPostalCode: string;
  propertyType: 'residential' | 'multi-unit' | 'commercial';
  onAddressChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onProvinceChange: (v: string) => void;
  onPostalCodeChange: (v: string) => void;
  onPropertyTypeChange: (v: 'residential' | 'multi-unit' | 'commercial') => void;
  canAdvance: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        Where&apos;s the property?
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        The address where the work will be done.
      </p>

      {/* Street Address */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
          Property Address
        </label>
        <input
          type="text"
          autoCapitalize="words"
          value={propertyAddress}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="123 Main Street"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
        />
      </div>

      {/* City + Province row */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
            City
          </label>
          <input
            type="text"
            value={propertyCity}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Moncton"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
          />
        </div>
        <div style={{ width: 100 }}>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
            Province
          </label>
          <input
            type="text"
            value={propertyProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            placeholder="NB"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)' }}
          />
        </div>
      </div>

      {/* Postal Code */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mid)' }}>
          Postal Code
        </label>
        <input
          type="text"
          autoCapitalize="characters"
          value={propertyPostalCode}
          onChange={(e) => onPostalCodeChange(e.target.value.toUpperCase())}
          placeholder="E1A 1A1"
          className="w-full min-h-[48px] px-4 rounded-xl text-base"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)', maxWidth: 160 }}
        />
      </div>

      {/* Property Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--mid)' }}>
          Property Type
        </label>
        <div className="flex gap-2">
          {PROPERTY_TYPE_OPTIONS.map(({ value, label }) => {
            const isSelected = propertyType === value;
            return (
              <button
                key={value}
                onClick={() => onPropertyTypeChange(value)}
                className="flex-1 min-h-[40px] rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                  color: isSelected ? 'var(--accent)' : 'var(--mid)',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white mt-4 transition-opacity"
        style={{
          background: canAdvance ? 'var(--accent)' : 'var(--muted)',
          opacity: 1,
        }}
      >
        Almost done
      </button>
    </>
  );
}

// ============================================================================
// Screen 8: Timeline
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
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
        When are you looking to get started?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
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
                background: isSelected ? 'var(--green-bg)' : 'var(--surface)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--charcoal)' }}
                >
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
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
          background: selected ? 'var(--accent)' : 'var(--muted)',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Saving...' : 'Get My Estimate'}
      </button>

      {error && (
        <p className="text-sm mt-2 text-center" style={{ color: 'var(--red)' }}>
          Failed to save lead. Please try again.
        </p>
      )}
    </>
  );
}
