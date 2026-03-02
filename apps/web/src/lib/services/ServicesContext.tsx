'use client';

/**
 * Services Context - React context for dependency injection
 * Provides access to all services throughout the component tree
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Services } from './index';
import { initializeServices } from './index';
import type { TrainingGuide, StandardSOP } from '@hooomz/shared-contracts';
import { SyncEngine } from '../sync/SyncEngine';
import { isSupabaseConfigured } from '../supabase/client';
import { initializeStorage } from '../storage';
import { ActivitySyncService } from '../offline/ActivitySyncService';
import { SyncQueue } from '../repositories/SyncQueue';

async function seedTrainingGuidesIfEmpty(services: Services): Promise<void> {
  const existing = await services.trainingGuides.getAll();
  if (existing.length > 0) return;
  // Dynamic import — keeps ~160KB out of the initial bundle
  const [flr, pnt, trm] = await Promise.all([
    import('../data/tg-flr-001.json').then((m) => m.default).catch(() => null),
    import('../data/tg-pnt-001.json').then((m) => m.default).catch(() => null),
    import('../data/tg-trm-001.json').then((m) => m.default).catch(() => null),
  ]);
  const tgs = [flr, pnt, trm].filter(Boolean) as TrainingGuide[];
  if (tgs.length > 0) await services.trainingGuides.saveMany(tgs);
}

async function seedStandardSOPsIfEmpty(services: Services): Promise<void> {
  const existing = await services.standardSops.getAll();
  if (existing.length > 0) return;
  // Dynamic import — keeps large JSON out of the initial bundle
  const [flrData, pntData, trmData] = await Promise.all([
    import('../data/sop-data-flr.json').then((m) => m.default).catch(() => []),
    import('../data/sop-data-pnt.json').then((m) => m.default).catch(() => []),
    import('../data/sop-data-trm.json').then((m) => m.default).catch(() => []),
  ]);
  const sops = [...flrData, ...pntData, ...trmData] as StandardSOP[];
  if (sops.length > 0) await services.standardSops.saveMany(sops);
}

/**
 * Cross-device sync: pull remote data, push local data if first time.
 * Runs in the background — does not block app rendering.
 */
async function runCrossDeviceSync(): Promise<void> {
  const storage = await initializeStorage();
  const syncEngine = SyncEngine.getInstance(storage);

  // Ensure ActivitySyncService is running — this sets up the queue listener
  // that pushes mutations to Supabase within seconds of creation
  ActivitySyncService.getInstance(storage);

  // Health check — is the sync_data table accessible?
  const health = await syncEngine.healthCheck();
  if (!health.ok) {
    console.warn('Sync table not ready:', health.error);
    return;
  }

  // Pull remote data → merge into local IndexedDB
  const pullResult = await syncEngine.pullAll();
  if (pullResult.merged > 0) {
    console.info(`Sync: pulled ${pullResult.pulled} rows, merged ${pullResult.merged}`);
    // Trigger React Query refetch by dispatching a custom event
    window.dispatchEvent(new CustomEvent('hooomz-sync-complete', { detail: pullResult }));
  }

  // If this device has never pushed, do an initial full upload
  const pushKey = 'hooomz_initial_push_done';
  if (!localStorage.getItem(pushKey)) {
    const pushResult = await syncEngine.pushAll();
    if (pushResult.pushed > 0) {
      console.info(`Sync: initial push — ${pushResult.pushed} entities uploaded`);
    }
    // Clear stale SyncQueue items — pushAll() uploaded everything directly,
    // so any queued items from before sync existed are now redundant.
    // Without this, syncPending() gets clogged processing hundreds of old items
    // and the isSyncing mutex blocks new mutations from ever being pushed.
    const syncQueue = SyncQueue.getInstance(storage);
    await syncQueue.clearAll();
    console.info('Sync: cleared stale SyncQueue after initial push');
    localStorage.setItem(pushKey, new Date().toISOString());
  } else {
    // Even on subsequent loads, clear any synced items to keep the queue lean
    const syncQueue = SyncQueue.getInstance(storage);
    await syncQueue.clearSynced();
  }
}

