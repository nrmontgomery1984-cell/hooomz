/**
 * Passports + PassportEntry CRUD — standalone functions.
 *
 * Uses the same StorageAdapter + SyncQueue pattern as properties.ts.
 */

import type { Passport, PassportEntry } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from '../repositories/SyncQueue';

const PASSPORT_STORE = StoreNames.PASSPORTS;
const ENTRY_STORE = StoreNames.PASSPORT_ENTRIES;

function generatePassportId(): string {
  return `pass_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateEntryId(): string {
  return `pe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ============================================================================
// Passport CRUD
// ============================================================================

export async function createPassport(
  storage: StorageAdapter,
  data: Omit<Passport, 'id' | 'created_at' | 'updated_at'>,
): Promise<Passport> {
  const ts = now();
  const passport: Passport = {
    ...data,
    id: generatePassportId(),
    created_at: ts,
    updated_at: ts,
  };

  await storage.set(PASSPORT_STORE, passport.id, passport);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueCreate(PASSPORT_STORE, passport.id, passport);

  return passport;
}

export async function getPassport(
  storage: StorageAdapter,
  id: string,
): Promise<Passport | null> {
  return storage.get<Passport>(PASSPORT_STORE, id);
}

export async function getPassportByProperty(
  storage: StorageAdapter,
  propertyId: string,
): Promise<Passport | null> {
  const results = await storage.query<Passport>(
    PASSPORT_STORE,
    (p) => p.property_id === propertyId,
  );
  return results[0] ?? null;
}

export async function updatePassport(
  storage: StorageAdapter,
  id: string,
  updates: Partial<Omit<Passport, 'id' | 'org_id' | 'created_at'>>,
): Promise<Passport> {
  const existing = await storage.get<Passport>(PASSPORT_STORE, id);
  if (!existing) {
    throw new Error(`Passport ${id} not found`);
  }

  const updated: Passport = {
    ...existing,
    ...updates,
    id: existing.id,
    org_id: existing.org_id,
    created_at: existing.created_at,
    updated_at: now(),
  };

  await storage.set(PASSPORT_STORE, id, updated);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueUpdate(PASSPORT_STORE, id, updated);

  return updated;
}

// ============================================================================
// PassportEntry CRUD
// ============================================================================

export async function createPassportEntry(
  storage: StorageAdapter,
  data: Omit<PassportEntry, 'id' | 'created_at' | 'updated_at'>,
): Promise<PassportEntry> {
  const ts = now();
  const entry: PassportEntry = {
    ...data,
    id: generateEntryId(),
    created_at: ts,
    updated_at: ts,
  };

  await storage.set(ENTRY_STORE, entry.id, entry);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueCreate(ENTRY_STORE, entry.id, entry);

  return entry;
}

export async function getPassportEntry(
  storage: StorageAdapter,
  id: string,
): Promise<PassportEntry | null> {
  return storage.get<PassportEntry>(ENTRY_STORE, id);
}

export async function getPassportEntryByProject(
  storage: StorageAdapter,
  projectId: string,
): Promise<PassportEntry | null> {
  const results = await storage.query<PassportEntry>(
    ENTRY_STORE,
    (e) => e.project_id === projectId,
  );
  return results[0] ?? null;
}

export async function getPassportEntriesByPassport(
  storage: StorageAdapter,
  passportId: string,
): Promise<PassportEntry[]> {
  return storage.query<PassportEntry>(
    ENTRY_STORE,
    (e) => e.passport_id === passportId,
  );
}

export async function updatePassportEntry(
  storage: StorageAdapter,
  id: string,
  updates: Partial<Omit<PassportEntry, 'id' | 'org_id' | 'created_at'>>,
): Promise<PassportEntry> {
  const existing = await storage.get<PassportEntry>(ENTRY_STORE, id);
  if (!existing) {
    throw new Error(`PassportEntry ${id} not found`);
  }

  const updated: PassportEntry = {
    ...existing,
    ...updates,
    id: existing.id,
    org_id: existing.org_id,
    created_at: existing.created_at,
    updated_at: now(),
  };

  await storage.set(ENTRY_STORE, id, updated);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueUpdate(ENTRY_STORE, id, updated);

  return updated;
}
