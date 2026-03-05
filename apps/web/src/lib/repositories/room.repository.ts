/**
 * RoomRepository — stores individual rooms parsed from a RoomScan.
 * Each room belongs to one RoomScan and one Job.
 */

import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import type { Room, CreateRoom, UpdateRoom } from '../types/roomScan.types';

export class RoomRepository {
  private storage: StorageAdapter;
  private storeName = StoreNames.ROOMS;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  private generateId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  async create(data: CreateRoom): Promise<Room> {
    const ts = this.now();
    const room: Room = {
      ...data,
      id: this.generateId(),
      createdAt: ts,
      updatedAt: ts,
    };
    await this.storage.set(this.storeName, room.id, room);
    return room;
  }

  async findById(id: string): Promise<Room | null> {
    return this.storage.get<Room>(this.storeName, id);
  }

  async findByScan(scanId: string): Promise<Room[]> {
    return this.storage.query<Room>(this.storeName, (r) => r.scanId === scanId);
  }

  async findByJob(jobId: string): Promise<Room[]> {
    return this.storage.query<Room>(this.storeName, (r) => r.jobId === jobId);
  }

  async findAll(): Promise<Room[]> {
    return this.storage.getAll<Room>(this.storeName);
  }

  async update(id: string, changes: UpdateRoom): Promise<Room | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Room = { ...existing, ...changes, id, updatedAt: this.now() };
    await this.storage.set(this.storeName, id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.storage.delete(this.storeName, id);
    return true;
  }

  async deleteByScan(scanId: string): Promise<number> {
    const rooms = await this.findByScan(scanId);
    await Promise.all(rooms.map((r) => this.storage.delete(this.storeName, r.id)));
    return rooms.length;
  }

  async saveMany(rooms: Room[]): Promise<void> {
    await this.storage.setMany(
      this.storeName,
      rooms.map((r) => ({ key: r.id, value: r })),
    );
  }
}
