/**
 * Properties CRUD — standalone functions for the properties store.
 *
 * Uses the same StorageAdapter + SyncQueue pattern as the repository layer
 * but exposed as plain functions rather than a class.
 */

import type { Property } from '@hooomz/shared-contracts';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StoreNames } from '../storage/StorageAdapter';
import { SyncQueue } from '../repositories/SyncQueue';
import { createPassport } from './passports';

const STORE = StoreNames.PROPERTIES;

// Customer stores — try V2 first, then legacy
const CUSTOMER_STORES = [StoreNames.CUSTOMERS_V2, StoreNames.CUSTOMERS] as const;

function generateId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Create a new property record.
 * Automatically creates a Passport linked to the property.
 */
export async function createProperty(
  storage: StorageAdapter,
  data: Omit<Property, 'id' | 'created_at' | 'updated_at'>,
): Promise<Property> {
  const ts = now();
  const property: Property = {
    ...data,
    id: generateId(),
    created_at: ts,
    updated_at: ts,
  };

  await storage.set(STORE, property.id, property);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueCreate(STORE, property.id, property);

  // Auto-create passport for this property
  const passport = await createPassport(storage, {
    org_id: property.org_id,
    property_id: property.id,
    entry_ids: [],
    homeowner_access_enabled: false,
  });

  // Update property with passport_id
  property.passport_id = passport.id;
  property.updated_at = now();
  await storage.set(STORE, property.id, property);
  await syncQueue.queueUpdate(STORE, property.id, property);

  // Update customer record with property_ids[]
  try {
    for (const customerStore of CUSTOMER_STORES) {
      const customer = await storage.get<Record<string, unknown>>(customerStore, property.customer_id);
      if (customer) {
        const existingIds = (customer.property_ids as string[] | undefined) ?? [];
        if (!existingIds.includes(property.id)) {
          customer.property_ids = [...existingIds, property.id];
          customer.updatedAt = now();
          await storage.set(customerStore, property.customer_id, customer);
          await syncQueue.queueUpdate(customerStore, property.customer_id, customer);
        }
        break; // Found the customer — stop searching stores
      }
    }
  } catch (err) {
    console.warn('[createProperty] Failed to update customer.property_ids:', err);
  }

  return property;
}

/**
 * Get a single property by id.
 */
export async function getProperty(
  storage: StorageAdapter,
  id: string,
): Promise<Property | null> {
  return storage.get<Property>(STORE, id);
}

/**
 * Get all properties linked to a customer.
 */
export async function getPropertiesByCustomer(
  storage: StorageAdapter,
  customerId: string,
): Promise<Property[]> {
  return storage.query<Property>(STORE, (p) => p.customer_id === customerId);
}

/**
 * Get all properties in an organization.
 */
export async function getPropertiesByOrg(
  storage: StorageAdapter,
  orgId: string,
): Promise<Property[]> {
  return storage.query<Property>(STORE, (p) => p.org_id === orgId);
}

/**
 * Update a property. Returns the updated record or null if not found.
 */
export async function updateProperty(
  storage: StorageAdapter,
  id: string,
  updates: Partial<Omit<Property, 'id' | 'org_id' | 'created_at'>>,
): Promise<Property> {
  const existing = await storage.get<Property>(STORE, id);
  if (!existing) {
    throw new Error(`Property ${id} not found`);
  }

  const updated: Property = {
    ...existing,
    ...updates,
    id: existing.id,
    org_id: existing.org_id,
    created_at: existing.created_at,
    updated_at: now(),
  };

  await storage.set(STORE, id, updated);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueUpdate(STORE, id, updated);

  return updated;
}

/**
 * Delete a property by id.
 */
export async function deleteProperty(
  storage: StorageAdapter,
  id: string,
): Promise<void> {
  await storage.delete(STORE, id);

  const syncQueue = SyncQueue.getInstance(storage);
  await syncQueue.queueDelete(STORE, id);
}
