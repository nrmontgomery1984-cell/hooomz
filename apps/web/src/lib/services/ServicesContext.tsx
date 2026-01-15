'use client';

/**
 * Services Context - React context for dependency injection
 * Provides access to all services throughout the component tree
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Services } from './index';
import { initializeServices } from './index';

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

        if (mounted) {
          setServices(initializedServices);
          setIsLoading(false);
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

export function useTaskService() {
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

export function useChecklistService() {
  const services = useServices();
  return services.fieldDocs.checklists;
}

export function useDashboardService() {
  const services = useServices();
  return services.reporting.dashboards;
}

export function useReportService() {
  const services = useServices();
  return services.reporting.reports;
}

export function useExportService() {
  const services = useServices();
  return services.reporting.exports;
}
