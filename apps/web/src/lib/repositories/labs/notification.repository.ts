/**
 * Labs Notification Repository
 * IndexedDB storage for Labs notifications (Phase 2)
 */

import type { LabsNotification } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StoreNames } from '../../storage/StorageAdapter';
import { SyncQueue } from '../SyncQueue';

export class NotificationRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.NOTIFICATIONS;
  private syncQueue: SyncQueue;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
    this.syncQueue = SyncQueue.getInstance(storage);
  }

  private generateId(): string {
    return `lnot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createMetadata() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, version: 1 };
  }

  private updateMetadata(existing: { createdAt: string; updatedAt: string; version: number }) {
    return { ...existing, updatedAt: new Date().toISOString(), version: existing.version + 1 };
  }

  async create(data: Omit<LabsNotification, 'id' | 'metadata'>): Promise<LabsNotification> {
    const notification: LabsNotification = {
      ...data,
      id: this.generateId(),
      metadata: this.createMetadata(),
    };
    await this.storage.set(this.storeName, notification.id, notification);
    await this.syncQueue.queueCreate(this.storeName, notification.id, notification);
    return notification;
  }

  async findById(id: string): Promise<LabsNotification | null> {
    return this.storage.get<LabsNotification>(this.storeName, id);
  }

  async findAll(): Promise<LabsNotification[]> {
    return this.storage.getAll<LabsNotification>(this.storeName);
  }

  async findByUser(userId: string): Promise<LabsNotification[]> {
    return this.storage.query<LabsNotification>(this.storeName, (n) => n.userId === userId);
  }

  async findUnread(userId: string): Promise<LabsNotification[]> {
    return this.storage.query<LabsNotification>(this.storeName, (n) =>
      n.userId === userId && !n.isRead
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const unread = await this.findUnread(userId);
    return unread.length;
  }

  async markAsRead(id: string): Promise<LabsNotification | null> {
    const existing = await this.storage.get<LabsNotification>(this.storeName, id);
    if (!existing) return null;

    const updated: LabsNotification = {
      ...existing,
      isRead: true,
      metadata: this.updateMetadata(existing.metadata),
    };
    await this.storage.set(this.storeName, id, updated);
    await this.syncQueue.queueUpdate(this.storeName, id, updated);
    return updated;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.findUnread(userId);
    for (const notification of unread) {
      await this.markAsRead(notification.id);
    }
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.storage.get<LabsNotification>(this.storeName, id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    await this.syncQueue.queueDelete(this.storeName, id);
    return true;
  }
}
