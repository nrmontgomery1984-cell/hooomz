/**
 * Notification Service — wraps repository (Phase 2)
 */

import type { LabsNotification } from '@hooomz/shared-contracts';
import type { NotificationRepository } from '../../repositories/labs';

export class NotificationService {
  constructor(private repo: NotificationRepository) {}

  async create(data: Omit<LabsNotification, 'id' | 'metadata'>): Promise<LabsNotification> {
    return this.repo.create(data);
  }

  async findById(id: string) { return this.repo.findById(id); }
  async findByUser(userId: string) { return this.repo.findByUser(userId); }
  async findUnread(userId: string) { return this.repo.findUnread(userId); }
  async getUnreadCount(userId: string) { return this.repo.getUnreadCount(userId); }
  async markAsRead(id: string) { return this.repo.markAsRead(id); }
  async markAllAsRead(userId: string) { return this.repo.markAllAsRead(userId); }
  async delete(id: string) { return this.repo.delete(id); }
}
