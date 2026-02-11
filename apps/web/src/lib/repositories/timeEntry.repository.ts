/**
 * Time Entry Repository
 * IndexedDB storage for time tracking entries (Build 3a)
 * Uses existing TimeEntry type from packages/shared.
 */

import type { TimeEntry } from '@hooomz/shared/types';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class TimeEntryRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.TIME_ENTRIES;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `te_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    const entry: TimeEntry = {
      ...data,
      id: this.generateId(),
    };
    await this.storage.set(this.storeName, entry.id, entry);
    return entry;
  }

  async findById(id: string): Promise<TimeEntry | null> {
    return this.storage.get<TimeEntry>(this.storeName, id);
  }

  async update(id: string, changes: Partial<TimeEntry>): Promise<TimeEntry | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: TimeEntry = {
      ...existing,
      ...changes,
      id: existing.id,
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async getByCrewMember(crewMemberId: string): Promise<TimeEntry[]> {
    return this.storage.query<TimeEntry>(
      this.storeName,
      (e) => e.team_member_id === crewMemberId
    );
  }

  async getByTask(taskId: string): Promise<TimeEntry[]> {
    return this.storage.query<TimeEntry>(
      this.storeName,
      (e) => e.task_instance_id === taskId
    );
  }

  async getByProject(projectId: string, dateRange?: { start: string; end: string }): Promise<TimeEntry[]> {
    return this.storage.query<TimeEntry>(
      this.storeName,
      (e) => {
        if (e.project_id !== projectId) return false;
        if (dateRange) {
          return e.clock_in >= dateRange.start && e.clock_in <= dateRange.end;
        }
        return true;
      }
    );
  }

  async getTodayEntries(crewMemberId: string): Promise<TimeEntry[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    return this.storage.query<TimeEntry>(
      this.storeName,
      (e) => e.team_member_id === crewMemberId && e.clock_in >= todayISO
    );
  }

  async getOpenEntry(crewMemberId: string): Promise<TimeEntry | null> {
    const entries = await this.storage.query<TimeEntry>(
      this.storeName,
      (e) => e.team_member_id === crewMemberId && e.clock_out === null
    );
    return entries[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
