/**
 * Skill Rate Config Repository
 * IndexedDB storage for the singleton skill rate configuration (Labour Estimation Engine)
 *
 * The config contains margin targets and skill level definitions used
 * to calculate labour estimates for deployed tasks.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { SkillRateConfig, SkillLevel } from '../types/labourEstimation.types';
import { DEFAULT_SKILL_RATE_CONFIG } from '../types/labourEstimation.types';

export class SkillRateConfigRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.SKILL_RATE_CONFIG;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Get the skill rate config. Seeds defaults if none stored.
   * Never returns null.
   */
  async get(): Promise<SkillRateConfig> {
    const stored = await this.storage.get<SkillRateConfig>(this.storeName, 'singleton');
    if (stored) return stored;

    // Seed defaults on first access
    const defaults: SkillRateConfig = {
      ...DEFAULT_SKILL_RATE_CONFIG,
      updatedAt: new Date().toISOString(),
    };
    await this.storage.set(this.storeName, 'singleton', defaults);
    return defaults;
  }

  /**
   * Update the config (partial merge). Returns the merged config.
   */
  async update(data: Partial<Omit<SkillRateConfig, 'id'>>): Promise<SkillRateConfig> {
    const current = await this.get();
    const updated: SkillRateConfig = {
      ...current,
      ...data,
      id: 'singleton',
      updatedAt: new Date().toISOString(),
    };
    // Deep-merge marginTargets if provided
    if (data.marginTargets) {
      updated.marginTargets = {
        default: data.marginTargets.default ?? current.marginTargets.default,
        byProjectType: {
          ...current.marginTargets.byProjectType,
          ...data.marginTargets.byProjectType,
        },
        byTradeCategory: {
          ...current.marginTargets.byTradeCategory,
          ...data.marginTargets.byTradeCategory,
        },
      };
    }
    await this.storage.set(this.storeName, 'singleton', updated);
    return updated;
  }

  /**
   * Look up a skill level from the config.
   * Pure helper — no async needed.
   * Returns the lowest level as fallback if the requested level is not found.
   */
  getSkillLevel(config: SkillRateConfig, level: number): SkillLevel {
    const found = config.skillLevels.find((s) => s.level === level);
    if (found) return found;
    // Fallback to lowest level
    return config.skillLevels[0] ?? DEFAULT_SKILL_RATE_CONFIG.skillLevels[0];
  }

  /**
   * Resolve the margin target using most-specific-wins cascade:
   *   tradeCategory override → projectType override → default
   * Returns a decimal (e.g. 0.35 for 35%).
   */
  resolveMarginTarget(
    config: SkillRateConfig,
    projectType?: string,
    tradeCategory?: string,
  ): number {
    if (tradeCategory && config.marginTargets.byTradeCategory[tradeCategory] !== undefined) {
      return config.marginTargets.byTradeCategory[tradeCategory];
    }
    if (projectType && config.marginTargets.byProjectType[projectType] !== undefined) {
      return config.marginTargets.byProjectType[projectType];
    }
    return config.marginTargets.default;
  }
}
