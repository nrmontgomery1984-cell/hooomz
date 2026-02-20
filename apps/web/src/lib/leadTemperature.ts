/**
 * Lead Temperature Calculator
 *
 * Derives hot/warm/cool temperature from lead signals.
 * Temperature is DERIVED, never set directly.
 *
 * HOT:  timeline === "asap" AND budget !== "unknown"
 * WARM: timeline === "few_months" OR (asap + unknown budget)
 * COOL: exploring OR (unknown budget + not asap)
 *
 * Referral boost: cool → warm, warm → hot
 */

export type LeadTemperature = 'hot' | 'warm' | 'cool';

export interface TemperatureInput {
  timeline: string;     // 'asap' | 'few_months' | 'exploring'
  budgetRange: string;  // 'under-5k' | '5k-10k' | '10k-20k' | '20k+' | 'unknown'
  leadSource: string;   // 'home_show' | 'referral' | 'website' | 'google' | 'social' | 'ritchies' | 'repeat'
}

export function calculateLeadTemperature(input: TemperatureInput): LeadTemperature {
  const { timeline, budgetRange, leadSource } = input;
  const isReferral = leadSource === 'referral';

  let temp: LeadTemperature;

  if (timeline === 'asap' && budgetRange !== 'unknown') {
    temp = 'hot';
  } else if (
    timeline === 'few_months' ||
    (timeline === 'asap' && budgetRange === 'unknown')
  ) {
    temp = 'warm';
  } else {
    temp = 'cool';
  }

  // Referral boost: bump one level
  if (isReferral) {
    if (temp === 'cool') temp = 'warm';
    else if (temp === 'warm') temp = 'hot';
  }

  return temp;
}

// Temperature display helpers
export const TEMPERATURE_CONFIG: Record<LeadTemperature, { color: string; bgColor: string; label: string }> = {
  hot:  { color: '#EF4444', bgColor: '#FEF2F2', label: 'Hot' },
  warm: { color: '#F59E0B', bgColor: '#FFFBEB', label: 'Warm' },
  cool: { color: '#3B82F6', bgColor: '#EFF6FF', label: 'Cool' },
};
