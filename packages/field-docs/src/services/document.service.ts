/**
 * Document Service
 * Business logic for document management
 */

import type { ActivityEventType } from '@hooomz/shared';
import { EVENT_VISIBILITY_DEFAULTS } from '@hooomz/shared';

// Document explanations for portal sharing
const DOCUMENT_EXPLANATIONS: Record<string, string> = {
  permit: 'This permit confirms your project meets local building code requirements. Keep for your records.',
  warranty: 'Warranty document for materials or workmanship. Reference this for future service claims.',
  manual: 'Operation and maintenance instructions. Reference for care and troubleshooting.',
  contract: 'Your signed agreement outlining the scope and terms of work.',
  change_order: 'Approved change to the original project scope with cost and schedule impact.',
  invoice: 'Billing record for completed work.',
  receipt: 'Proof of purchase for materials installed in your home.',
  drawing: 'Plans and specifications showing what was built.',
  spec_sheet: 'Technical specifications for materials or equipment in your home.',
  other: 'Project documentation for your records.',
};
import type { IDocumentRepository } from '../repositories';
import type {
  Document,
  CreateDocument,
  UpdateDocument,
  DocumentFilters,
  DocumentCategory,
  DocumentWithVersions,
} from '../types';

// Activity service interface
export interface ActivityService {
  log(event: {
    organization_id: string;
    project_id: string;
    property_id: string;
    event_type: ActivityEventType;
    actor_id: string;
    actor_type: 'team_member' | 'system' | 'customer';
    entity_type: string;
    entity_id: string;
    homeowner_visible: boolean;
    event_data: Record<string, unknown>;
  }): Promise<void>;
}

// Storage service interface
export interface StorageService {
  uploadDocument(
    organizationId: string,
    file: File | Blob,
    filename: string,
    category: DocumentCategory
  ): Promise<{ storagePath: string; fileType: string; fileSize: number }>;
  deleteDocument(storagePath: string): Promise<void>;
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

// Property bridge service interface
export interface PropertyBridgeService {
  queueDocument(input: {
    property_id: string;
    project_id: string;
    document_id: string;
    document_data: Record<string, unknown>;
  }): Promise<void>;
}

export interface DocumentServiceDependencies {
  documentRepo: IDocumentRepository;
  storageService?: StorageService;
  activityService?: ActivityService;
}

export class DocumentService {
  private documentRepo: IDocumentRepository;
  private storageService?: StorageService;
  private activityService?: ActivityService;

  constructor(deps: DocumentServiceDependencies) {
    this.documentRepo = deps.documentRepo;
    this.storageService = deps.storageService;
    this.activityService = deps.activityService;
  }

