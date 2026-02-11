/**
 * Active Crew Session Repository
 * IndexedDB storage for "who is holding the phone right now" (Build 3a)
 * Only ONE session can be active at a time per device.
 */

import type { ActiveCrewSession } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';

export class ActiveCrewSessionRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.ACTIVE_CREW_SESSION;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `crew_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  async create(data: Omit<ActiveCrewSession, 'id'>): Promise<ActiveCrewSession> {
    const session: ActiveCrewSession = {
      ...data,
      id: this.generateId(),
    };
    await this.storage.set(this.storeName, session.id, session);
    return session;
  }

  async findById(id: string): Promise<ActiveCrewSession | null> {
    return this.storage.get<ActiveCrewSession>(this.storeName, id);
  }

  async getActiveSession(): Promise<ActiveCrewSession | null> {
    const sessions = await this.storage.query<ActiveCrewSession>(
      this.storeName,
      (s) => s.isActive === true
    );
    return sessions[0] || null;
  }

  async deactivateAll(): Promise<void> {
    const activeSessions = await this.storage.query<ActiveCrewSession>(
      this.storeName,
      (s) => s.isActive === true
    );
    for (const session of activeSessions) {
      await this.storage.set(this.storeName, session.id, {
        ...session,
        isActive: false,
      });
    }
  }

  async switchSession(crewMemberId: string, crewMemberName: string, projectId: string): Promise<ActiveCrewSession> {
    await this.deactivateAll();
    return this.create({
      crewMemberId,
      crewMemberName,
      projectId,
      startedAt: new Date().toISOString(),
      isActive: true,
    });
  }

  async update(id: string, changes: Partial<ActiveCrewSession>): Promise<ActiveCrewSession | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ActiveCrewSession = {
      ...existing,
      ...changes,
      id: existing.id,
    };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }
}
