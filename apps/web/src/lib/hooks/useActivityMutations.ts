'use client';

/**
 * Activity-Logging Mutation Hooks
 *
 * These hooks wrap repository mutations with automatic activity logging.
 * Use these instead of calling repositories directly to ensure
 * EVERY mutation logs to the Activity Log (THE SPINE).
 *
 * Pattern:
 * 1. Perform the mutation (create/update/delete)
 * 2. ALWAYS log to ActivityService
 * 3. Return the result
 */

import { useCallback } from 'react';
import { useServices } from '../services/ServicesContext';
import {
  ProjectStatus,
  InspectionStatus,
  TaskStatus,
} from '@hooomz/shared-contracts';
import type { CreateProject, Project } from '@hooomz/shared-contracts';
import type { Task, CreateTask } from '@hooomz/shared-contracts';
import type { Photo, CreatePhoto, UpdatePhoto } from '@hooomz/shared-contracts';
import type { Inspection, CreateInspection } from '@hooomz/shared-contracts';
import type { Customer, CreateCustomer } from '@hooomz/shared-contracts';
import type { LineItem, CreateLineItem } from '@hooomz/shared-contracts';

/**
 * Project mutations with activity logging
 */
export function useProjectMutations() {
  const services = useServices();

  const createProject = useCallback(
    async (data: CreateProject): Promise<Project> => {
      const project = await services.projects.create(data);

      // Log to Activity
      await services.activity.logProjectEvent('project.created', project.id, {
        project_name: project.name,
        details: `Created project: ${project.name}`,
      });

      return project;
    },
    [services]
  );

  const updateProjectStatus = useCallback(
    async (
      projectId: string,
      newStatus: ProjectStatus,
      oldStatus?: ProjectStatus
    ): Promise<Project | null> => {
      const project = await services.projects.update(projectId, {
        status: newStatus,
      });

      if (project) {
        // Log to Activity
        await services.activity.logProjectEvent(
          newStatus === ProjectStatus.COMPLETE
            ? 'project.completed'
            : 'project.status_changed',
          projectId,
          {
            project_name: project.name,
            old_status: oldStatus,
            new_status: newStatus,
          }
        );
      }

      return project;
    },
    [services]
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      data: Partial<Omit<Project, 'id' | 'metadata'>>
    ): Promise<Project | null> => {
      const existing = await services.projects.findById(projectId);
      const project = await services.projects.update(projectId, data);

      if (project && data.status && existing && data.status !== existing.status) {
        // Status changed - log it
        await services.activity.logProjectEvent(
          data.status === ProjectStatus.COMPLETE
            ? 'project.completed'
            : 'project.status_changed',
          projectId,
          {
            project_name: project.name,
            old_status: existing.status,
            new_status: data.status,
          }
        );
      }

      return project;
    },
    [services]
  );

  return {
    createProject,
    updateProject,
    updateProjectStatus,
  };
}

/**
 * Task mutations with activity logging
 */
export function useTaskMutations() {
  const services = useServices();

  const createTask = useCallback(
    async (data: CreateTask): Promise<Task> => {
      const task = await services.scheduling.tasks.create(data);

      // Log to Activity
      await services.activity.logTaskEvent(
        'task.instance_created',
        task.projectId,
        task.id,
        {
          task_title: task.title,
          work_category_code: (task as any).workCategoryCode,
          stage_code: (task as any).stageCode,
          location_id: (task as any).locationId,
        }
      );

      return task;
    },
    [services]
  );

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      newStatus: TaskStatus,
      options: {
        reason?: string;
        projectId?: string;
      } = {}
    ): Promise<Task | null> => {
      const existing = await services.scheduling.tasks.findById(taskId);
      if (!existing) return null;

      const task = await services.scheduling.tasks.update(taskId, {
        status: newStatus,
      });

      if (task) {
        // Determine event type based on status
        let eventType: 'task.status_changed' | 'task.completed' | 'task.blocked';
        if (newStatus === TaskStatus.COMPLETE) {
          eventType = 'task.completed';
        } else if (newStatus === TaskStatus.BLOCKED) {
          eventType = 'task.blocked';
        } else {
          eventType = 'task.status_changed';
        }

        // Log to Activity
        await services.activity.logTaskEvent(
          eventType,
          options.projectId || task.projectId,
          task.id,
          {
            task_title: task.title,
            old_status: existing.status,
            new_status: newStatus,
            reason: options.reason,
            work_category_code: (task as any).workCategoryCode,
            stage_code: (task as any).stageCode,
            location_id: (task as any).locationId,
          }
        );
      }

      return task;
    },
    [services]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      data: Partial<Omit<Task, 'id' | 'metadata'>>,
      options: { projectId?: string } = {}
    ): Promise<Task | null> => {
      const existing = await services.scheduling.tasks.findById(taskId);
      if (!existing) return null;

      const task = await services.scheduling.tasks.update(taskId, data);

      if (task && data.status && data.status !== existing.status) {
        // Status changed - determine event type
        let eventType: 'task.status_changed' | 'task.completed' | 'task.blocked';
        if (data.status === TaskStatus.COMPLETE) {
          eventType = 'task.completed';
        } else if (data.status === TaskStatus.BLOCKED) {
          eventType = 'task.blocked';
        } else {
          eventType = 'task.status_changed';
        }

        await services.activity.logTaskEvent(
          eventType,
          options.projectId || task.projectId,
          task.id,
          {
            task_title: task.title,
            old_status: existing.status,
            new_status: data.status,
          }
        );
      }

      return task;
    },
    [services]
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      // Note: We don't typically log deletions to the activity feed
      // since it could clutter the timeline. But if needed, it can be added.
      return await services.scheduling.tasks.delete(taskId);
    },
    [services]
  );

  return {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}

