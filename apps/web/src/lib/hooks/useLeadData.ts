'use client';

/**
 * Lead Data Hooks — query, create, and manage leads via Customer tags.
 *
 * Leads are Customer records with structured tags:
 *   'lead'                — identifies as a lead
 *   'passed'              — archived/not-interested (maps to 'lost')
 *   'source:home_show'    — acquisition source
 *   'scope:floors'        — trade interest (new format)
 *   'interest:flooring'   — trade interest (legacy format for intake compat)
 *   'rooms:4'             — room count
 *   'budget:5k-10k'       — budget range
 *   'timeline:asap'       — timeline
 *   'temperature:hot'     — derived temperature
 *   'estimate-low:8000'   — instant estimate low
 *   'estimate-mid:10000'  — instant estimate mid
 *   'estimate-high:12000' — instant estimate high
 *   'preferred-contact:text' — preferred contact method
 *   'referral-source:...' — who referred them
 *   'stage:contacted'     — manual pipeline progression
 *
 * Pipeline stage is DERIVED from tags + linked project status.
 * No new stores, repos, or schema changes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { getLoggedServices, getServices } from '../services';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import { calculateLeadTemperature } from '../leadTemperature';
import type { LeadTemperature } from '../leadTemperature';
import type { DoorWindowInput } from '../instantEstimate';
import {
  ProjectStatus,
  ProjectType,
  ContactMethod,
  CostCategory,
  UnitOfMeasure,
} from '@hooomz/shared-contracts';
import type { Customer, Project, CreateCustomer, UpdateCustomer } from '@hooomz/shared-contracts';
import { calculateEstimateBreakdown } from '../instantEstimate';

// ============================================================================
// Types
// ============================================================================

export type LeadStage = 'new' | 'contacted' | 'discovery' | 'site_visit' | 'quote_sent' | 'won' | 'lost';

export interface LeadRecord {
  customer: Customer;
  stage: LeadStage;
  interests: string[];         // legacy interest:* tags (for intake compat)
  scopeTags: string[];         // new scope:* tags
  source: string;
  linkedProject?: Project;
  timeline: string;            // 'asap' | 'few_months' | 'exploring' | ''
  budgetRange: string;         // 'under-5k' | '5k-10k' | '10k-20k' | '20k+' | 'unknown' | ''
  roomCount: number | null;    // null if not captured
  totalSqft: number | null;    // null if no room dimensions captured
  materialPrefs: Record<string, string>;  // e.g. { floors: 'lvp', paint: 'walls_ceiling' }
  doorWindows: DoorWindowInput | null;    // door/window counts + hardware upsells
  instantEstimate: { low: number; mid: number; high: number } | null;
  temperature: LeadTemperature;
  preferredContact: string;    // 'call' | 'text' | 'email' | ''
  referralSource: string;      // who referred them, or ''
  followUpDate: string | null;     // ISO date string from followup:* tag
  isOverdueFollowUp: boolean;
}

export interface LeadPipelineData {
  leads: LeadRecord[];
  counts: Record<LeadStage, number>;
  isLoading: boolean;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  scopeTags: string[];         // ['floors', 'paint', 'trim']
  source: string;              // 'home_show' | 'website' | 'referral' | etc.
  timeline: string;            // 'asap' | 'few_months' | 'exploring'
  budgetRange: string;         // 'under-5k' | '5k-10k' | '10k-20k' | '20k+' | 'unknown'
  roomCount: number;           // 1-8+, 0 = whole floor
  totalSqft?: number;          // sum of room dimensions (if captured)
  materialPrefs?: Record<string, string>;  // { floors: 'lvp', paint: 'walls_ceiling' }
  doorWindows?: DoorWindowInput;           // door/window counts + hardware upsells
  preferredContact: string;    // 'call' | 'text' | 'email'
  instantEstimate?: { low: number; mid: number; high: number };
  referralSource?: string;
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LEAD_QUERY_KEY = ['local', 'leads'] as const;

/** Human-readable stage labels for activity logging */
const STAGE_LABELS_INTERNAL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  discovery: 'Discovery',
  'site-visit-booked': 'Site Visit Booked',
  site_visit_booked: 'Site Visit Booked',
  site_visit: 'Site Visit',
  'site-visit': 'Site Visit',
  quote_sent: 'Quote Sent',
  estimate_sent: 'Estimate Sent',
  won: 'Won',
  lost: 'Lost',
};

const PLACEHOLDER_ADDRESS = {
  street: 'TBD',
  city: 'Moncton',
  province: 'NB',
  postalCode: 'E1A 0A1',
  country: 'CA',
} as const;

const WON_STATUSES: string[] = [
  ProjectStatus.APPROVED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETE,
];

const QUOTE_STATUSES: string[] = [
  ProjectStatus.QUOTED,
];

const SITE_VISIT_STATUSES: string[] = [
  ProjectStatus.DISCOVERY,
  ProjectStatus.SITE_VISIT,
];

/** Maps new scope tags to ProjectType for intake compatibility */
const SCOPE_TO_PROJECT_TYPE: Record<string, ProjectType> = {
  floors: ProjectType.FLOORING,
  flooring: ProjectType.FLOORING,     // legacy compat
  paint: ProjectType.PAINTING,
  trim: ProjectType.RENOVATION,
  tile: ProjectType.RENOVATION,
  drywall: ProjectType.RENOVATION,
  full_refresh: ProjectType.RENOVATION,
  'full-reno': ProjectType.RENOVATION, // legacy compat
  not_sure: ProjectType.OTHER,
  kitchen: ProjectType.KITCHEN_REMODEL,
  bathroom: ProjectType.BATHROOM_REMODEL,
  basement: ProjectType.BASEMENT_FINISHING,
  other: ProjectType.OTHER,
};

