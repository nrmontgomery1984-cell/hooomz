/**
 * createEstimateFromDiscovery — Bridge discovery data into the estimate page.
 *
 * Since estimates are project-scoped line item collections (no separate Estimate entity
 * in IndexedDB), this utility:
 * 1. Builds a context notes string from discovery data
 * 2. Checks if line items already exist for the project (guard)
 * 3. Logs an activity event
 * 4. Returns info for navigation to /estimates/[projectId]
 */

import type { DiscoveryDraft } from '../types/discovery.types';
import type { Services } from '../services';

interface EstimateFromDiscoveryResult {
  projectId: string;
  hasExistingLineItems: boolean;
  notes: string;
}

function buildEstimateNotes(draft: DiscoveryDraft): string {
  const p = draft.property;
  const pref = draft.preferences;
  const lines: string[] = [];

  // Property
  const addr = p.address;
  const addrStr = addr
    ? [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')
    : '';
  const propParts = [
    addrStr,
    p.homeType,
    p.homeAge ? `${p.homeAge} yr` : null,
    p.storeys ? `${p.storeys} storey` : null,
    p.totalSqft ? `${p.totalSqft} sqft` : null,
  ].filter(Boolean);
  if (propParts.length) lines.push(`Property: ${propParts.join(', ')}`);

  // Occupancy + pets
  const occParts = [
    p.occupancy,
    p.pets ? `pets: ${p.petDetails || 'yes'}` : null,
  ].filter(Boolean);
  if (occParts.length) lines.push(`Occupancy: ${occParts.join(', ')}`);

  // Access
  lines.push(`Access: ${p.accessNotes || 'No special access notes'}`);

  lines.push('');

  // Design direction
  const designParts = [pref.style, pref.colorDirection].filter(Boolean);
  if (designParts.length) lines.push(`Design Direction: ${designParts.join(', ')}`);

  // Priorities
  if (pref.priorities?.length) lines.push(`Priorities: ${pref.priorities.join(' \u00b7 ')}`);

  // Floor + trim
  const ftParts = [
    pref.floorLook ? `Floor: ${pref.floorLook}` : null,
    pref.trimStyle ? `Trim: ${pref.trimStyle}` : null,
  ].filter(Boolean);
  if (ftParts.length) lines.push(ftParts.join(' \u00b7 '));

  lines.push('');

  // Scope notes
  const scope = pref.inspirationNotes || '';
  lines.push(`Scope Notes: ${scope || 'None'}`);

  return lines.join('\n');
}

export async function createEstimateFromDiscovery(
  projectId: string,
  draft: DiscoveryDraft,
  services: Services
): Promise<EstimateFromDiscoveryResult> {
  const notes = buildEstimateNotes(draft);

  // Check if line items already exist
  const existing = await services.estimating.lineItems.findByProjectId(projectId);
  const hasExistingLineItems = existing.length > 0;

  // Log activity event
  await services.activity.create({
    event_type: 'estimate.created_from_discovery',
    project_id: projectId,
    entity_type: 'project',
    entity_id: projectId,
    summary: `Estimate initiated from discovery for ${draft.customerName}`,
    event_data: { notes, hasExistingLineItems },
  }).catch((err) => console.error('Failed to log estimate_from_discovery:', err));

  return { projectId, hasExistingLineItems, notes };
}

export { buildEstimateNotes };
