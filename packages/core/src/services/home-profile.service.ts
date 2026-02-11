/**
 * Home Profile Service
 *
 * Coordinates home profile functionality including:
 * - Installed products with warranty tracking
 * - 3D scan management
 * - Maintenance records
 * - Property profile summary
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityEventType } from '@hooomz/shared';
import type {
  PropertyHomeProfile,
  UpdatePropertyHomeProfileInput,
  InstalledProduct,
  CreateInstalledProductInput,
  UpdateInstalledProductInput,
  InstalledProductFilters,
  HomeScan,
  CreateHomeScanInput,
  UpdateHomeScanInput,
  MaintenanceRecord,
  CreateMaintenanceRecordInput,
  ExpiringWarranty,
  MaintenanceDue,
  HomeProfileSummary,
} from '../types';
import type {
  InstalledProductRepository,
  HomeScanRepository,
  MaintenanceRecordRepository,
} from '../repositories';

// Activity service interface (matches existing pattern)
export interface HomeProfileActivityService {
  log(event: {
    organization_id: string;
    project_id?: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible?: boolean;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

export class HomeProfileService {
  constructor(
    private supabase: SupabaseClient,
    private productRepo: InstalledProductRepository,
    private scanRepo: HomeScanRepository,
    private maintenanceRepo: MaintenanceRecordRepository,
    private activityService?: HomeProfileActivityService
  ) {}

  // =====================
  // Property Profile
  // =====================

  /**
   * Get property as home profile with extended fields
   */
  async getPropertyProfile(propertyId: string): Promise<PropertyHomeProfile | null> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update property home profile fields
   */
  async updatePropertyProfile(
    propertyId: string,
    input: UpdatePropertyHomeProfileInput,
    actorId: string,
    organizationId: string
  ): Promise<PropertyHomeProfile> {
    const { data, error } = await this.supabase
      .from('properties')
      .update(input)
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (this.activityService) {
      await this.activityService.log({
        organization_id: organizationId,
        property_id: propertyId,
        event_type: 'property.updated' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'property',
        entity_id: propertyId,
        homeowner_visible: true,
        event_data: { updated_fields: Object.keys(input) },
      });
    }

    return data;
  }

  /**
   * Get comprehensive home profile summary
   */
  async getHomeProfileSummary(
    propertyId: string,
    warrantyDaysAhead: number = 90,
    maintenanceDaysAhead: number = 30
  ): Promise<HomeProfileSummary | null> {
    const property = await this.getPropertyProfile(propertyId);
    if (!property) return null;

    const [products, scans, expiringWarranties, maintenanceDue] = await Promise.all([
      this.productRepo.findByProperty(propertyId),
      this.scanRepo.findByProperty(propertyId),
      this.productRepo.getExpiringWarranties(propertyId, warrantyDaysAhead),
      this.productRepo.getMaintenanceDue(propertyId, maintenanceDaysAhead),
    ]);

    return {
      property,
      product_count: products.length,
      scan_count: scans.length,
      scan_verified: scans.length > 0,
      expiring_warranties: expiringWarranties,
      maintenance_due: maintenanceDue,
    };
  }

  // =====================
  // Installed Products
  // =====================

  async createProduct(
    input: CreateInstalledProductInput,
    actorId: string
  ): Promise<InstalledProduct> {
    const product = await this.productRepo.create(input);

    // Log activity
    if (this.activityService && input.organization_id) {
      await this.activityService.log({
        organization_id: input.organization_id,
        project_id: input.project_id,
        property_id: input.property_id,
        event_type: 'product.installed' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'installed_product',
        entity_id: product.id,
        homeowner_visible: true,
        event_data: {
          category: product.category,
          product_type: product.product_type,
          manufacturer: product.manufacturer,
          model: product.model,
          location: product.location,
        },
      });
    }

    return product;
  }

  async getProduct(id: string): Promise<InstalledProduct | null> {
    return this.productRepo.findById(id);
  }

  async getProductsByProperty(propertyId: string): Promise<InstalledProduct[]> {
    return this.productRepo.findByProperty(propertyId);
  }

  async getProductsFiltered(filters: InstalledProductFilters): Promise<InstalledProduct[]> {
    return this.productRepo.findMany(filters);
  }

  async updateProduct(
    id: string,
    input: UpdateInstalledProductInput,
    actorId: string,
    organizationId: string
  ): Promise<InstalledProduct> {
    const existing = await this.productRepo.findById(id);
    if (!existing) throw new Error('Product not found');

    const updated = await this.productRepo.update(id, input);

    // Log activity
    if (this.activityService) {
      await this.activityService.log({
        organization_id: organizationId,
        property_id: existing.property_id,
        event_type: 'product.updated' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'installed_product',
        entity_id: id,
        homeowner_visible: true,
        event_data: { updated_fields: Object.keys(input) },
      });
    }

    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    return this.productRepo.delete(id);
  }

  async getExpiringWarranties(
    propertyId: string,
    daysAhead: number = 90
  ): Promise<ExpiringWarranty[]> {
    return this.productRepo.getExpiringWarranties(propertyId, daysAhead);
  }

  async getMaintenanceDue(
    propertyId: string,
    daysAhead: number = 30
  ): Promise<MaintenanceDue[]> {
    return this.productRepo.getMaintenanceDue(propertyId, daysAhead);
  }

  // =====================
  // Home Scans
  // =====================

  async createScan(input: CreateHomeScanInput, actorId: string): Promise<HomeScan> {
    const scan = await this.scanRepo.create(input);

    // Log activity
    if (this.activityService) {
      await this.activityService.log({
        organization_id: input.organization_id,
        project_id: input.project_id,
        property_id: input.property_id,
        event_type: 'scan.completed' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'home_scan',
        entity_id: scan.id,
        homeowner_visible: true,
        event_data: {
          stage: scan.stage,
          scan_date: scan.scan_date,
          scan_provider: scan.scan_provider,
          deviation_count: scan.deviation_count,
        },
      });
    }

    return scan;
  }

  async getScan(id: string): Promise<HomeScan | null> {
    return this.scanRepo.findById(id);
  }

  async getScansByProperty(propertyId: string): Promise<HomeScan[]> {
    return this.scanRepo.findByProperty(propertyId);
  }

  async getScansByProject(projectId: string): Promise<HomeScan[]> {
    return this.scanRepo.findByProject(projectId);
  }

  async updateScan(
    id: string,
    input: UpdateHomeScanInput,
    actorId: string,
    organizationId: string
  ): Promise<HomeScan> {
    const existing = await this.scanRepo.findById(id);
    if (!existing) throw new Error('Scan not found');

    const updated = await this.scanRepo.update(id, input);

    // Log deviations resolved event
    if (input.deviations_resolved && !existing.deviations_resolved && this.activityService) {
      await this.activityService.log({
        organization_id: organizationId,
        property_id: existing.property_id,
        event_type: 'scan.deviations_resolved' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'home_scan',
        entity_id: id,
        homeowner_visible: false,
        event_data: {
          stage: existing.stage,
          deviation_count: existing.deviation_count,
        },
      });
    }

    return updated;
  }

  async resolveDeviations(
    id: string,
    actorId: string,
    organizationId: string
  ): Promise<HomeScan> {
    return this.updateScan(id, { deviations_resolved: true }, actorId, organizationId);
  }

  async deleteScan(id: string): Promise<void> {
    return this.scanRepo.delete(id);
  }

  async isPropertyScanVerified(propertyId: string): Promise<boolean> {
    return this.scanRepo.hasScan(propertyId);
  }

  // =====================
  // Maintenance Records
  // =====================

  async createMaintenanceRecord(
    input: CreateMaintenanceRecordInput,
    actorId: string
  ): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepo.create(input);

    // If linked to a product, update the product's last_serviced
    if (input.product_id) {
      await this.productRepo.recordMaintenance(input.product_id, input.performed_date);
    }

    // Log activity
    if (this.activityService && input.organization_id) {
      await this.activityService.log({
        organization_id: input.organization_id,
        property_id: input.property_id,
        event_type: 'maintenance.completed' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'maintenance_record',
        entity_id: record.id,
        homeowner_visible: true,
        event_data: {
          maintenance_type: record.maintenance_type,
          description: record.description,
          cost: record.cost,
          performed_by: record.performed_by,
        },
      });
    }

    return record;
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
    return this.maintenanceRepo.findById(id);
  }

  async getMaintenanceByProperty(propertyId: string): Promise<MaintenanceRecord[]> {
    return this.maintenanceRepo.findByProperty(propertyId);
  }

  async getMaintenanceByProduct(productId: string): Promise<MaintenanceRecord[]> {
    return this.maintenanceRepo.findByProduct(productId);
  }

  async getRecentMaintenance(
    propertyId: string,
    limit: number = 10
  ): Promise<MaintenanceRecord[]> {
    return this.maintenanceRepo.findRecent(propertyId, limit);
  }

  async deleteMaintenanceRecord(id: string): Promise<void> {
    return this.maintenanceRepo.delete(id);
  }

  async getTotalMaintenanceCost(propertyId: string): Promise<number> {
    return this.maintenanceRepo.getTotalCost(propertyId);
  }

  async getMaintenanceCostByYear(propertyId: string): Promise<Record<number, number>> {
    return this.maintenanceRepo.getCostByYear(propertyId);
  }

  // =====================
  // Project Closeout Integration
  // =====================

  /**
   * Create home profile from a completed project
   * This is called during project closeout to populate the property
   * with installed products from the project scope
   */
  async createFromProject(
    projectId: string,
    actorId: string
  ): Promise<{
    propertyId: string;
    productsCreated: number;
    documentsTransferred: number;
  }> {
    // Get project with property
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('*, property:properties(*)')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Project not found');

    const propertyId = project.property_id;

    // Update property with original_project_id
    await this.supabase
      .from('properties')
      .update({ original_project_id: projectId })
      .eq('id', propertyId);

    // Get installed materials from scope items that should become products
    const { data: scopeItems, error: scopeError } = await this.supabase
      .from('scope_items')
      .select('*, materials:scope_item_materials(*)')
      .eq('project_id', projectId)
      .eq('status', 'complete');

    if (scopeError) throw scopeError;

    // Create installed products from significant scope items
    let productsCreated = 0;
    for (const item of scopeItems || []) {
      // Only create products for items that make sense to track
      // (appliances, HVAC, fixtures, etc. - not consumables like paint)
      if (this.shouldCreateProductFromScope(item)) {
        await this.createProduct(
          {
            property_id: propertyId,
            organization_id: project.organization_id,
            project_id: projectId,
            category: this.mapScopeCategoryToProductCategory(item.category),
            product_type: item.description,
            // Additional fields would come from scope_item_materials
          },
          actorId
        );
        productsCreated++;
      }
    }

    // Mark documents for transfer
    const { count: documentsTransferred } = await this.supabase
      .from('property_pending_data')
      .select('*', { count: 'exact', head: true })
      .eq('source_project_id', projectId)
      .eq('data_type', 'document');

    // Log the closeout event
    if (this.activityService) {
      await this.activityService.log({
        organization_id: project.organization_id,
        project_id: projectId,
        property_id: propertyId,
        event_type: 'property.profile_created' as ActivityEventType,
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'property',
        entity_id: propertyId,
        homeowner_visible: true,
        event_data: {
          source: 'project_closeout',
          products_created: productsCreated,
          documents_transferred: documentsTransferred || 0,
        },
      });
    }

    return {
      propertyId,
      productsCreated,
      documentsTransferred: documentsTransferred || 0,
    };
  }

  // Helper to determine if scope item should become a trackable product
  private shouldCreateProductFromScope(scopeItem: { category?: string }): boolean {
    const trackableCategories = [
      'hvac',
      'plumbing_fixtures',
      'electrical_fixtures',
      'appliances',
      'windows',
      'doors',
      'roofing',
    ];
    return trackableCategories.includes(scopeItem.category || '');
  }

  // Helper to map scope categories to product categories
  private mapScopeCategoryToProductCategory(
    scopeCategory: string | undefined
  ): InstalledProduct['category'] {
    const mapping: Record<string, InstalledProduct['category']> = {
      hvac: 'hvac',
      plumbing_fixtures: 'plumbing',
      electrical_fixtures: 'electrical',
      appliances: 'appliances',
      windows: 'windows_doors',
      doors: 'windows_doors',
      roofing: 'roofing',
      flooring: 'flooring',
      siding: 'siding',
      insulation: 'insulation',
    };
    return mapping[scopeCategory || ''] || 'other';
  }
}
