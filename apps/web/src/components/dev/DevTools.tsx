'use client';

/**
 * Dev Tools Component - Development utilities for testing
 *
 * Provides UI controls for:
 * - Seeding demo data
 * - Viewing IndexedDB status
 * - Clearing data
 *
 * Only shown in development mode.
 */

import { useState, useEffect } from 'react';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { seedAllData, hasExistingData } from '@/lib/seed/seedData';
import { seedAllLabsData } from '@/lib/data/seedAll';
import { useQueryClient } from '@tanstack/react-query';

interface DevToolsProps {
  /** Position of the dev tools panel */
  position?: 'bottom-left' | 'bottom-right';
}

export function DevTools({ position = 'bottom-left' }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { services, isLoading: servicesLoading } = useServicesContext();
  const queryClient = useQueryClient();

  // Check for existing data when services are ready
  useEffect(() => {
    if (services && !servicesLoading) {
      hasExistingData().then(setHasData).catch(console.error);
    }
  }, [services, servicesLoading]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleSeedData = async () => {
    if (!services) return;

    setIsSeeding(true);
    setMessage(null);

    try {
      const result = await seedAllData();
      const labsResult = await seedAllLabsData(services);
      setMessage(
        `Created ${result.customerIds.length} customers, ${result.projectIds.length} projects, ${labsResult.sops} SOPs, ${labsResult.knowledgeItems} knowledge items`
      );
      setHasData(true);

      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries();
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Delete ALL data and reload? This cannot be undone.')) return;

    try {
      // Delete all IndexedDB databases
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      // Hard reload
      window.location.reload();
    } catch {
      // Fallback: delete known DB name
      indexedDB.deleteDatabase('hooomz-storage');
      window.location.reload();
    }
  };

  const positionClasses =
    position === 'bottom-left' ? 'bottom-20 left-4' : 'bottom-20 right-4';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono hover:bg-slate-700 transition-colors"
        title="Dev Tools"
      >
        {isOpen ? '✕' : '🛠️'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={`absolute bottom-12 ${position === 'bottom-left' ? 'left-0' : 'right-0'} bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[280px]`}>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>🛠️</span> Dev Tools
          </h3>

          {/* Services Status */}
          <div className="mb-4 p-2 bg-slate-50 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  services ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span>
                IndexedDB: {servicesLoading ? 'Loading...' : services ? 'Ready' : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasData === null
                    ? 'bg-gray-400'
                    : hasData
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                }`}
              />
              <span>
                Data:{' '}
                {hasData === null
                  ? 'Checking...'
                  : hasData
                    ? 'Has data'
                    : 'Empty'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSeedData}
              disabled={isSeeding || !services}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSeeding || !services
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {isSeeding ? '⏳ Seeding...' : '🌱 Seed Demo Data'}
            </button>

            <button
              onClick={handleClearData}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              🗑️ Reset All Data
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-3 p-2 rounded-lg text-xs ${
                message.startsWith('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {message}
            </div>
          )}

          {/* Environment Info */}
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <div>Mode: Development</div>
            <div>Storage: IndexedDB (Offline-First)</div>
          </div>
        </div>
      )}
    </div>
  );
}