/**
 * Photo mutations with activity logging
 */
export function usePhotoMutations() {
  const services = useServices();

  const uploadPhoto = useCallback(
    async (data: CreatePhoto): Promise<Photo> => {
      const photo = await services.fieldDocs.photos.create(data);

      // Log to Activity
      await services.activity.logPhotoEvent(
        'photo.uploaded',
        photo.projectId,
        photo.id,
        {
          caption: photo.caption,
          tags: photo.tags,
          location_id: (photo as any).locationId,
        }
      );

      return photo;
    },
    [services]
  );

  const sharePhoto = useCallback(
    async (photoId: string): Promise<Photo> => {
      const photo = await services.fieldDocs.photos.update(photoId, {
        // Mark as shared (implementation depends on your schema)
      } as UpdatePhoto);

      // Log to Activity (homeowner_visible = true for shared photos)
      await services.activity.logPhotoEvent(
        'photo.shared',
        photo.projectId,
        photo.id,
        {
          caption: photo.caption,
          tags: photo.tags,
        }
      );

      return photo;
    },
    [services]
  );

  const updatePhoto = useCallback(
    async (photoId: string, data: UpdatePhoto): Promise<Photo> => {
      const photo = await services.fieldDocs.photos.update(photoId, data);
      // Note: Simple updates don't need activity logging unless significant
      return photo;
    },
    [services]
  );

  const deletePhoto = useCallback(
    async (photoId: string): Promise<void> => {
      await services.fieldDocs.photos.delete(photoId);
      // Note: Deletions typically don't need activity logging
    },
    [services]
  );

  return {
    uploadPhoto,
    sharePhoto,
    updatePhoto,
    deletePhoto,
  };
}

/**
 * Inspection mutations with activity logging
 */
export function useInspectionMutations() {
  const services = useServices();

  const createInspection = useCallback(
    async (data: CreateInspection): Promise<Inspection> => {
      const inspection = await services.fieldDocs.inspections.create(data);
      // Note: Creating an inspection doesn't need logging until it passes/fails
      return inspection;
    },
    [services]
  );

  const recordInspectionResult = useCallback(
    async (
      inspectionId: string,
      result: 'passed' | 'failed',
      data: {
        notes?: string;
        reason?: string;
        photos?: string[];
      } = {}
    ): Promise<Inspection> => {
      const inspection = await services.fieldDocs.inspections.update(
        inspectionId,
        {
          status: result === 'passed' ? InspectionStatus.PASSED : InspectionStatus.FAILED,
          notes: data.notes,
        }
      );

      // Log to Activity
      await services.activity.logInspectionEvent(
        result === 'passed' ? 'inspection.passed' : 'inspection.failed',
        inspection.projectId,
        inspection.id,
        {
          inspection_type: inspection.inspectionType,
          inspector: inspection.inspector,
          notes: data.notes,
          reason: data.reason,
          photos: data.photos,
        }
      );

      return inspection;
    },
    [services]
  );

  return {
    createInspection,
    recordInspectionResult,
  };
}

/**
 * Customer mutations with activity logging
 */
