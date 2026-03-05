/**
 * RoomScanRepository — stores imported RoomScan Pro XML sessions.
 * One RoomScan record per XML upload; rooms are stored separately.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { RoomScan, CreateRoomScan, UpdateRoomScan } from '../types/roomScan.types';

export class RoomScanRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.ROOM_SCANS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `rscan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreateRoomScan): Promise<RoomScan> {
    const ts = this.now();
    const scan: RoomScan = {
      ...data,
      id: this.generateId(),
      createdAt: ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, scan.id, scan);
    return scan;
  }

  async findById(id: string): Promise<RoomScan | null> {
    return this.storage.get<RoomScan>(this.storeName, id);
  }

  async findByJob(jobId: string): Promise<RoomScan[]> {
    return this.storage.query<RoomScan>(this.storeName, (s) => s.jobId === jobId);
  }

  async findAll(): Promise<RoomScan[]> {
    return this.storage.getAll<RoomScan>(this.storeName);
  }

  async update(id: string, changes: UpdateRoomScan): Promise<RoomScan | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: RoomScan = { ...existing, ...changes, id, updatedAt: this.now() };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }
}