  async uploadDocument(
    organizationId: string,
    name: string,
    category: DocumentCategory,
    file: File | Blob,
    filename: string,
    uploadedBy: string,
    options?: {
      projectId?: string;
      propertyId?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<Document> {
    if (!this.storageService) {
      throw new Error('Storage service not configured');
    }

    // Upload to storage
    const { storagePath, fileType, fileSize } = await this.storageService.uploadDocument(
      organizationId,
      file,
      filename,
      category
    );

    // Create document record
    const document = await this.documentRepo.create({
      organization_id: organizationId,
      project_id: options?.projectId,
      property_id: options?.propertyId,
      name,
      category,
      storage_path: storagePath,
      file_type: fileType,
      file_size: fileSize,
      description: options?.description,
      tags: options?.tags,
      uploaded_by: uploadedBy,
    });

    // Log activity if associated with a project
    if (this.activityService && options?.projectId && options?.propertyId) {
      await this.activityService.log({
        organization_id: organizationId,
        project_id: options.projectId,
        property_id: options.propertyId,
        event_type: 'document.uploaded',
        actor_id: uploadedBy,
        actor_type: 'team_member',
        entity_type: 'document',
        entity_id: document.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['document.uploaded'],
        event_data: { name: document.name, category: document.category },
      });
    }

    return document;
  }

  async createDocumentRecord(data: CreateDocument, actorId: string): Promise<Document> {
    const document = await this.documentRepo.create(data);

    if (this.activityService && data.project_id && data.property_id) {
      await this.activityService.log({
        organization_id: data.organization_id,
        project_id: data.project_id,
        property_id: data.property_id,
        event_type: 'document.uploaded',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'document',
        entity_id: document.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['document.uploaded'],
        event_data: { name: document.name, category: document.category },
      });
    }

    return document;
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.documentRepo.findById(id);
  }

  async getDocumentWithUrl(id: string): Promise<(Document & { url: string }) | null> {
    const document = await this.documentRepo.findById(id);
    if (!document || !this.storageService) return null;

    const url = await this.storageService.getSignedUrl(document.storage_path);
    return { ...document, url };
  }

  async getDocumentWithVersions(id: string): Promise<DocumentWithVersions | null> {
    const document = await this.documentRepo.findById(id);
    if (!document) return null;

    const versions = await this.documentRepo.findVersionHistory(id);
    return { ...document, versions };
  }

  async listByProject(projectId: string): Promise<Document[]> {
    return this.documentRepo.findByProject(projectId);
  }

  async listByProperty(propertyId: string): Promise<Document[]> {
    return this.documentRepo.findByProperty(propertyId);
  }

  async listByOrganization(organizationId: string): Promise<Document[]> {
    return this.documentRepo.findByOrganization(organizationId);
  }

  async listByFilters(filters: DocumentFilters): Promise<Document[]> {
    return this.documentRepo.findByFilters(filters);
  }

  async updateDocument(id: string, data: UpdateDocument): Promise<Document> {
    return this.documentRepo.update(id, data);
  }

  async deleteDocument(id: string): Promise<void> {
    const document = await this.documentRepo.findById(id);
    if (!document) return;

    // Delete from storage
    if (this.storageService) {
      await this.storageService.deleteDocument(document.storage_path);
    }

    // Delete record
    await this.documentRepo.delete(id);
  }

  async shareToPortal(
    id: string,
    actorId: string,
    propertyBridgeService?: PropertyBridgeService
  ): Promise<Document> {
    // Get the document first to determine explanation
    const existingDoc = await this.documentRepo.findById(id);
    if (!existingDoc) {
      throw new Error(`Document ${id} not found`);
    }

    // Generate explanation for homeowner based on category
    const explanation = DOCUMENT_EXPLANATIONS[existingDoc.category] ||
      DOCUMENT_EXPLANATIONS.other;

    // Update document with shared status and explanation
    const document = await this.documentRepo.update(id, {
      shared_to_portal: true,
      portal_explanation: explanation,
    });

    // Queue for property profile if property_id exists
    if (document.property_id && document.project_id && propertyBridgeService) {
      await propertyBridgeService.queueDocument({
        property_id: document.property_id,
        project_id: document.project_id,
        document_id: id,
        document_data: {
          name: document.name,
          category: document.category,
          explanation,
          file_type: document.file_type,
          storage_path: document.storage_path,
          shared_at: new Date().toISOString(),
        },
      });
    }

    // Log activity
    if (this.activityService && document.project_id && document.property_id) {
      await this.activityService.log({
        organization_id: document.organization_id,
        project_id: document.project_id,
        property_id: document.property_id,
        event_type: 'document.shared',
        actor_id: actorId,
        actor_type: 'team_member',
        entity_type: 'document',
        entity_id: document.id,
        homeowner_visible: EVENT_VISIBILITY_DEFAULTS['document.shared'],
        event_data: {
          name: document.name,
          category: document.category,
          explanation,
        },
      });
    }

    return document;
  }

  async unshareFromPortal(id: string): Promise<Document> {
    return this.documentRepo.unshareFromPortal(id);
  }

  async getSharedDocuments(propertyId: string): Promise<Document[]> {
    return this.documentRepo.findSharedByProperty(propertyId);
  }

  async uploadNewVersion(
    originalId: string,
    file: File | Blob,
    filename: string,
    uploadedBy: string
  ): Promise<Document> {
    if (!this.storageService) {
      throw new Error('Storage service not configured');
    }

    const original = await this.documentRepo.findById(originalId);
    if (!original) {
      throw new Error(`Document ${originalId} not found`);
    }

    // Upload new version to storage
    const { storagePath, fileType, fileSize } = await this.storageService.uploadDocument(
      original.organization_id,
      file,
      filename,
      original.category
    );

    // Create new version record
    return this.documentRepo.createNewVersion(originalId, {
      organization_id: original.organization_id,
      project_id: original.project_id || undefined,
      property_id: original.property_id || undefined,
      name: original.name,
      category: original.category,
      storage_path: storagePath,
      file_type: fileType,
      file_size: fileSize,
      description: original.description || undefined,
      tags: original.tags,
      uploaded_by: uploadedBy,
    });
  }
}