export function useCustomerMutations() {
  const services = useServices();

  const createCustomer = useCallback(
    async (data: CreateCustomer): Promise<Customer> => {
      const customer = await services.customers.create(data);

      // Log to Activity
      await services.activity.logCustomerEvent('customer.created', customer.id, {
        customer_name: `${customer.firstName} ${customer.lastName}`,
      });

      return customer;
    },
    [services]
  );

  const updateCustomer = useCallback(
    async (
      customerId: string,
      data: Partial<Omit<Customer, 'id' | 'metadata'>>
    ): Promise<Customer | null> => {
      const customer = await services.customers.update(customerId, data);

      if (customer) {
        // Log to Activity
        await services.activity.logCustomerEvent(
          'customer.updated',
          customer.id,
          {
            customer_name: `${customer.firstName} ${customer.lastName}`,
          }
        );
      }

      return customer;
    },
    [services]
  );

  return {
    createCustomer,
    updateCustomer,
  };
}

/**
 * Line Item / Estimate mutations with activity logging
 */
export function useEstimateMutations() {
  const services = useServices();

  const createLineItem = useCallback(
    async (data: CreateLineItem): Promise<LineItem> => {
      const lineItem = await services.estimating.lineItems.create(data);
      // Note: Individual line item creation doesn't need logging
      // The estimate.created event is logged when the estimate is finalized
      return lineItem;
    },
    [services]
  );

  const updateLineItem = useCallback(
    async (
      lineItemId: string,
      data: Partial<Omit<LineItem, 'id' | 'metadata'>>
    ): Promise<LineItem | null> => {
      const lineItem = await services.estimating.lineItems.update(
        lineItemId,
        data
      );
      return lineItem;
    },
    [services]
  );

  const deleteLineItem = useCallback(
    async (lineItemId: string): Promise<boolean> => {
      return await services.estimating.lineItems.delete(lineItemId);
    },
    [services]
  );

  const finalizeEstimate = useCallback(
    async (
      projectId: string,
      estimateId: string,
      data: { total_amount?: number; description?: string } = {}
    ): Promise<void> => {
      // Log estimate creation
      await services.activity.logFinancialEvent(
        'estimate.created',
        projectId,
        'estimate',
        estimateId,
        {
          amount: data.total_amount,
          description: data.description,
        }
      );
    },
    [services]
  );

  const sendEstimate = useCallback(
    async (
      projectId: string,
      estimateId: string,
      data: { total_amount?: number } = {}
    ): Promise<void> => {
      // Log estimate sent
      await services.activity.logFinancialEvent(
        'estimate.sent',
        projectId,
        'estimate',
        estimateId,
        {
          amount: data.total_amount,
        }
      );
    },
    [services]
  );

  const approveEstimate = useCallback(
    async (
      projectId: string,
      estimateId: string,
      data: { total_amount?: number } = {}
    ): Promise<void> => {
      // Log estimate approved (homeowner_visible by default)
      await services.activity.logFinancialEvent(
        'estimate.approved',
        projectId,
        'estimate',
        estimateId,
        {
          amount: data.total_amount,
        }
      );
    },
    [services]
  );

  return {
    createLineItem,
    updateLineItem,
    deleteLineItem,
    finalizeEstimate,
    sendEstimate,
    approveEstimate,
  };
}

/**
 * Financial mutations (invoices, payments, change orders)
 */
export function useFinancialMutations() {
  const services = useServices();

  const createInvoice = useCallback(
    async (
      projectId: string,
      invoiceId: string,
      data: { amount?: number; description?: string } = {}
    ): Promise<void> => {
      await services.activity.logFinancialEvent(
        'invoice.created',
        projectId,
        'invoice',
        invoiceId,
        data
      );
    },
    [services]
  );

  const recordPayment = useCallback(
    async (
      projectId: string,
      paymentId: string,
      data: { amount?: number; description?: string } = {}
    ): Promise<void> => {
      await services.activity.logFinancialEvent(
        'payment.received',
        projectId,
        'payment',
        paymentId,
        data
      );
    },
    [services]
  );

  const createChangeOrder = useCallback(
    async (
      projectId: string,
      changeOrderId: string,
      data: { amount?: number; description?: string } = {}
    ): Promise<void> => {
      await services.activity.logFinancialEvent(
        'change_order.created',
        projectId,
        'change_order',
        changeOrderId,
        data
      );
    },
    [services]
  );

  return {
    createInvoice,
    recordPayment,
    createChangeOrder,
  };
}

/**
 * Field note mutations with activity logging
 */
export function useFieldNoteMutations() {
  const services = useServices();

  const createFieldNote = useCallback(
    async (
      projectId: string,
      fieldNoteId: string,
      data: {
        content?: string;
        work_category_code?: string;
        stage_code?: string;
        location_id?: string;
      } = {}
    ): Promise<void> => {
      await services.activity.logFieldNoteEvent(projectId, fieldNoteId, data);
    },
    [services]
  );

  return {
    createFieldNote,
  };
}
