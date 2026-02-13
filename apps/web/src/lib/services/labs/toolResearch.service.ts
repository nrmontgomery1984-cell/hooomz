/**
 * Tool Research Service
 * Wraps platform, research item, and inventory repositories
 * Includes purchase tracking, usage logging, content pipeline, and maintenance
 */

import type {
  ToolPlatform,
  ToolResearchItem,
  ToolInventoryItem,
  ToolResearchCategory,
  ContentPipelineStatus,
  MaintenanceEntry,
} from '@hooomz/shared-contracts';
import type { ActivityService } from '../../repositories/activity.repository';
import { ToolPlatformRepository } from '../../repositories/labs/toolPlatform.repository';
import { ToolResearchItemRepository } from '../../repositories/labs/toolResearchItem.repository';
import { ToolInventoryRepository } from '../../repositories/labs/toolInventory.repository';

const CONTENT_PIPELINE_ORDER: ContentPipelineStatus[] = ['planned', 'filmed', 'edited', 'published'];

export class ToolResearchService {
  constructor(
    private platformRepo: ToolPlatformRepository,
    private researchItemRepo: ToolResearchItemRepository,
    private inventoryRepo: ToolInventoryRepository,
    private activity: ActivityService,
  ) {}

  // ============================================================================
  // Platforms
  // ============================================================================

  async getPlatforms(): Promise<ToolPlatform[]> {
    return this.platformRepo.findAll();
  }

  async getPlatformById(id: string): Promise<ToolPlatform | null> {
    return this.platformRepo.findById(id);
  }

  async createPlatform(data: Omit<ToolPlatform, 'id' | 'metadata'>): Promise<ToolPlatform> {
    return this.platformRepo.create(data);
  }

  // ============================================================================
  // Research items
  // ============================================================================

  async getResearchItems(category?: ToolResearchCategory): Promise<ToolResearchItem[]> {
    if (category) {
      return this.researchItemRepo.findByCategory(category);
    }
    return this.researchItemRepo.findAll();
  }

  async createResearchItem(data: Omit<ToolResearchItem, 'id' | 'metadata'>): Promise<ToolResearchItem> {
    return this.researchItemRepo.create(data);
  }

  async updateResearchItem(
    id: string,
    data: Partial<Omit<ToolResearchItem, 'id' | 'metadata'>>,
  ): Promise<ToolResearchItem | null> {
    return this.researchItemRepo.update(id, data);
  }

  // ============================================================================
  // Inventory
  // ============================================================================

  async getInventory(filters?: { status?: string; platform?: string; category?: string }): Promise<ToolInventoryItem[]> {
    const all = await this.inventoryRepo.findAll();
    if (!filters) return all;

    return all.filter((item) => {
      if (filters.status && filters.status !== 'All' && item.status !== filters.status) return false;
      if (filters.platform && filters.platform !== 'All' && item.platform !== filters.platform) return false;
      if (filters.category && filters.category !== 'All' && item.category !== filters.category) return false;
      return true;
    });
  }

  async createInventoryItem(data: Omit<ToolInventoryItem, 'id' | 'metadata'> & { id?: string }): Promise<ToolInventoryItem> {
    return this.inventoryRepo.create(data);
  }

  async updateInventoryItem(id: string, data: Partial<Omit<ToolInventoryItem, 'id' | 'metadata'>>): Promise<ToolInventoryItem | null> {
    return this.inventoryRepo.update(id, data);
  }

  // ============================================================================
  // P1: Purchase Tracking
  // ============================================================================

  async markAsPurchased(
    researchItemId: string,
    date: string,
    price: number,
    retailer: string,
  ): Promise<{ researchItem: ToolResearchItem; inventoryItem: ToolInventoryItem }> {
    const research = await this.researchItemRepo.findById(researchItemId);
    if (!research) throw new Error(`Research item not found: ${researchItemId}`);

    // Create inventory record from research item
    const inventoryItem = await this.createInventoryItem({
      item: research.item,
      brand: retailer,
      category: research.category,
      platform: '\u2014',
      status: 'Owned' as const,
      condition: 'New',
      pricePaid: price,
      source: retailer,
      labsRole: research.notes,
      notes: `Purchased from research: ${research.item}`,
      researchItemId,
      purchasedDate: date,
    });

    // Update research item with purchase info
    const updatedResearch = await this.researchItemRepo.update(researchItemId, {
      purchased: true,
      purchasedDate: date,
      purchasedPrice: price,
      purchasedRetailer: retailer,
      inventoryItemId: inventoryItem.id,
    });

    // Fire activity event
    this.activity.logLabsEvent('labs.tool.purchased', inventoryItem.id, {
      entity_name: research.item,
      price_paid: price,
      retailer,
      research_item_id: researchItemId,
    }).catch((err) => console.error('Failed to log labs.tool.purchased:', err));

    return { researchItem: updatedResearch!, inventoryItem };
  }

  async markAsReceived(
    id: string,
    date: string,
    price?: number,
  ): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const updated = await this.inventoryRepo.update(id, {
      status: 'Owned' as const,
      purchasedDate: date,
      ...(price != null ? { pricePaid: price } : {}),
    });

