import type { Property, PropertyOwnershipHistory } from '@hooomz/shared';
import type { PropertyRepository, PropertyOwnershipRepository } from '../repositories';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  PropertyWithHistory,
  TransferOwnershipInput,
} from '../types';

export class PropertyService {
  constructor(
    private propertyRepo: PropertyRepository,
    private ownershipRepo: PropertyOwnershipRepository
  ) {}

  async createProperty(input: CreatePropertyInput): Promise<Property> {
    // Check if property already exists at this address
    const existing = await this.propertyRepo.findByAddress(
      input.address_line1,
      input.city,
      input.province
    );

    if (existing) {
      throw new Error('Property already exists at this address');
    }

    const property = await this.propertyRepo.create(input);

    // Create initial ownership record if owner specified
    if (input.current_owner_id) {
      await this.ownershipRepo.create({
        property_id: property.id,
        owner_id: input.current_owner_id,
        transfer_type: 'initial',
      });
    }

    return property;
  }

  async getProperty(id: string): Promise<Property | null> {
    return this.propertyRepo.findById(id);
  }

  async getPropertyWithHistory(id: string): Promise<PropertyWithHistory | null> {
    return this.propertyRepo.findByIdWithHistory(id);
  }

  async listProperties(filters: PropertyFilters): Promise<Property[]> {
    return this.propertyRepo.findMany(filters);
  }

  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    return this.propertyRepo.findByOwner(ownerId);
  }

  async updateProperty(id: string, input: UpdatePropertyInput): Promise<Property> {
    return this.propertyRepo.update(id, input);
  }

  async transferOwnership(input: TransferOwnershipInput): Promise<Property> {
    const property = await this.propertyRepo.findById(input.property_id);
    if (!property) {
      throw new Error('Property not found');
    }

    // End current ownership if exists
    if (property.current_owner_id) {
      await this.ownershipRepo.endOwnership(input.property_id, property.current_owner_id);
    }

    // Create new ownership record
    await this.ownershipRepo.create({
      property_id: input.property_id,
      owner_id: input.new_owner_id,
      transfer_type: input.transfer_type,
    });

    // Update property's current owner
    return this.propertyRepo.updateOwner(input.property_id, input.new_owner_id);
  }

  async getOwnershipHistory(propertyId: string): Promise<PropertyOwnershipHistory[]> {
    return this.ownershipRepo.findByProperty(propertyId);
  }

  // Find or create property by address
  async findOrCreateProperty(
    input: CreatePropertyInput
  ): Promise<{ property: Property; created: boolean }> {
    const existing = await this.propertyRepo.findByAddress(
      input.address_line1,
      input.city,
      input.province
    );

    if (existing) {
      return { property: existing, created: false };
    }

    const property = await this.createProperty(input);
    return { property, created: true };
  }

  async deleteProperty(id: string): Promise<void> {
    // Check if property has any projects
    const property = await this.propertyRepo.findByIdWithHistory(id);
    if (property?.projects && property.projects.length > 0) {
      throw new Error('Cannot delete property with associated projects');
    }

    return this.propertyRepo.delete(id);
  }
}
