'use client';

/**
 * Quick Lead Capture — /leads/new
 *
 * 30-second form for home show captures. Speed-first.
 * State machine: 'form' → 'success'. [+ Another] loops back.
 * Saves leads as Customer records with structured tags.
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Plus, ArrowRight } from 'lucide-react';
import { useCreateLead } from '@/lib/hooks/useLeadData';
import type { CreateLeadInput } from '@/lib/hooks/useLeadData';

// ============================================================================
// Constants
// ============================================================================

const INTERESTS = [
  { value: 'flooring', label: 'Flooring' },
  { value: 'paint', label: 'Paint' },
  { value: 'trim', label: 'Trim/Doors' },
  { value: 'full-reno', label: 'Full Interior' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'basement', label: 'Basement' },
  { value: 'other', label: 'Other' },
] as const;

const SOURCES = [
  { value: 'home-show', label: 'Home Show' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'social', label: 'Social Media' },
  { value: 'other', label: 'Other' },
] as const;

// ============================================================================
// Page
// ============================================================================

export default function NewLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();
  const nameRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedPhone, setSavedPhone] = useState('');

  const isValid =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    interests.length > 0 &&
    source.length > 0;

  const toggleInterest = useCallback((value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setPhone('');
    setEmail('');
    setInterests([]);
    setSource('');
    setNotes('');
    setView('form');
    // Focus name field after reset
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    if (!isValid || createLead.isPending) return;

    const input: CreateLeadInput = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      interests,
      source,
      notes: notes.trim() || undefined,
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

  // ──────────────── Success view ────────────────
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
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            {savedPhone}
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

  // ──────────────── Form view ────────────────
  return (
    <div className="min-h-screen pb-8" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft size={20} style={{ color: '#6B7280' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>
            New Lead
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5">
        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Name
          </label>
          <input
            ref={nameRef}
            type="text"
            autoCapitalize="words"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah Johnson"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="506-555-0123"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
          />
        </div>

        {/* Email (optional) */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Email{' '}
            <span className="font-normal" style={{ color: '#9CA3AF' }}>
              (optional)
            </span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@example.com"
            className="w-full min-h-[48px] px-4 rounded-xl text-base"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
          />
        </div>

        {/* Interests — multi-select pills */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            What are you interested in?
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(({ value, label }) => {
              const selected = interests.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleInterest(value)}
                  className="min-h-[40px] px-4 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: selected ? '#F0FDFA' : '#FFFFFF',
                    color: selected ? '#0F766E' : '#374151',
                    border: selected ? '2px solid #0F766E' : '1px solid #D1D5DB',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Source — single-select pills */}
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            How did you hear about us?
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map(({ value, label }) => {
              const selected = source === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className="min-h-[40px] px-4 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: selected ? '#F0FDFA' : '#FFFFFF',
                    color: selected ? '#0F766E' : '#374151',
                    border: selected ? '2px solid #0F766E' : '1px solid #D1D5DB',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes (optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
            Notes{' '}
            <span className="font-normal" style={{ color: '#9CA3AF' }}>
              (optional)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., wants LVP in 3 bedrooms"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-base resize-none"
            style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827' }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || createLead.isPending}
          className="w-full min-h-[52px] rounded-xl text-base font-semibold text-white transition-opacity"
          style={{
            background: isValid ? '#0F766E' : '#9CA3AF',
            opacity: createLead.isPending ? 0.7 : 1,
          }}
        >
          {createLead.isPending ? 'Saving...' : 'Save Lead'}
        </button>

        {createLead.error && (
          <p className="text-sm mt-2 text-center" style={{ color: '#EF4444' }}>
            Failed to save lead. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