/** Re-pull from Supabase when the user returns to the app/tab */
function setupVisibilitySync(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isSupabaseConfigured()) {
      runCrossDeviceSync().catch((err) =>
        console.error('Visibility sync error:', err)
      );
    }
  });
}

interface ServicesContextValue {
  services: Services | null;
  isLoading: boolean;
  error: Error | null;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(
  undefined
);

interface ServicesProviderProps {
  children: React.ReactNode;
}

/**
 * Services Provider Component
 * Initializes services and provides them to the component tree
 */
export function ServicesProvider({ children }: ServicesProviderProps) {
  const [services, setServices] = useState<Services | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setIsLoading(true);
        setError(null);

        const initializedServices = await initializeServices();

        // Cleanup stale intake drafts (fire-and-forget)
        initializedServices.intakeDrafts.cleanupStale().catch((err) =>
          console.error('Failed to cleanup stale drafts:', err)
        );

        // Auto-seed training guides if empty (fire-and-forget)
        seedTrainingGuidesIfEmpty(initializedServices).catch((err) =>
          console.error('Failed to seed training guides:', err)
        );

        // Auto-seed standard SOPs if empty (fire-and-forget)
        seedStandardSOPsIfEmpty(initializedServices).catch((err) =>
          console.error('Failed to seed standard SOPs:', err)
        );

        if (mounted) {
          setServices(initializedServices);
          setIsLoading(false);
        }

        // Cross-device sync via Supabase (fire-and-forget, non-blocking)
        if (isSupabaseConfigured()) {
          runCrossDeviceSync().catch((err) =>
            console.error('Cross-device sync error:', err)
          );
          setupVisibilitySync();
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize services'));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Initializing app...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initialization Error
          </h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <ServicesContext.Provider value={{ services, isLoading, error }}>
      {children}
    </ServicesContext.Provider>
  );
}

/**
 * Hook to access services context
 * @throws Error if used outside ServicesProvider
 */
export function useServicesContext(): ServicesContextValue {
  const context = useContext(ServicesContext);

  if (context === undefined) {
    throw new Error(
      'useServicesContext must be used within a ServicesProvider'
    );
  }

  return context;
}

/**
 * Hook to access services
 * @throws Error if services not initialized or used outside provider
 */
export function useServices(): Services {
  const { services } = useServicesContext();

  if (!services) {
    throw new Error('Services not initialized');
  }

  return services;
}

/**
 * Individual service hooks for convenience
 */

export function useProjectService() {
  const services = useServices();
  return services.projects;
}

export function useCustomerService() {
  const services = useServices();
  return services.customers;
}

export function useEstimateService() {
  const services = useServices();
  return services.estimating;
}

// Alias for consistency with naming conventions
export const useEstimatingService = useEstimateService;

export function useTaskService() {
  const services = useServices();
  return services.scheduling.tasks;
}

// Alias for scheduling service access
export function useSchedulingService() {
  const services = useServices();
  return services.scheduling.tasks;
}

export function useInspectionService() {
  const services = useServices();
  return services.fieldDocs.inspections;
}

export function usePhotoService() {
  const services = useServices();
  return services.fieldDocs.photos;
}

// Alias for field docs service access
export function useFieldDocsService() {
  const services = useServices();
  return services.fieldDocs;
}

// Line items and catalog hooks
export function useLineItemService() {
  const services = useServices();
  return services.estimating.lineItems;
}

export function useCatalogService() {
  const services = useServices();
  return services.estimating.catalog;
}

// Activity Log - THE SPINE
// Every mutation should log to this service
export function useActivityService() {
  const services = useServices();
  return services.activity;
}

// Labs - Field data collection system
export function useLabsService() {
  const services = useServices();
  return services.labs;
}
