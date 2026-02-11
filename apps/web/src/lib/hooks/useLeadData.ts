'use client';

/**
 * Lead Data Hooks — query, create, and manage leads via Customer tags.
 *
 * Leads are Customer records with structured tags:
 *   'lead'              — identifies as a lead
 *   'passed'            — archived/not-interested
 *   'source:home-show'  — acquisition source
 *   'interest:flooring' — what they want
 *
 * Pipeline stage is DERIVED from tags + linked project status.
 * No new stores, repos, or schema changes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServicesContext } from '../services/ServicesContext';
import { getLoggedServices } from '../services';
import { LOCAL_QUERY_KEYS } from './useLocalData';
import {
  ProjectStatus,
  ProjectType,
  ContactMethod,
} from '@hooomz/shared-contracts';
import type { Customer, Project, CreateCustomer, CreateProject } from '@hooomz/shared-contracts';

// ============================================================================
// Types
// ============================================================================

export type LeadStage = 'new' | 'quoted' | 'converted' | 'passed';

export interface LeadRecord {
  customer: Customer;
  stage: LeadStage;
  interests: string[];
  source: string;
  linkedProject?: Project;
}

export interface LeadPipelineData {
  leads: LeadRecord[];
  counts: { new: number; quoted: number; converted: number; passed: number };
  isLoading: boolean;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  interests: string[];
  source: string;
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LEAD_QUERY_KEY = ['local', 'leads'] as const;

const PLACEHOLDER_ADDRESS = {
  street: 'TBD',
  city: 'Moncton',
  province: 'NB',
  postalCode: 'E1A 0A1',
  country: 'CA',
} as const;

const CONVERTED_STATUSES: string[] = [
  ProjectStatus.APPROVED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETE,
];

const INTEREST_TO_PROJECT_TYPE: Record<string, ProjectType> = {
  flooring: ProjectType.FLOORING,
  paint: ProjectType.PAINTING,
  trim: ProjectType.RENOVATION,
  'full-reno': ProjectType.RENOVATION,
  kitchen: ProjectType.KITCHEN_REMODEL,
  bathroom: ProjectType.BATHROOM_REMODEL,
  basement: ProjectType.BASEMENT_FINISHING,
  other: ProjectType.OTHER,
};

// ============================================================================
// Helpers
// ============================================================================

function parseInterests(tags: string[]): string[] {
  return tags
    .filter((t) => t.startsWith('interest:'))
    .map((t) => t.slice('interest:'.length));
}

function parseSource(tags: string[]): string {
  const sourceTag = tags.find((t) => t.startsWith('source:'));
  return sourceTag ? sourceTag.slice('source:'.length) : 'unknown';
}

function deriveStage(customer: Customer, linkedProject?: Project): LeadStage {
  const tags = customer.tags || [];

  if (tags.includes('passed')) return 'passed';

  if (!linkedProject) return 'new';

  if (CONVERTED_STATUSES.includes(linkedProject.status)) return 'converted';

  return 'quoted';
}

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

      // Get all customers and projects
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

        return {
          customer,
          stage: deriveStage(customer, linkedProject),
          interests: parseInterests(tags),
          source: parseSource(tags),
          linkedProject,
        };
      });

      // Sort newest first
      leads.sort((a, b) => {
        const aTime = new Date(a.customer.metadata.createdAt).getTime();
        const bTime = new Date(b.customer.metadata.createdAt).getTime();
        return bTime - aTime;
      });

      return leads;
    },
    enabled: !servicesLoading && !!services,
    staleTime: 5_000,
  });

  const leads = data ?? [];

  const counts = {
    new: leads.filter((l) => l.stage === 'new').length,
    quoted: leads.filter((l) => l.stage === 'quoted').length,
    converted: leads.filter((l) => l.stage === 'converted').length,
    passed: leads.filter((l) => l.stage === 'passed').length,
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

      const tags = [
        'lead',
        `source:${input.source}`,
        ...input.interests.map((i) => `interest:${i}`),
      ];

      // Email is required by schema — use placeholder if not provided
      const email = input.email || `lead-${Date.now()}@noemail.hooomz.local`;

      const data: CreateCustomer = {
        firstName,
        lastName,
        email,
        phone: input.phone,
        type: 'residential',
        address: PLACEHOLDER_ADDRESS,
        tags,
        notes: input.notes || undefined,
        preferredContactMethod: ContactMethod.PHONE,
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

/**
 * Create a project from a lead and navigate to estimate flow.
 * Returns the created project so the caller can navigate.
 */
export function useCreateProjectFromLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: LeadRecord) => {
      const loggedServices = getLoggedServices();

      const primaryInterest = lead.interests[0] || 'other';
      const projectType =
        INTEREST_TO_PROJECT_TYPE[primaryInterest] || ProjectType.OTHER;

      const interestLabel = capitalizeWords(primaryInterest.replace(/-/g, ' '));

      const data: CreateProject = {
        name: `${lead.customer.lastName} - ${interestLabel}`,
        status: ProjectStatus.LEAD,
        clientId: lead.customer.id,
        address: lead.customer.address,
        projectType,
        dates: {},
        budget: { estimatedCost: 0, actualCost: 0 },
      };

      return loggedServices.projects.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.projects.lists() });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Pass a lead — remove 'lead' tag, add 'passed' tag.
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

      return loggedServices.customers.update(customerId, { id: customerId, tags: newTags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}

/**
 * Restore a passed lead — remove 'passed' tag, add 'lead' tag.
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

      return loggedServices.customers.update(customerId, { id: customerId, tags: newTags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: LOCAL_QUERY_KEYS.activity.all });
    },
  });
}
