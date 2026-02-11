/**
 * Time Clock State Repository
 * IndexedDB storage for active clock session state (Build 3a)
 * One state per crew member — upsert pattern.
 */

import type { TimeClockState } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class TimeClockStateRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TIME_CLOCK_STATE;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `tcs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<TimeClockState, 'id'>): Promise<TimeClockState> {
    const state: TimeClockState = {
      ...data,
      id: this.generateId(),
    };
    await this.storage.set(this.storeName, state.id, state);
    return state;
  }

  async findById(id: string): Promise<TimeClockState | null> {
    return this.storage.get<TimeClockState>(this.storeName, id);
  }

  async getByCrewMember(crewMemberId: string): Promise<TimeClockState | null> {
    const states = await this.storage.query<TimeClockState>(
      this.storeName,
      (s) => s.crewMemberId === crewMemberId
    );
    return states[0] || null;
  }

  async update(id: string, changes: Partial<TimeClockState>): Promise<TimeClockState | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: TimeClockState = {
      ...existing,
      ...changes,
      id: existing.id,
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async upsertByCrewMember(crewMemberId: string, data: Omit<TimeClockState, 'id'>): Promise<TimeClockState> {
    const existing = await this.getByCrewMember(crewMemberId);
    if (existing) {
      const updated = await this.update(existing.id, data);
      return updated!;
    }
    return this.create(data);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async deleteByCrewMember(crewMemberId: string): Promise<boolean> {
    const state = await this.getByCrewMember(crewMemberId);
    if (!state) return false;
    await this.storage.delete(this.storeName, state.id);
    return true;
  }
}
