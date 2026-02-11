/**
 * Labs Catalog Service — wraps product, technique, tool method, combination repos
 * with activity logging
 */

import type { LabsProduct, LabsTechnique, LabsToolMethod, LabsCombination } from '@hooomz/shared-contracts';
import type { LabsProductRepository } from '../../repositories/labs';
import type { LabsTechniqueRepository } from '../../repositories/labs';
import type { LabsToolMethodRepository } from '../../repositories/labs';
import type { LabsCombinationRepository } from '../../repositories/labs';
import type { ActivityService } from '../../repositories/activity.repository';

export class LabsCatalogService {
  constructor(
    private products: LabsProductRepository,
    private techniques: LabsTechniqueRepository,
    private toolMethods: LabsToolMethodRepository,
    private combinations: LabsCombinationRepository,
    private activity: ActivityService
  ) {}

  // Products
  async createProduct(data: Omit<LabsProduct, 'id' | 'metadata'>): Promise<LabsProduct> {
    const product = await this.products.create(data);
    this.activity.logLabsEvent('labs.catalog_item_added', product.id, {
      entity_name: product.name,
      knowledge_type: 'product',
    }).catch((err) => console.error('Failed to log labs.catalog_item_added:', err));
    return product;
  }

  async findProductById(id: string) { return this.products.findById(id); }
  async findAllProducts() { return this.products.findAll(); }
  async findActiveProducts() { return this.products.findActive(); }
  async findProductsByCategory(category: string) { return this.products.findByCategory(category); }
  async searchProducts(query: string) { return this.products.search(query); }
  async updateProduct(id: string, data: Partial<Omit<LabsProduct, 'id' | 'metadata'>>) {
    return this.products.update(id, data);
  }
  async deleteProduct(id: string) { return this.products.delete(id); }

  // Techniques
  async createTechnique(data: Omit<LabsTechnique, 'id' | 'metadata'>): Promise<LabsTechnique> {
    const technique = await this.techniques.create(data);
    this.activity.logLabsEvent('labs.catalog_item_added', technique.id, {
      entity_name: technique.name,
      knowledge_type: 'technique',
    }).catch((err) => console.error('Failed to log labs.catalog_item_added:', err));
    return technique;
  }

  async findTechniqueById(id: string) { return this.techniques.findById(id); }
  async findAllTechniques() { return this.techniques.findAll(); }
  async findActiveTechniques() { return this.techniques.findActive(); }
  async findTechniquesByCategory(category: string) { return this.techniques.findByCategory(category); }
  async searchTechniques(query: string) { return this.techniques.search(query); }
  async findTechniquesBySopId(sopId: string) { return this.techniques.findBySopId(sopId); }
  async updateTechnique(id: string, data: Partial<Omit<LabsTechnique, 'id' | 'metadata'>>) {
    return this.techniques.update(id, data);
  }
  async deleteTechnique(id: string) { return this.techniques.delete(id); }

  // Tool Methods
  async createToolMethod(data: Omit<LabsToolMethod, 'id' | 'metadata'>): Promise<LabsToolMethod> {
    const toolMethod = await this.toolMethods.create(data);
    this.activity.logLabsEvent('labs.catalog_item_added', toolMethod.id, {
      entity_name: toolMethod.name,
      knowledge_type: 'tool_method',
    }).catch((err) => console.error('Failed to log labs.catalog_item_added:', err));
    return toolMethod;
  }

  async findToolMethodById(id: string) { return this.toolMethods.findById(id); }
  async findAllToolMethods() { return this.toolMethods.findAll(); }
  async findActiveToolMethods() { return this.toolMethods.findActive(); }
  async findToolMethodsByType(type: string) { return this.toolMethods.findByToolType(type); }
  async searchToolMethods(query: string) { return this.toolMethods.search(query); }
  async updateToolMethod(id: string, data: Partial<Omit<LabsToolMethod, 'id' | 'metadata'>>) {
    return this.toolMethods.update(id, data);
  }
  async deleteToolMethod(id: string) { return this.toolMethods.delete(id); }

  // Combinations
  async createCombination(data: Omit<LabsCombination, 'id' | 'metadata'>): Promise<LabsCombination> {
    return this.combinations.create(data);
  }

  async findCombinationById(id: string) { return this.combinations.findById(id); }
  async findAllCombinations() { return this.combinations.findAll(); }
  async findCombinationsByComponent(refId: string) { return this.combinations.findByComponentId(refId); }
  async incrementCombinationObserved(id: string, quality?: number) {
    return this.combinations.incrementObserved(id, quality);
  }
  async updateCombination(id: string, data: Partial<Omit<LabsCombination, 'id' | 'metadata'>>) {
    return this.combinations.update(id, data);
  }
  async deleteCombination(id: string) { return this.combinations.delete(id); }
}
