'use client';

/**
 * Expense & PO Tracker Hooks
 * Query and mutate vendors, job expenses, and purchase orders.
 * Repositories instantiated from services.storage (IndexedDB).
 */

import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useServicesContext } from '../services/ServicesContext';
import { VendorRepository, type Vendor, type CreateVendor } from '../repositories/vendor.repository';
import {
  JobExpenseRepository,
  type JobExpense,
  type CreateJobExpense,
} from '../repositories/jobExpense.repository';
import {
  PurchaseOrderRepository,
  type PurchaseOrder,
  type CreatePurchaseOrder,
} from '../repositories/purchaseOrder.repository';

// Re-export types for consumers
export type { Vendor, CreateVendor } from '../repositories/vendor.repository';
export type {
  JobExpense,
  CreateJobExpense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentType,
} from '../repositories/jobExpense.repository';
export type {
  PurchaseOrder,
  CreatePurchaseOrder,
  POLineItem,
  POStatus,
  POApprovalStatus,
} from '../repositories/purchaseOrder.repository';

// ── Query Keys ──

const KEYS = {
  vendors: {
    all: ['expense-tracker', 'vendors'] as QueryKey,
  },
  expenses: {
    byJob: (jobId: string) => ['expense-tracker', 'expenses', 'job', jobId] as QueryKey,
    byStatus: (status: string) => ['expense-tracker', 'expenses', 'status', status] as QueryKey,
    pendingReimbursements: ['expense-tracker', 'expenses', 'reimbursements-pending'] as QueryKey,
    pendingReview: ['expense-tracker', 'expenses', 'pending-review'] as QueryKey,
    all: ['expense-tracker', 'expenses'] as QueryKey,
  },
  pos: {
    byJob: (jobId: string) => ['expense-tracker', 'pos', 'job', jobId] as QueryKey,
    retroactivePending: ['expense-tracker', 'pos', 'retroactive-pending'] as QueryKey,
    all: ['expense-tracker', 'pos'] as QueryKey,
  },
};

// ── Repo Helpers ──

function useRepos() {
  const { services } = useServicesContext();
  return useMemo(() => {
    if (!services) return null;
    return {
      vendors: new VendorRepository(services.storage),
      expenses: new JobExpenseRepository(services.storage),
      pos: new PurchaseOrderRepository(services.storage),
    };
  }, [services]);
}

// ════════════════════════════════════════
// VENDOR HOOKS
// ════════════════════════════════════════

export function useVendors() {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.vendors.all,
    queryFn: () => repos!.vendors.findAll(),
    enabled: !!repos,
    staleTime: 30_000,
  });
}

export function useCreateVendor() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendor) => {
      if (!repos) throw new Error('Services not ready');
      return repos.vendors.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.vendors.all }); },
  });
}

export function useUpdateVendor() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Vendor, 'id' | 'createdAt'>> }) => {
      if (!repos) throw new Error('Services not ready');
      return repos.vendors.update(id, data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.vendors.all }); },
  });
}

export function useDeleteVendor() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!repos) throw new Error('Services not ready');
      return repos.vendors.delete(id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.vendors.all }); },
  });
}

// ════════════════════════════════════════
// JOB EXPENSE HOOKS
// ════════════════════════════════════════

export function useJobExpenses(jobId: string | undefined) {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.expenses.byJob(jobId || ''),
    queryFn: () => repos!.expenses.findByJob(jobId!),
    enabled: !!repos && !!jobId,
    staleTime: 5_000,
  });
}

export function useCreateExpense() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobExpense) => {
      if (!repos) throw new Error('Services not ready');
      return repos.expenses.create(data);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEYS.expenses.byJob(result.jobId) });
      qc.invalidateQueries({ queryKey: KEYS.expenses.pendingReview });
      qc.invalidateQueries({ queryKey: KEYS.expenses.pendingReimbursements });
      qc.invalidateQueries({ queryKey: KEYS.expenses.all });
    },
  });
}

export function useUpdateExpense() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<JobExpense, 'id' | 'createdAt'>> }) => {
      if (!repos) throw new Error('Services not ready');
      return repos.expenses.update(id, data);
    },
    onSuccess: (result) => {
      if (result) {
        qc.invalidateQueries({ queryKey: KEYS.expenses.byJob(result.jobId) });
      }
      qc.invalidateQueries({ queryKey: KEYS.expenses.pendingReview });
      qc.invalidateQueries({ queryKey: KEYS.expenses.pendingReimbursements });
      qc.invalidateQueries({ queryKey: KEYS.expenses.all });
    },
  });
}

export function usePendingReimbursements() {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.expenses.pendingReimbursements,
    queryFn: () => repos!.expenses.findPendingReimbursements(),
    enabled: !!repos,
    staleTime: 5_000,
  });
}

export function usePendingExpenseReview() {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.expenses.pendingReview,
    queryFn: () => repos!.expenses.findByStatus('pending'),
    enabled: !!repos,
    staleTime: 5_000,
  });
}

// ════════════════════════════════════════
// PURCHASE ORDER HOOKS
// ════════════════════════════════════════

export function useJobPurchaseOrders(jobId: string | undefined) {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.pos.byJob(jobId || ''),
    queryFn: () => repos!.pos.findByJob(jobId!),
    enabled: !!repos && !!jobId,
    staleTime: 5_000,
  });
}

export function useCreatePurchaseOrder() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrder) => {
      if (!repos) throw new Error('Services not ready');
      return repos.pos.create(data);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEYS.pos.byJob(result.jobId) });
      qc.invalidateQueries({ queryKey: KEYS.pos.retroactivePending });
      qc.invalidateQueries({ queryKey: KEYS.pos.all });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const repos = useRepos();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<PurchaseOrder, 'id' | 'createdAt'>> }) => {
      if (!repos) throw new Error('Services not ready');
      return repos.pos.update(id, data);
    },
    onSuccess: (result) => {
      if (result) {
        qc.invalidateQueries({ queryKey: KEYS.pos.byJob(result.jobId) });
      }
      qc.invalidateQueries({ queryKey: KEYS.pos.retroactivePending });
      qc.invalidateQueries({ queryKey: KEYS.pos.all });
    },
  });
}

export function useRetroactivePOsPending() {
  const repos = useRepos();
  return useQuery({
    queryKey: KEYS.pos.retroactivePending,
    queryFn: () => repos!.pos.findRetroactivePending(),
    enabled: !!repos,
    staleTime: 5_000,
  });
}