    this.activity.logLabsEvent('labs.tool.purchased', id, {
      entity_name: item.item,
      price_paid: price,
      action: 'marked_as_received',
    }).catch((err) => console.error('Failed to log markAsReceived:', err));

    return updated;
  }

  async retireInventoryItem(
    id: string,
    reason?: string,
    replacedById?: string,
  ): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const updated = await this.inventoryRepo.update(id, {
      status: 'Retired' as const,
      retiredDate: new Date().toISOString(),
      retiredReason: reason,
      replacedById,
    });

    this.activity.logLabsEvent('labs.tool.retired', id, {
      entity_name: item.item,
      reason,
      replaced_by: replacedById,
    }).catch((err) => console.error('Failed to log labs.tool.retired:', err));

    return updated;
  }

  async archiveInventoryItem(id: string, reason?: string): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const updated = await this.inventoryRepo.update(id, {
      status: 'Archived' as const,
      retiredDate: new Date().toISOString(),
      retiredReason: reason || 'Archived',
    });

    this.activity.logLabsEvent('labs.tool.retired', id, {
      entity_name: item.item,
      reason: reason || 'Archived',
    }).catch((err) => console.error('Failed to log archive:', err));

    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return false;

    const deleted = await this.inventoryRepo.delete(id);

    if (deleted) {
      this.activity.logLabsEvent('labs.tool.retired', id, {
        entity_name: item.item,
        reason: 'Deleted permanently',
      }).catch((err) => console.error('Failed to log delete:', err));
    }

    return deleted;
  }

  async registerRidgid(id: string, registrationDate: string): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const updated = await this.inventoryRepo.update(id, {
      ridgidRegistered: true,
      ridgidRegistrationDate: registrationDate,
    });

    this.activity.logLabsEvent('labs.tool.purchased', id, {
      entity_name: `RIDGID registration: ${item.item}`,
      registration_date: registrationDate,
    }).catch((err) => console.error('Failed to log RIDGID registration:', err));

    return updated;
  }

  // ============================================================================
  // P2: Usage Tracking
  // ============================================================================

  async logUse(id: string): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const updated = await this.inventoryRepo.update(id, {
      usageCount: (item.usageCount ?? 0) + 1,
      lastUsedDate: new Date().toISOString(),
    });

    this.activity.logLabsEvent('labs.tool.used', id, {
      entity_name: item.item,
      usage_count: (item.usageCount ?? 0) + 1,
    }).catch((err) => console.error('Failed to log labs.tool.used:', err));

    return updated;
  }

  // ============================================================================
  // P2: Content Pipeline
  // ============================================================================

  async advanceContentStatus(
    entityType: 'research' | 'inventory',
    id: string,
  ): Promise<ToolResearchItem | ToolInventoryItem | null> {
    if (entityType === 'research') {
      const item = await this.researchItemRepo.findById(id);
      if (!item) return null;

      const currentIndex = item.contentStatus
        ? CONTENT_PIPELINE_ORDER.indexOf(item.contentStatus)
        : -1;
      const nextStatus = CONTENT_PIPELINE_ORDER[currentIndex + 1];
      if (!nextStatus) return item; // Already at published

      const updated = await this.researchItemRepo.update(id, { contentStatus: nextStatus });

      this.activity.logLabsEvent('labs.content.status', id, {
        entity_name: item.item,
        from_status: item.contentStatus ?? 'none',
        to_status: nextStatus,
      }).catch((err) => console.error('Failed to log labs.content.status:', err));

      return updated;
    } else {
      const item = await this.inventoryRepo.findById(id);
      if (!item) return null;

      const currentIndex = item.contentStatus
        ? CONTENT_PIPELINE_ORDER.indexOf(item.contentStatus)
        : -1;
      const nextStatus = CONTENT_PIPELINE_ORDER[currentIndex + 1];
      if (!nextStatus) return item;

      const updated = await this.inventoryRepo.update(id, { contentStatus: nextStatus });

      this.activity.logLabsEvent('labs.content.status', id, {
        entity_name: item.item,
        from_status: item.contentStatus ?? 'none',
        to_status: nextStatus,
      }).catch((err) => console.error('Failed to log labs.content.status:', err));

      return updated;
    }
  }

  // ============================================================================
  // P2: Maintenance Log
  // ============================================================================

  async addMaintenanceEntry(id: string, entry: MaintenanceEntry): Promise<ToolInventoryItem | null> {
    const item = await this.inventoryRepo.findById(id);
    if (!item) return null;

    const log = [...(item.maintenanceLog ?? []), entry];
    return this.inventoryRepo.update(id, { maintenanceLog: log });
  }

  // ============================================================================
  // Clear All
  // ============================================================================

  async clearAll(): Promise<void> {
    const platforms = await this.platformRepo.findAll();
    for (const p of platforms) await this.platformRepo.delete(p.id);
    const items = await this.researchItemRepo.findAll();
    for (const i of items) await this.researchItemRepo.delete(i.id);
    const inv = await this.inventoryRepo.findAll();
    for (const i of inv) await this.inventoryRepo.delete(i.id);
  }
}