/** Maps new scope tags to legacy interest values for intake wizard compat */
const SCOPE_TO_INTEREST: Record<string, string> = {
  floors: 'flooring',
  paint: 'paint',
  trim: 'trim',
  tile: 'tile',
  drywall: 'drywall',
  full_refresh: 'full-reno',
  not_sure: 'other',
};

const CONTACT_METHOD_MAP: Record<string, ContactMethod> = {
  call: ContactMethod.PHONE,
  text: ContactMethod.PHONE,
  email: ContactMethod.EMAIL,
};

// ============================================================================
// Tag Parsers
// ============================================================================

function parseScopeTags(tags: string[]): string[] {
  return tags
    .filter((t) => t.startsWith('scope:'))
    .map((t) => t.slice('scope:'.length));
}

function parseInterests(tags: string[]): string[] {
  return tags
    .filter((t) => t.startsWith('interest:'))
    .map((t) => t.slice('interest:'.length));
}

function parseSource(tags: string[]): string {
  const sourceTag = tags.find((t) => t.startsWith('source:'));
  return sourceTag ? sourceTag.slice('source:'.length) : 'unknown';
}

function parseTimeline(tags: string[]): string {
  const tag = tags.find((t) => t.startsWith('timeline:'));
  return tag ? tag.slice('timeline:'.length) : '';
}

function parseBudget(tags: string[]): string {
  const tag = tags.find((t) => t.startsWith('budget:'));
  return tag ? tag.slice('budget:'.length) : '';
}

function parseRoomCount(tags: string[]): number | null {
  const tag = tags.find((t) => t.startsWith('rooms:'));
  if (!tag) return null;
  const val = tag.slice('rooms:'.length);
  if (val === 'whole-floor') return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

function parseEstimateRange(tags: string[]): { low: number; mid: number; high: number } | null {
  const lowTag = tags.find((t) => t.startsWith('estimate-low:'));
  const midTag = tags.find((t) => t.startsWith('estimate-mid:'));
  const highTag = tags.find((t) => t.startsWith('estimate-high:'));
  if (!lowTag || !highTag) return null;
  const low = parseInt(lowTag.slice('estimate-low:'.length), 10);
  const mid = midTag ? parseInt(midTag.slice('estimate-mid:'.length), 10) : Math.round((low + parseInt(highTag.slice('estimate-high:'.length), 10)) / 2);
  const high = parseInt(highTag.slice('estimate-high:'.length), 10);
  if (isNaN(low) || isNaN(high)) return null;
  return { low, mid, high };
}

function parsePreferredContact(tags: string[]): string {
  const tag = tags.find((t) => t.startsWith('preferred-contact:'));
  return tag ? tag.slice('preferred-contact:'.length) : '';
}

function parseReferralSource(tags: string[]): string {
  const tag = tags.find((t) => t.startsWith('referral-source:'));
  return tag ? tag.slice('referral-source:'.length) : '';
}

function parseTotalSqft(tags: string[]): number | null {
  const tag = tags.find((t) => t.startsWith('sqft:'));
  if (!tag) return null;
  const val = parseInt(tag.slice('sqft:'.length), 10);
  return isNaN(val) ? null : val;
}

function parseMaterialPrefs(tags: string[]): Record<string, string> {
  const prefs: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.startsWith('material-')) {
      const rest = tag.slice('material-'.length);
      const colonIdx = rest.indexOf(':');
      if (colonIdx > 0) {
        prefs[rest.slice(0, colonIdx)] = rest.slice(colonIdx + 1);
      }
    }
  }
  return prefs;
}

function parseDoorWindows(tags: string[]): DoorWindowInput | null {
  const hasDoorWindowData = tags.some((t) =>
    t.startsWith('doors-') || t.startsWith('windows-') || t.startsWith('upsell:')
  );
  if (!hasDoorWindowData) return null;

  const getInt = (prefix: string): number => {
    const tag = tags.find((t) => t.startsWith(prefix));
    if (!tag) return 0;
    const val = parseInt(tag.slice(prefix.length), 10);
    return isNaN(val) ? 0 : val;
  };

  return {
    exteriorDoors: getInt('doors-exterior:'),
    interiorDoors: getInt('doors-interior:'),
    closetDoors: getInt('doors-closet:'),
    patioDoors: getInt('doors-patio:'),
    windowsSmall: getInt('windows-small:'),
    windowsMedium: getInt('windows-medium:'),
    windowsLarge: getInt('windows-large:'),
    replaceHardware: tags.includes('upsell:hardware'),
    replaceKnobs: tags.includes('upsell:knobs'),
  };
}

function parseManualStage(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith('stage:'));
  return tag ? tag.slice('stage:'.length) : null;
}

function parseFollowUpDate(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith('followup:'));
  return tag ? tag.slice('followup:'.length) : null;
}

// ============================================================================
// Stage Derivation
// ============================================================================

function deriveStage(customer: Customer, linkedProject?: Project): LeadStage {
  const tags = customer.tags || [];

  // Manual lost/passed
  if (tags.includes('passed')) return 'lost';

  // Project-based stages (ordered from furthest along to earliest)
  if (linkedProject) {
    if (WON_STATUSES.includes(linkedProject.status)) return 'won';
    if (QUOTE_STATUSES.includes(linkedProject.status)) return 'quote_sent';
    if (SITE_VISIT_STATUSES.includes(linkedProject.status)) return 'site_visit';
    if (linkedProject.status === ProjectStatus.LEAD) return 'discovery';
  }

  // Manual stage progression (no project yet)
  const manualStage = parseManualStage(tags);
  if (manualStage === 'site-visit-booked') return 'contacted';
  if (manualStage === 'contacted') return 'contacted';

  return 'new';
}

