/**
 * Property Service - Wraps property operations with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all property operations are logged.
 */

import type { Property } from '@hooomz/shared-contracts';
import type { Services } from './index';

/**
 * PropertyService - Handles property operations with activity logging
 */
export class PropertyService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Log a property creation event
   */
  async logCreate(property: Property): Promise<void> {
    this.services.activity.logPropertyEvent('property.created', property.id, {
      address: `${property.address_line_1}, ${property.city}`,
    }).catch((err) => console.error('Failed to log property.created:', err));
  }

  /**
   * Log a property update event
   */
  async logUpdate(propertyId: string, property: Property): Promise<void> {
    this.services.activity.logPropertyEvent('property.updated', propertyId, {
      address: `${property.address_line_1}, ${property.city}`,
    }).catch((err) => console.error('Failed to log property.updated:', err));
  }

  /**
   * Log a property deletion event
   */
  async logDelete(propertyId: string, property?: Property): Promise<void> {
    this.services.activity.logPropertyEvent('property.deleted', propertyId, {
      address: property
        ? `${property.address_line_1}, ${property.city}`
        : 'Unknown',
    }).catch((err) => console.error('Failed to log property.deleted:', err));
  }

  /**
   * Log homeowner link / transfer event
   */
  async logTransfer(
    propertyId: string,
    homeownerId: string,
    homeownerName?: string,
  ): Promise<void> {
    this.services.activity.logPropertyEvent('property.transferred', propertyId, {
      new_owner: homeownerName || homeownerId,
    }).catch((err) => console.error('Failed to log property.transferred:', err));
  }
}

/**
 * Create a PropertyService instance
 */
export function createPropertyService(services: Services): PropertyService {
  return new PropertyService(services);
}
