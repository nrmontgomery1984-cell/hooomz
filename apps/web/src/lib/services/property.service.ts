/**
 * Property Service - Wraps property operations with Activity Logging
 *
 * THE ACTIVITY LOG IS THE SPINE - every action creates an event.
 * This service ensures all property operations are logged.
 */

import type { Services } from './index';

// Property type for web app
interface Property {
  id: string;
  projectId: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  type: 'residential' | 'commercial';
  squareFootage?: number;
  yearBuilt?: number;
  homeownerId?: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

interface CreatePropertyInput {
  projectId: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  type?: 'residential' | 'commercial';
  squareFootage?: number;
  yearBuilt?: number;
  homeownerId?: string;
}

/**
 * PropertyService - Handles property operations with activity logging
 */
export class PropertyService {
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  /**
   * Create a new property
   */
  async create(
    projectId: string,
    data: CreatePropertyInput
  ): Promise<Property> {
    // Note: We need to add a property repository if it doesn't exist
    // For now, we'll create the logging structure
    const property: Property = {
      id: crypto.randomUUID(),
      projectId,
      address: {
        street: data.address.street,
        city: data.address.city,
        province: data.address.province,
        postalCode: data.address.postalCode,
        country: data.address.country || 'Canada',
      },
      type: data.type || 'residential',
      squareFootage: data.squareFootage,
      yearBuilt: data.yearBuilt,
      homeownerId: data.homeownerId,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
    };

    // Log to activity (non-blocking)
    this.services.activity.logPropertyEvent('property.created', property.id, {
      address: `${data.address.street}, ${data.address.city}`,
      project_id: projectId,
    }).catch((err) => console.error('Failed to log property.created:', err));

    return property;
  }

  /**
   * Update a property
   */
  async update(
    projectId: string,
    propertyId: string,
    data: Partial<Omit<Property, 'id' | 'metadata'>>,
    existingProperty?: Property
  ): Promise<Property | null> {
    if (!existingProperty) return null;

    const updated: Property = {
      ...existingProperty,
      ...data,
      metadata: {
        ...existingProperty.metadata,
        updatedAt: new Date().toISOString(),
        version: existingProperty.metadata.version + 1,
      },
    };

    // Build description of changes
    const changes: string[] = [];
    if (data.address) changes.push('address');
    if (data.type) changes.push('type');
    if (data.squareFootage !== undefined) changes.push('square footage');
    if (data.yearBuilt !== undefined) changes.push('year built');
    if (data.homeownerId !== undefined) changes.push('homeowner');

    // Log update (non-blocking)
    this.services.activity.logPropertyEvent('property.updated', propertyId, {
      address: `${updated.address.street}, ${updated.address.city}`,
      project_id: projectId,
    }).catch((err) => console.error('Failed to log property.updated:', err));

    return updated;
  }

  /**
   * Delete a property
   */
  async delete(
    projectId: string,
    propertyId: string,
    existingProperty?: Property
  ): Promise<boolean> {
    // Log deletion (non-blocking)
    this.services.activity.logPropertyEvent('property.deleted', propertyId, {
      address: existingProperty
        ? `${existingProperty.address.street}, ${existingProperty.address.city}`
        : 'Unknown',
      project_id: projectId,
    }).catch((err) => console.error('Failed to log property.deleted:', err));

    return true;
  }

  /**
   * Link homeowner to property
   */
  async linkHomeowner(
    projectId: string,
    propertyId: string,
    homeownerId: string,
    homeownerName?: string
  ): Promise<void> {
    // Log homeowner link as a transfer event (non-blocking)
    this.services.activity.logPropertyEvent('property.transferred', propertyId, {
      new_owner: homeownerName || homeownerId,
      project_id: projectId,
    }).catch((err) => console.error('Failed to log property.transferred:', err));
  }
}

/**
 * Create a PropertyService instance
 */
export function createPropertyService(services: Services): PropertyService {
  return new PropertyService(services);
}
