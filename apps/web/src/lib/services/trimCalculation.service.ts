/**
 * TrimCalculationService — calculates and persists trim cut lists per room.
 */

import type { TrimCalculationRepository } from '../repositories/trimCalculation.repository';
import type { MillworkConfigRepository } from '../repositories/millworkConfig.repository';
import type {
  TrimCalculation,
  TrimCalculationInput,
  MillworkAssemblyConfig,
} from '../types/trim.types';
import { calculateTrimCutList } from '../calculators/trim.calculator';

export class TrimCalculationService {
  constructor(
    private trimRepo: TrimCalculationRepository,
    private configRepo: MillworkConfigRepository,
  ) {}

  async getDefaultConfig(): Promise<MillworkAssemblyConfig | null> {
    return this.configRepo.findDefault();
  }

  async findByRoom(roomId: string): Promise<TrimCalculation | null> {
    return this.trimRepo.findByRoom(roomId);
  }

  async findByProject(projectId: string): Promise<TrimCalculation[]> {
    return this.trimRepo.findByProject(projectId);
  }

  async save(input: TrimCalculationInput & { perimeter_mm: number }): Promise<TrimCalculation> {
    const result = calculateTrimCutList({
      ...input,
      perimeter_override_mm: input.perimeter_mm,
    });

    return this.trimRepo.upsertForRoom({
      roomId: input.roomId,
      projectId: input.projectId,
      jobId: input.jobId,
      casing_width_mm: input.casing_width_mm,
      reveal_mm: input.reveal_mm,
      openings: input.openings,
      perimeter_mm: input.perimeter_mm,
      config: input.config,
      result,
    });
  }

  async deleteByRoom(roomId: string): Promise<void> {
    return this.trimRepo.deleteByRoom(roomId);
  }
}

export function createTrimCalculationService(
  trimRepo: TrimCalculationRepository,
  configRepo: MillworkConfigRepository,
): TrimCalculationService {
  return new TrimCalculationService(trimRepo, configRepo);
}

// Re-export for convenience
export { calculateTrimCutList } from '../calculators/trim.calculator';
export type { TrimOpening, TrimCalculationInput } from '../types/trim.types';
