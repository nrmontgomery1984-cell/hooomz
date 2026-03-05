/**
 * Seed the default MillworkAssemblyConfig.
 * ID 'default' is the sentinel — always present after first run.
 * All measurements in mm.
 */

import type { Services } from '../../services/index';
import type { MillworkAssemblyConfig } from '../../types/trim.types';

const DEFAULT_CONFIG: Omit<MillworkAssemblyConfig, 'createdAt' | 'updatedAt'> = {
  id: 'default',
  label: 'Standard Assembly',
  window_jamb_style: 'sill_under_legs',
  horn_length_mm: 25,             // 1" structural horn on sill (legs_on_sill style)
  door_jamb_style: 'head_on_legs',
  casing_joint: 'miter',
  door_stop_joint: 'miter',
  floor_clearance_mm: 13,         // 1/2" gap at bottom of door stop legs
  stool_nose_mm: 25,              // 1" decorative stool projection
  include_apron: true,
  trim_waste_factor: 0.10,        // 10%
};

export async function seedAssemblyConfigIfEmpty(services: Services): Promise<void> {
  const existing = await services.millworkConfig.findDefault();
  if (existing) return; // already seeded
  const ts = new Date().toISOString();
  const config: MillworkAssemblyConfig = { ...DEFAULT_CONFIG, createdAt: ts, updatedAt: ts };
  await services.millworkConfig.save('default', config);
  console.info('Seed: default millwork assembly config loaded');
}