// ============================================================================
// Helpers
// ============================================================================

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Query all leads and derive pipeline stages.
 * Fetches customers with 'lead' or 'passed' tags + all projects for linkage.
 */
export function useLeadPipeline(): LeadPipelineData {
  const { services, isLoading: servicesLoading } = useServicesContext();

  const { data, isLoading } = useQuery({
    queryKey: LEAD_QUERY_KEY,
    queryFn: async () => {
      if (!services) throw new Error('Services not initialized');

      const [customerResult, projectResult] = await Promise.all([
        services.customers.findAll(),
        services.projects.findAll(),
      ]);

      const allCustomers = customerResult.customers || [];
      const allProjects = projectResult.projects || [];

      // Filter to leads + passed
      const leadCustomers = allCustomers.filter((c) => {
        const tags = c.tags || [];
        return tags.includes('lead') || tags.includes('passed');
      });

      // Build lead records
      const leads: LeadRecord[] = leadCustomers.map((customer) => {
        const linkedProject = allProjects.find(
          (p) => p.clientId === customer.id
        );
        const tags = customer.tags || [];

        const source = parseSource(tags);
        const timeline = parseTimeline(tags);
        const budgetRange = parseBudget(tags);

        const temperature = (timeline && budgetRange)
          ? calculateLeadTemperature({
              timeline,
              budgetRange: budgetRange || 'unknown',
              leadSource: source,
            })
          : 'cool' as LeadTemperature;

        const followUpDate = parseFollowUpDate(tags);
        const today = new Date().toISOString().slice(0, 10);
        const isOverdueFollowUp = !!followUpDate && followUpDate < today;

        return {
          customer,
          stage: deriveStage(customer, linkedProject),
          interests: parseInterests(tags),
          scopeTags: parseScopeTags(tags),
          source,
          linkedProject,
          timeline,
          budgetRange,
          roomCount: parseRoomCount(tags),
          totalSqft: parseTotalSqft(tags),
          materialPrefs: parseMaterialPrefs(tags),
          doorWindows: parseDoorWindows(tags),
          instantEstimate: parseEstimateRange(tags),
          temperature,
          preferredContact: parsePreferredContact(tags),
          referralSource: parseReferralSource(tags),
          followUpDate,
          isOverdueFollowUp,
        };
      });

      // Sort by temperature (hot first), then newest first within same temp
      const tempOrder: Record<string, number> = { hot: 0, warm: 1, cool: 2 };
      leads.sort((a, b) => {
        const tempDiff = (tempOrder[a.temperature] ?? 2) - (tempOrder[b.temperature] ?? 2);
        if (tempDiff !== 0) return tempDiff;
        const aTime = new Date(a.customer.metadata.createdAt).getTime();
        const bTime = new Date(b.customer.metadata.createdAt).getTime();
        return bTime - aTime;
      });

      return leads;
    },
    enabled: !servicesLoading && !!services,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const leads = data ?? [];

  const counts: Record<LeadStage, number> = {
    new: leads.filter((l) => l.stage === 'new').length,
    contacted: leads.filter((l) => l.stage === 'contacted').length,
    discovery: leads.filter((l) => l.stage === 'discovery').length,
    site_visit: leads.filter((l) => l.stage === 'site_visit').length,
    quote_sent: leads.filter((l) => l.stage === 'quote_sent').length,
    won: leads.filter((l) => l.stage === 'won').length,
    lost: leads.filter((l) => l.stage === 'lost').length,
  };

  return { leads, counts, isLoading: isLoading || servicesLoading };
}

/**
 * Create a new lead (Customer with structured tags).
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const loggedServices = getLoggedServices();

      const { firstName, lastName } = splitName(capitalizeWords(input.name));

      // Build tags array — both new scope:* and legacy interest:* for intake compat
      const tags: string[] = [
        'lead',
        `source:${input.source}`,
        `timeline:${input.timeline}`,
        `budget:${input.budgetRange}`,
        `rooms:${input.roomCount === 0 ? 'whole-floor' : input.roomCount}`,
        `preferred-contact:${input.preferredContact}`,
      ];

      // Scope tags (new format)
      for (const scope of input.scopeTags) {
        tags.push(`scope:${scope}`);
      }

      // Interest tags (legacy format for intake wizard compatibility)
      for (const scope of input.scopeTags) {
        const interest = SCOPE_TO_INTEREST[scope];
        if (interest) {
          tags.push(`interest:${interest}`);
        }
      }

      // Temperature (derived)
      const temperature = calculateLeadTemperature({
        timeline: input.timeline,
        budgetRange: input.budgetRange,
        leadSource: input.source,
      });
      tags.push(`temperature:${temperature}`);

      // Instant estimate
      if (input.instantEstimate) {
        tags.push(`estimate-low:${input.instantEstimate.low}`);
        tags.push(`estimate-mid:${input.instantEstimate.mid}`);
        tags.push(`estimate-high:${input.instantEstimate.high}`);
      }

      // Total sqft
      if (input.totalSqft && input.totalSqft > 0) {
        tags.push(`sqft:${input.totalSqft}`);
      }

      // Material preferences
      if (input.materialPrefs) {
        for (const [trade, pref] of Object.entries(input.materialPrefs)) {
          if (pref) {
            tags.push(`material-${trade}:${pref}`);
          }
        }
      }

      // Door/window counts + upsells
      if (input.doorWindows) {
        const dw = input.doorWindows;
        if (dw.exteriorDoors > 0) tags.push(`doors-exterior:${dw.exteriorDoors}`);
        if (dw.interiorDoors > 0) tags.push(`doors-interior:${dw.interiorDoors}`);
        if (dw.closetDoors > 0) tags.push(`doors-closet:${dw.closetDoors}`);
        if (dw.patioDoors > 0) tags.push(`doors-patio:${dw.patioDoors}`);
        if (dw.windowsSmall > 0) tags.push(`windows-small:${dw.windowsSmall}`);
        if (dw.windowsMedium > 0) tags.push(`windows-medium:${dw.windowsMedium}`);
        if (dw.windowsLarge > 0) tags.push(`windows-large:${dw.windowsLarge}`);
        if (dw.replaceHardware) tags.push('upsell:hardware');
        if (dw.replaceKnobs) tags.push('upsell:knobs');
      }

      // Referral source
      if (input.referralSource) {
        tags.push(`referral-source:${input.referralSource}`);
      }

      // Email is required by schema — use placeholder if not provided
      const email = input.email || `lead-${Date.now()}@noemail.hooomz.local`;

      const data: CreateCustomer = {
        firstName,
        lastName,
        email,
        phone: input.phone || '',
        type: 'residential',
        address: PLACEHOLDER_ADDRESS,
        tags,
        notes: input.notes || undefined,
        preferredContactMethod: CONTACT_METHOD_MAP[input.preferredContact] || ContactMethod.PHONE,
      };

      return loggedServices.customers.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

// ============================================================================
// Types for Update
// ============================================================================

export interface UpdateLeadInput {
  customerId: string;
  customerName: string;           // for activity summary
  name?: string;
  phone?: string;
  email?: string;
  scopeTags?: string[];
  budgetRange?: string;
  timeline?: string;
  roomCount?: number;
  totalSqft?: number;
  materialPrefs?: Record<string, string>;
  doorWindows?: DoorWindowInput;
  preferredContact?: string;
  source?: string;
  referralSource?: string;
  notes?: string;
}

// Labels for human-readable activity descriptions
const DIFF_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  scopeTags: 'Scope',
  budgetRange: 'Budget',
  timeline: 'Timeline',
  roomCount: 'Room count',
  totalSqft: 'Total sqft',
  materialPrefs: 'Materials',
  doorWindows: 'Doors & Windows',
  preferredContact: 'Preferred contact',
  source: 'Source',
  referralSource: 'Referral source',
  notes: 'Notes',
};

/**
 * Compute a human-readable diff between old and new lead values.
 */
function computeLeadDiff(
  oldCustomer: Customer,
  input: UpdateLeadInput
): string[] {
  const changes: string[] = [];
  const oldTags = oldCustomer.tags || [];

  if (input.name !== undefined) {
    const oldName = `${oldCustomer.firstName} ${oldCustomer.lastName}`.trim();
    if (input.name !== oldName) {
      changes.push(`${DIFF_LABELS.name}: "${oldName}" → "${input.name}"`);
    }
  }
  if (input.phone !== undefined && input.phone !== (oldCustomer.phone || '')) {
    changes.push(`${DIFF_LABELS.phone}: "${oldCustomer.phone || ''}" → "${input.phone}"`);
  }
  if (input.email !== undefined) {
    const oldEmail = (oldCustomer.email || '').includes('@noemail.') ? '' : (oldCustomer.email || '');
    if (input.email !== oldEmail) {
      changes.push(`${DIFF_LABELS.email}: "${oldEmail}" → "${input.email}"`);
    }
  }
  if (input.scopeTags !== undefined) {
    const oldScopes = parseScopeTags(oldTags);
    const oldStr = oldScopes.sort().join(', ');
    const newStr = [...input.scopeTags].sort().join(', ');
    if (oldStr !== newStr) {
      changes.push(`${DIFF_LABELS.scopeTags}: [${oldStr}] → [${newStr}]`);
    }
  }
  if (input.budgetRange !== undefined && input.budgetRange !== parseBudget(oldTags)) {
    changes.push(`${DIFF_LABELS.budgetRange}: "${parseBudget(oldTags)}" → "${input.budgetRange}"`);
  }
  if (input.timeline !== undefined && input.timeline !== parseTimeline(oldTags)) {
    changes.push(`${DIFF_LABELS.timeline}: "${parseTimeline(oldTags)}" → "${input.timeline}"`);
  }
  if (input.roomCount !== undefined) {
    const oldRooms = parseRoomCount(oldTags);
    if (input.roomCount !== oldRooms) {
      changes.push(`${DIFF_LABELS.roomCount}: ${oldRooms ?? 'none'} → ${input.roomCount}`);
    }
  }
  if (input.totalSqft !== undefined) {
    const oldSqft = parseTotalSqft(oldTags);
    if (input.totalSqft !== oldSqft) {
      changes.push(`${DIFF_LABELS.totalSqft}: ${oldSqft ?? 'none'} → ${input.totalSqft}`);
    }
  }
  if (input.materialPrefs !== undefined) {
    const oldPrefs = parseMaterialPrefs(oldTags);
    const oldStr = Object.entries(oldPrefs).map(([k, v]) => `${k}:${v}`).sort().join(', ');
    const newStr = Object.entries(input.materialPrefs).map(([k, v]) => `${k}:${v}`).sort().join(', ');
    if (oldStr !== newStr) {
      changes.push(`${DIFF_LABELS.materialPrefs}: [${oldStr}] → [${newStr}]`);
    }
  }
  if (input.doorWindows !== undefined) {
    const oldDw = parseDoorWindows(oldTags);
    const dwStr = (dw: DoorWindowInput | null) => {
      if (!dw) return 'none';
      const parts: string[] = [];
      if (dw.exteriorDoors) parts.push(`${dw.exteriorDoors} ext`);
      if (dw.interiorDoors) parts.push(`${dw.interiorDoors} int`);
      if (dw.closetDoors) parts.push(`${dw.closetDoors} closet`);
      if (dw.patioDoors) parts.push(`${dw.patioDoors} patio`);
      if (dw.windowsSmall) parts.push(`${dw.windowsSmall} sm win`);
      if (dw.windowsMedium) parts.push(`${dw.windowsMedium} md win`);
      if (dw.windowsLarge) parts.push(`${dw.windowsLarge} lg win`);
      if (dw.replaceHardware) parts.push('hardware');
      if (dw.replaceKnobs) parts.push('knobs');
      return parts.length > 0 ? parts.join(', ') : 'none';
    };
    const oldStr = dwStr(oldDw);
    const newStr = dwStr(input.doorWindows);
    if (oldStr !== newStr) {
      changes.push(`${DIFF_LABELS.doorWindows}: [${oldStr}] → [${newStr}]`);
    }
  }
  if (input.preferredContact !== undefined && input.preferredContact !== parsePreferredContact(oldTags)) {
    changes.push(`${DIFF_LABELS.preferredContact}: "${parsePreferredContact(oldTags)}" → "${input.preferredContact}"`);
  }
  if (input.source !== undefined && input.source !== parseSource(oldTags)) {
    changes.push(`${DIFF_LABELS.source}: "${parseSource(oldTags)}" → "${input.source}"`);
  }
  if (input.referralSource !== undefined && input.referralSource !== parseReferralSource(oldTags)) {
    changes.push(`${DIFF_LABELS.referralSource}: "${parseReferralSource(oldTags)}" → "${input.referralSource}"`);
  }
  if (input.notes !== undefined && input.notes !== (oldCustomer.notes || '')) {
    changes.push(`${DIFF_LABELS.notes} updated`);
  }

  return changes;
}

/**
 * Update a lead's intake data and log changes to the activity spine.
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLeadInput) => {
      const loggedServices = getLoggedServices();
      const customer = await loggedServices.customers.findById(input.customerId);
      if (!customer) throw new Error('Customer not found');

      // Compute diff before we change anything
      const changes = computeLeadDiff(customer, input);
      if (changes.length === 0) return { customer, changes: [] };

      // --- Rebuild tags ---
      const oldTags = customer.tags || [];

      // Start with tags that aren't lead-intake-related
      const preservedTags = oldTags.filter((t) =>
        !t.startsWith('scope:') &&
        !t.startsWith('interest:') &&
        !t.startsWith('source:') &&
        !t.startsWith('timeline:') &&
        !t.startsWith('budget:') &&
        !t.startsWith('rooms:') &&
        !t.startsWith('sqft:') &&
        !t.startsWith('material-') &&
        !t.startsWith('doors-') &&
        !t.startsWith('windows-') &&
        !t.startsWith('upsell:') &&
        !t.startsWith('preferred-contact:') &&
        !t.startsWith('referral-source:') &&
        !t.startsWith('temperature:') &&
        !t.startsWith('estimate-low:') &&
        !t.startsWith('estimate-mid:') &&
        !t.startsWith('estimate-high:')
      );

      // Use new values, falling back to old parsed values
      const scopeTags = input.scopeTags ?? parseScopeTags(oldTags);
      const source = input.source ?? parseSource(oldTags);
      const timeline = input.timeline ?? parseTimeline(oldTags);
      const budgetRange = input.budgetRange ?? parseBudget(oldTags);
      const roomCount = input.roomCount ?? parseRoomCount(oldTags);
      const totalSqft = input.totalSqft ?? parseTotalSqft(oldTags);
      const materialPrefs = input.materialPrefs ?? parseMaterialPrefs(oldTags);
      const preferredContact = input.preferredContact ?? parsePreferredContact(oldTags);
      const referralSource = input.referralSource ?? parseReferralSource(oldTags);

      const newTags = [...preservedTags];

      // Source
      if (source && source !== 'unknown') newTags.push(`source:${source}`);
      // Timeline
      if (timeline) newTags.push(`timeline:${timeline}`);
      // Budget
      if (budgetRange) newTags.push(`budget:${budgetRange}`);
      // Room count
      if (roomCount !== null) {
        newTags.push(`rooms:${roomCount === 0 ? 'whole-floor' : roomCount}`);
      }
      // Preferred contact
      if (preferredContact) newTags.push(`preferred-contact:${preferredContact}`);

      // Scope tags (new + legacy interest)
      for (const scope of scopeTags) {
        newTags.push(`scope:${scope}`);
        const interest = SCOPE_TO_INTEREST[scope];
        if (interest) newTags.push(`interest:${interest}`);
      }

      // Temperature (recalculated)
      if (timeline && budgetRange) {
        const temperature = calculateLeadTemperature({
          timeline,
          budgetRange: budgetRange || 'unknown',
          leadSource: source,
        });
        newTags.push(`temperature:${temperature}`);
      }

      // Re-add old estimate tags (estimate isn't editable inline)
      const oldEstimate = parseEstimateRange(oldTags);
      if (oldEstimate) {
        newTags.push(`estimate-low:${oldEstimate.low}`);
        newTags.push(`estimate-mid:${oldEstimate.mid}`);
        newTags.push(`estimate-high:${oldEstimate.high}`);
      }

      // Total sqft
      if (totalSqft !== null && totalSqft > 0) {
        newTags.push(`sqft:${totalSqft}`);
      }

      // Material preferences
      for (const [trade, pref] of Object.entries(materialPrefs)) {
        if (pref) newTags.push(`material-${trade}:${pref}`);
      }

      // Door/window counts + upsells
      const doorWindows = input.doorWindows ?? parseDoorWindows(oldTags);
      if (doorWindows) {
        if (doorWindows.exteriorDoors > 0) newTags.push(`doors-exterior:${doorWindows.exteriorDoors}`);
        if (doorWindows.interiorDoors > 0) newTags.push(`doors-interior:${doorWindows.interiorDoors}`);
        if (doorWindows.closetDoors > 0) newTags.push(`doors-closet:${doorWindows.closetDoors}`);
        if (doorWindows.patioDoors > 0) newTags.push(`doors-patio:${doorWindows.patioDoors}`);
        if (doorWindows.windowsSmall > 0) newTags.push(`windows-small:${doorWindows.windowsSmall}`);
        if (doorWindows.windowsMedium > 0) newTags.push(`windows-medium:${doorWindows.windowsMedium}`);
        if (doorWindows.windowsLarge > 0) newTags.push(`windows-large:${doorWindows.windowsLarge}`);
        if (doorWindows.replaceHardware) newTags.push('upsell:hardware');
        if (doorWindows.replaceKnobs) newTags.push('upsell:knobs');
      }

      // Referral source
      if (referralSource) newTags.push(`referral-source:${referralSource}`);

      // --- Update customer record ---
      const updatePayload: UpdateCustomer = { id: input.customerId, tags: newTags };

      if (input.name !== undefined) {
        const { firstName, lastName } = splitName(capitalizeWords(input.name));
        updatePayload.firstName = firstName;
        updatePayload.lastName = lastName;
      }
      if (input.phone !== undefined) updatePayload.phone = input.phone;
      if (input.email !== undefined) {
        updatePayload.email = input.email || `lead-${Date.now()}@noemail.hooomz.local`;
      }
      if (input.notes !== undefined) updatePayload.notes = input.notes || undefined;
      if (input.preferredContact !== undefined) {
        updatePayload.preferredContactMethod =
          CONTACT_METHOD_MAP[input.preferredContact] || ContactMethod.PHONE;
      }

      const updated = await loggedServices.customers.update(input.customerId, updatePayload);

      // --- Log activity event ---
      try {
        const services = getServices();
        const summary = changes.length <= 2
          ? `Intake edited for ${input.customerName}: ${changes.join('; ')}`
          : `Intake edited for ${input.customerName}: ${changes.length} fields changed — ${changes.slice(0, 2).join('; ')}…`;

        await services.activity.create({
          event_type: 'lead.intake_edited',
          project_id: '',
          entity_type: 'customer',
          entity_id: input.customerId,
          summary,
          event_data: { changes },
        });
      } catch (err) {
        console.error('Failed to log lead.intake_edited:', err);
      }

      return { customer: updated, changes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Update a lead's pipeline stage manually (contacted, site_visit_booked).
 */
export function useUpdateLeadStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, targetStage, customerName }: { customerId: string; targetStage: string; customerName?: string }) => {
      const loggedServices = getLoggedServices();
      const customer = await loggedServices.customers.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const currentTags = customer.tags || [];
      const fromStage = parseManualStage(currentTags) || 'new';

      // Remove any existing stage:* tags
      const newTags = [
        ...currentTags.filter((t) => !t.startsWith('stage:')),
        `stage:${targetStage}`,
      ];

      const updated = await loggedServices.customers.update(customerId, { id: customerId, tags: newTags });

      // Log activity event
      const name = customerName || `${customer.firstName} ${customer.lastName}`.trim();
      const toLabel = STAGE_LABELS_INTERNAL[targetStage] || targetStage;
      const fromLabel = STAGE_LABELS_INTERNAL[fromStage] || fromStage;
      try {
        const services = getServices();
        await services.activity.create({
          event_type: 'lead.stage_changed',
          project_id: `lead-${customerId}`,
          entity_type: 'lead',
          entity_id: customerId,
          summary: `Stage changed for ${name}: ${fromLabel} → ${toLabel}`,
          event_data: { from_stage: fromStage, to_stage: targetStage },
        });
      } catch (err) {
        console.error('Failed to log lead.stage_changed:', err);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Create a project from a lead and navigate to estimate flow.
 */
export function useCreateProjectFromLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: LeadRecord) => {
      const loggedServices = getLoggedServices();

      // Use scope tags first, fall back to interests
      const primaryScope = lead.scopeTags[0] || lead.interests[0] || 'other';
      const projectType = SCOPE_TO_PROJECT_TYPE[primaryScope] || ProjectType.OTHER;
      const scopeLabel = capitalizeWords(primaryScope.replace(/[_-]/g, ' '));

      const data = {
        name: `${lead.customer.lastName || lead.customer.firstName} - ${scopeLabel}`,
        status: ProjectStatus.LEAD,
        clientId: lead.customer.id,
        address: lead.customer.address,
        projectType,
        dates: {},
        budget: { estimatedCost: 0, actualCost: 0 },
      };

      const project = await loggedServices.projects.create(data);

      // Log activity event
      const name = `${lead.customer.firstName} ${lead.customer.lastName}`.trim();
      try {
        const services = getServices();
        await services.activity.create({
          event_type: 'lead.project_created',
          project_id: project.id,
          entity_type: 'lead',
          entity_id: lead.customer.id,
          summary: `Project created from lead: ${name} — ${scopeLabel}`,
          event_data: { project_id: project.id, project_name: data.name },
        });
      } catch (err) {
        console.error('Failed to log lead.project_created:', err);
      }

      // Seed estimate line items from intake data
      try {
        const scopeTagsForEstimate = lead.scopeTags.length > 0 ? lead.scopeTags : lead.interests;
        if (scopeTagsForEstimate.length > 0) {
          const breakdown = calculateEstimateBreakdown({
            scopeTags: scopeTagsForEstimate,
            roomCount: lead.roomCount ?? 3,
            totalSqft: lead.totalSqft ?? 0,
            materialPrefs: lead.materialPrefs,
            doorWindows: lead.doorWindows ?? undefined,
          });

          if (breakdown.lines.length > 0) {
            const services = getServices();
            const lineItemRepo = services.estimating.lineItems;

            // Map trade names → CostCategory
            const tradeToCostCategory: Record<string, CostCategory> = {
              Floors: CostCategory.FLOORING,
              Flooring: CostCategory.FLOORING,
              Paint: CostCategory.PAINTING,
              Painting: CostCategory.PAINTING,
              Trim: CostCategory.INTERIOR_TRIM,
              'Finish Carpentry': CostCategory.INTERIOR_TRIM,
              Tile: CostCategory.OTHER,
              Drywall: CostCategory.DRYWALL,
              Doors: CostCategory.WINDOWS_DOORS,
              Windows: CostCategory.WINDOWS_DOORS,
            };

            // Map unit strings → UnitOfMeasure
            const unitMap: Record<string, UnitOfMeasure> = {
              sqft: UnitOfMeasure.SQUARE_FOOT,
              lft: UnitOfMeasure.LINEAR_FOOT,
              lf: UnitOfMeasure.LINEAR_FOOT,
              each: UnitOfMeasure.EACH,
              rooms: UnitOfMeasure.EACH,
            };

            // Map trade names → default sopCodes so approval can generate tasks
            const tradeToSopCodes: Record<string, string[]> = {
              Floors: ['HI-SOP-FL-004'],
              Flooring: ['HI-SOP-FL-004'],
              Paint: ['HI-SOP-PT-002'],
              Painting: ['HI-SOP-PT-002'],
              Trim: ['HI-SOP-FC-003'],
              'Finish Carpentry': ['HI-SOP-FC-003'],
              Tile: ['HI-SOP-FL-001'],
              Drywall: ['HI-SOP-DW-002'],
              Doors: ['HI-SOP-FC-005'],
              Windows: ['HI-SOP-FC-002'],
            };

            for (const line of breakdown.lines) {
              const category = tradeToCostCategory[line.trade] || CostCategory.OTHER;
              const unit = unitMap[line.unit] || UnitOfMeasure.EACH;
              const totalCost = Math.round(line.quantity * line.rate * 100) / 100;
              const sopCodes = tradeToSopCodes[line.trade] || [];

              await lineItemRepo.create({
                projectId: project.id,
                category,
                description: `${line.trade} — ${line.material}`,
                quantity: line.quantity,
                unit,
                unitCost: line.rate,
                totalCost,
                isLabor: false,
                sopCodes,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to seed estimate line items:', err);
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Pass/lose a lead — remove 'lead' tag, add 'passed' tag.
 */
export function usePassLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const loggedServices = getLoggedServices();
      const customer = await loggedServices.customers.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const currentTags = customer.tags || [];
      const newTags = [
        ...currentTags.filter((t) => t !== 'lead'),
        'passed',
      ];

      const updated = await loggedServices.customers.update(customerId, { id: customerId, tags: newTags });

      // Log activity event
      const name = `${customer.firstName} ${customer.lastName}`.trim();
      try {
        const services = getServices();
        await services.activity.create({
          event_type: 'lead.passed',
          project_id: `lead-${customerId}`,
          entity_type: 'lead',
          entity_id: customerId,
          summary: `Lead passed: ${name}`,
          event_data: {},
        });
      } catch (err) {
        console.error('Failed to log lead.passed:', err);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Delete a lead — removes the Customer record and linked Project (if any).
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, projectId, customerName }: { customerId: string; projectId?: string; customerName?: string }) => {
      const loggedServices = getLoggedServices();

      // Log before deleting (so we still have the customer ID)
      if (customerName) {
        try {
          const services = getServices();
          await services.activity.create({
            event_type: 'lead.deleted',
            project_id: projectId || `lead-${customerId}`,
            entity_type: 'lead',
            entity_id: customerId,
            summary: `Lead deleted: ${customerName}`,
            event_data: { had_project: !!projectId },
          });
        } catch (err) {
          console.error('Failed to log lead.deleted:', err);
        }
      }

      if (projectId) {
        await loggedServices.projects.delete(projectId).catch(() => {
          // Project may already be gone
        });
      }

      return loggedServices.customers.delete(customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Restore a lost lead — remove 'passed' tag, re-add 'lead' tag.
 */
export function useRestoreLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const loggedServices = getLoggedServices();
      const customer = await loggedServices.customers.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const currentTags = customer.tags || [];
      const newTags = [
        ...currentTags.filter((t) => t !== 'passed'),
        'lead',
      ];

      const updated = await loggedServices.customers.update(customerId, { id: customerId, tags: newTags });

      // Log activity event
      const name = `${customer.firstName} ${customer.lastName}`.trim();
      try {
        const services = getServices();
        await services.activity.create({
          event_type: 'lead.restored',
          project_id: `lead-${customerId}`,
          entity_type: 'lead',
          entity_id: customerId,
          summary: `Lead restored: ${name}`,
          event_data: {},
        });
      } catch (err) {
        console.error('Failed to log lead.restored:', err);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Mark site visit as done — advances project from DISCOVERY to SITE_VISIT.
 */
export function useMarkSiteVisitDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, customerName }: { projectId: string; customerName: string }) => {
      const loggedServices = getLoggedServices();
      const services = getServices();

      // Advance project status
      await loggedServices.projects.update(projectId, { status: ProjectStatus.SITE_VISIT });

      // Log activity event
      try {
        await services.activity.create({
          event_type: 'lead.site_visit_done',
          project_id: projectId,
          entity_type: 'project',
          entity_id: projectId,
          summary: `Site visit completed for ${customerName}`,
          event_data: {},
        });
      } catch (err) {
        console.error('Failed to log lead.site_visit_done:', err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
      queryClient.invalidateQueries({ queryKey: ['lead-timeline'] });
    },
  });
}

// ============================================================================
// Structured Lead Activity (Dropdown-based notes + timeline)
// ============================================================================

export type LeadActivityType = 'call' | 'text' | 'email' | 'site_visit' | 'meeting' | 'internal_note';
export type LeadNoteTopic = 'pricing' | 'scope' | 'timeline' | 'materials' | 'scheduling' | 'follow_up' | 'objection' | 'decision' | 'other';
export type LeadNoteOutcome = 'positive' | 'neutral' | 'needs_follow_up' | 'no_answer' | 'declined';

export const LEAD_ACTIVITY_TYPE_OPTIONS: { value: LeadActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'internal_note', label: 'Note' },
];

export const LEAD_TOPIC_OPTIONS: { value: LeadNoteTopic; label: string }[] = [
  { value: 'pricing', label: 'Pricing' },
  { value: 'scope', label: 'Scope' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'materials', label: 'Materials' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'objection', label: 'Objection' },
  { value: 'decision', label: 'Decision' },
  { value: 'other', label: 'Other' },
];

export const LEAD_OUTCOME_OPTIONS: { value: LeadNoteOutcome; label: string }[] = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'needs_follow_up', label: 'Follow-up' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'declined', label: 'Declined' },
];

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: 'Call',
  text: 'Text',
  email: 'Email',
  site_visit: 'Site Visit',
  meeting: 'Meeting',
  internal_note: 'Note',
};

export const TOPIC_LABELS: Record<string, string> = {
  pricing: 'Pricing',
  scope: 'Scope',
  timeline: 'Timeline',
  materials: 'Materials',
  scheduling: 'Scheduling',
  follow_up: 'Follow-up',
  objection: 'Objection',
  decision: 'Decision',
  other: 'Other',
};

export const OUTCOME_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  needs_follow_up: 'Needs Follow-up',
  no_answer: 'No Answer',
  declined: 'Declined',
};

export interface AddLeadNoteInput {
  customerId: string;
  customerName: string;
  linkedProjectId?: string;
  activityType: LeadActivityType;
  topic: LeadNoteTopic;
  outcome: LeadNoteOutcome;
  detail?: string;
}

/**
 * Add a structured note to a lead's activity timeline.
 * Uses dropdowns for activity type, topic, and outcome to keep data consistent.
 */
export function useAddLeadNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddLeadNoteInput) => {
      const services = getServices();
      const typeLabel = ACTIVITY_TYPE_LABELS[input.activityType] || input.activityType;
      const topicLabel = TOPIC_LABELS[input.topic] || input.topic;
      const outcomeLabel = OUTCOME_LABELS[input.outcome] || input.outcome;

      const summary = input.detail
        ? `${typeLabel} — ${topicLabel} — ${outcomeLabel}: ${input.detail}`
        : `${typeLabel} — ${topicLabel} — ${outcomeLabel}`;

      return services.activity.create({
        event_type: 'lead.note',
        project_id: input.linkedProjectId || `lead-${input.customerId}`,
        entity_type: 'lead',
        entity_id: input.customerId,
        summary,
        event_data: {
          activity_type: input.activityType,
          topic: input.topic,
          outcome: input.outcome,
          detail: input.detail || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
      queryClient.invalidateQueries({ queryKey: ['lead-timeline'] });
    },
  });
}

/**
 * Query activity timeline for a lead.
 * Fetches events where entity_type='lead' AND entity_id=customerId,
 * plus events for the linked project (if any).
 */
export function useLeadTimeline(customerId: string | null, linkedProjectId?: string) {
  return useQuery({
    queryKey: ['lead-timeline', customerId, linkedProjectId],
    queryFn: async () => {
      if (!customerId) return [];
      const services = getServices();
      const repo = services.activity.getRepository();

      // Fetch lead-specific events by entity
      const leadEvents = await repo.findByEntity('lead', customerId, { limit: 100 });

      // If there's a linked project, also fetch project events
      let projectEvents: typeof leadEvents = [];
      if (linkedProjectId) {
        const projectResult = await repo.findByProject(linkedProjectId, { limit: 50 });
        // Filter out duplicates (events that already matched by entity)
        const leadEventIds = new Set(leadEvents.map((e) => e.id));
        projectEvents = projectResult.events.filter((e) => !leadEventIds.has(e.id));
      }

      // Merge and sort by timestamp descending
      const all = [...leadEvents, ...projectEvents];
      all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return all;
    },
    enabled: !!customerId,
    staleTime: 0,
  });
}

/**
 * Set or clear a follow-up date on a lead.
 * Stored as a `followup:YYYY-MM-DD` tag on the customer.
 */
export function useSetFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, date, customerName }: { customerId: string; date: string | null; customerName?: string }) => {
      const loggedServices = getLoggedServices();
      const customer = await loggedServices.customers.findById(customerId);
      if (!customer) throw new Error('Customer not found');

      const currentTags = customer.tags || [];
      // Remove any existing followup:* tag
      const newTags = currentTags.filter((t) => !t.startsWith('followup:'));
      if (date) {
        newTags.push(`followup:${date}`);
      }

      const updated = await loggedServices.customers.update(customerId, { id: customerId, tags: newTags });

      // Log activity event
      const name = customerName || `${customer.firstName} ${customer.lastName}`.trim();
      try {
        const services = getServices();
        await services.activity.create({
          event_type: date ? 'lead.followup_set' : 'lead.followup_cleared',
          project_id: `lead-${customerId}`,
          entity_type: 'lead',
          entity_id: customerId,
          summary: date
            ? `Follow-up set for ${name}: ${date}`
            : `Follow-up cleared for ${name}`,
          event_data: { date },
        });
      } catch (err) {
        console.error('Failed to log follow-up event:', err);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
      queryClient.invalidateQueries({ queryKey: ['lead-timeline'] });
    },
  });
}
