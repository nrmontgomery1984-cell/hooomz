/**
 * Data Integrity Integration Tests
 *
 * Tests referential integrity, cascade behaviors, and validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockCustomer,
  mockProject,
  mockLineItems,
  mockEstimate,
  mockTasks,
  mockInspection,
} from '../fixtures';
import { setupTestEnvironment } from '../setup';

describe('Data Integrity', () => {
  setupTestEnvironment();

  describe('Referential Integrity', () => {
    let customerId: string;
    let projectId: string;
    let estimateId: string;

    beforeEach(async () => {
      // Setup: Create related entities
      const customerService = {} as any;
      const projectService = {} as any;
      const estimatingService = {} as any;

      const customer = await customerService.create(mockCustomer);
      customerId = customer.data!.id;

      const project = await projectService.create({
        ...mockProject,
        customerId,
      });
      projectId = project.data!.id;

      const estimate = await estimatingService.create({
        ...mockEstimate,
        projectId,
      });
      estimateId = estimate.data!.id;
    });

    it('should prevent creating project with invalid customer ID', async () => {
      const projectService = {} as any;

      const response = await projectService.create({
        ...mockProject,
        customerId: 'invalid-customer-id',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error).toContain('customer');
    });

    it('should prevent creating estimate with invalid project ID', async () => {
      const estimatingService = {} as any;

      const response = await estimatingService.create({
        ...mockEstimate,
        projectId: 'invalid-project-id',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error).toContain('project');
    });

    it('should prevent orphaning entities when deleting customer with projects', async () => {
      const customerService = {} as any;

      const response = await customerService.delete(customerId);

      // Should fail because customer has projects
      expect(response.success).toBe(false);
      expect(response.error).toContain('has projects');

      // Customer should still exist
      const customer = await customerService.getById(customerId);
      expect(customer.success).toBe(true);
    });

    it('should prevent orphaning entities when deleting project with estimate', async () => {
      const projectService = {} as any;

      const response = await projectService.delete(projectId);

      // Should fail because project has estimate
      expect(response.success).toBe(false);
      expect(response.error).toContain('has estimate');

      // Project should still exist
      const project = await projectService.getById(projectId);
      expect(project.success).toBe(true);
    });

    it('should maintain referential integrity across all modules', async () => {
      // Add tasks, inspections to project
      const schedulingService = {} as any;
      const fieldDocsService = {} as any;

      await schedulingService.create({
        ...mockTasks[0],
        projectId,
      });

      await fieldDocsService.create({
        ...mockInspection,
        projectId,
      });

      // Verify all entities reference correct project
      const project = await {} as any; // projectService.getById(projectId);
      const tasks = await schedulingService.listByProject(projectId);
      const inspections = await fieldDocsService.listByProject(projectId);

      expect(project.data?.id).toBe(projectId);
      expect(tasks.data?.[0].projectId).toBe(projectId);
      expect(inspections.data?.[0].projectId).toBe(projectId);
    });
  });

  describe('Cascade Behaviors', () => {
    let customerId: string;
    let projectId: string;

    beforeEach(async () => {
      const customerService = {} as any;
      const projectService = {} as any;
      const estimatingService = {} as any;
      const schedulingService = {} as any;

      const customer = await customerService.create(mockCustomer);
      customerId = customer.data!.id;

      const project = await projectService.create({
        ...mockProject,
        customerId,
      });
      projectId = project.data!.id;

      // Create related data
      const estimate = await estimatingService.create({
        ...mockEstimate,
        projectId,
      });

      for (const lineItem of mockLineItems) {
        await estimatingService.addLineItem(estimate.data!.id, {
          ...lineItem,
          estimateId: estimate.data!.id,
          projectId,
        });
      }

      for (const task of mockTasks) {
        await schedulingService.create({
          ...task,
          projectId,
        });
      }
    });

    it('should cascade delete project and all related data', async () => {
      const projectService = {} as any;
      const estimatingService = {} as any;
      const schedulingService = {} as any;

      // Force delete with cascade
      const deleteResponse = await projectService.delete(projectId, {
        cascade: true,
      });

      expect(deleteResponse.success).toBe(true);

      // Verify project is deleted
      const project = await projectService.getById(projectId);
      expect(project.success).toBe(false);

      // Verify estimates are deleted
      const estimates = await estimatingService.listByProject(projectId);
      expect(estimates.data).toHaveLength(0);

      // Verify tasks are deleted
      const tasks = await schedulingService.listByProject(projectId);
      expect(tasks.data).toHaveLength(0);
    });

    it('should cascade delete customer and all projects', async () => {
      const customerService = {} as any;
      const projectService = {} as any;

      // Force delete with cascade
      const deleteResponse = await customerService.delete(customerId, {
        cascade: true,
      });

      expect(deleteResponse.success).toBe(true);

      // Verify customer is deleted
      const customer = await customerService.getById(customerId);
      expect(customer.success).toBe(false);

      // Verify projects are deleted
      const projects = await projectService.listByCustomer(customerId);
      expect(projects.data).toHaveLength(0);
    });

    it('should cascade update when parent entity changes', async () => {
      const customerService = {} as any;
      const projectService = {} as any;

      // Update customer name
      await customerService.update(customerId, {
        name: 'Updated Customer Name',
      });

      // Verify project still references correct customer
      const project = await projectService.getById(projectId);
      expect(project.data?.customerId).toBe(customerId);

      // Verify customer name is updated in project details
      const customer = await customerService.getById(customerId);
      expect(customer.data?.name).toBe('Updated Customer Name');
    });
  });

  describe('Validation Rules', () => {
    it('should enforce required fields', async () => {
      const customerService = {} as any;

      // Missing required name field
      const response = await customerService.create({
        email: 'test@example.com',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('name');
    });

    it('should validate email format', async () => {
      const customerService = {} as any;

      const response = await customerService.create({
        ...mockCustomer,
        email: 'invalid-email',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('email');
    });

    it('should validate date ranges', async () => {
      const projectService = {} as any;
      const customerService = {} as any;

      const customer = await customerService.create(mockCustomer);

      // End date before start date
      const response = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
        startDate: '2024-03-01',
        targetEndDate: '2024-02-01', // Before start date
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('date');
    });

    it('should validate numeric ranges', async () => {
      const estimatingService = {} as any;

      // Negative quantity
      const response = await estimatingService.addLineItem('estimate-id', {
        ...mockLineItems[0],
        quantity: -5,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('quantity');
    });

    it('should validate enum values', async () => {
      const projectService = {} as any;
      const customerService = {} as any;

      const customer = await customerService.create(mockCustomer);

      // Invalid project status
      const response = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
        status: 'invalid-status',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('status');
    });

    it('should validate string lengths', async () => {
      const projectService = {} as any;
      const customerService = {} as any;

      const customer = await customerService.create(mockCustomer);

      // Very long project name (>200 characters)
      const longName = 'A'.repeat(201);
      const response = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
        name: longName,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('name');
    });
  });

  describe('Unique Constraints', () => {
    it('should prevent duplicate customer emails', async () => {
      const customerService = {} as any;

      // Create first customer
      await customerService.create(mockCustomer);

      // Try to create another with same email
      const response = await customerService.create(mockCustomer);

      expect(response.success).toBe(false);
      expect(response.error).toContain('email');
    });

    it('should allow same name for different customers', async () => {
      const customerService = {} as any;

      // Create first customer
      await customerService.create(mockCustomer);

      // Create another with same name but different email
      const response = await customerService.create({
        ...mockCustomer,
        email: 'different@example.com',
      });

      expect(response.success).toBe(true);
    });
  });

  describe('Transaction Integrity', () => {
    it('should rollback on partial failure', async () => {
      const estimatingService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      const estimate = await estimatingService.create({
        ...mockEstimate,
        projectId: project.data!.id,
      });

      // Try to add multiple line items, with one invalid
      const lineItemsWithInvalid = [
        ...mockLineItems.slice(0, 2),
        {
          ...mockLineItems[2],
          quantity: -1, // Invalid
        },
      ];

      const response = await estimatingService.addLineItemsBatch(
        estimate.data!.id,
        lineItemsWithInvalid
      );

      // Should fail
      expect(response.success).toBe(false);

      // No line items should be added (rollback)
      const updatedEstimate = await estimatingService.getById(estimate.data!.id);
      expect(updatedEstimate.data?.lineItems || []).toHaveLength(0);
    });

    it('should maintain consistency during concurrent updates', async () => {
      const estimatingService = {} as any;
      const projectService = {} as any;
      const customerService = {} as any;

      const customer = await customerService.create(mockCustomer);
      const project = await projectService.create({
        ...mockProject,
        customerId: customer.data!.id,
      });

      const estimate = await estimatingService.create({
        ...mockEstimate,
        projectId: project.data!.id,
      });

      // Simulate concurrent updates
      const updates = Promise.all([
        estimatingService.update(estimate.data!.id, { markup: 10 }),
        estimatingService.update(estimate.data!.id, { markup: 15 }),
        estimatingService.update(estimate.data!.id, { markup: 20 }),
      ]);

      await updates;

      // Final state should be consistent
      const finalEstimate = await estimatingService.getById(estimate.data!.id);
      expect([10, 15, 20]).toContain(finalEstimate.data?.markup);
    });
  });
});
