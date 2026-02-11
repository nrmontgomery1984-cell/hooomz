'use client';

/**
 * Labs Seed Data Page
 *
 * Admin page at /labs/seed to load all hardcoded SOPs, knowledge items,
 * and catalog data into IndexedDB for testing.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Database, Trash2, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { seedAllLabsData, type SeedResult } from '@/lib/data/seedAll';
import { seedCustomers, seedProjects, seedTasks, seedActivityEvents, hasExistingData } from '@/lib/seed/seedData';

type SeedState = 'idle' | 'seeding' | 'done' | 'error' | 'clearing';

export default function SeedPage() {
  const { services } = useServicesContext();
  const { endSession } = useActiveCrew();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SeedState>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleSeed = useCallback(async () => {
    if (!services) return;
    setState('seeding');
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      const seedResult = await seedAllLabsData(services, addLog);
      setResult(seedResult);
      queryClient.invalidateQueries();
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`ERROR: ${message}`);
      setState('error');
    }
  }, [services, addLog, queryClient]);

  const handleClearAndReseed = useCallback(async () => {
    if (!services) return;
    setState('clearing');
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      addLog('Clearing existing data...');

      // Clear demo data (customers + projects + tasks)
      const { projects } = await services.projects.findAll();
      let deletedTasks = 0;
      for (const p of projects) {
        const tasks = await services.scheduling.tasks.findByProjectId(p.id);
        for (const t of tasks) {
          await services.scheduling.tasks.delete(t.id);
          deletedTasks++;
        }
        await services.projects.delete(p.id);
      }
      if (projects.length > 0) addLog(`  Deleted ${projects.length} projects and ${deletedTasks} tasks`);

      // Clear customers
      const { customers } = await services.customers.findAll();
      for (const c of customers) {
        await services.customers.delete(c.id);
      }
      if (customers.length > 0) addLog(`  Deleted ${customers.length} customers`);

      // Clear active crew session so CrewGate re-appears
      await endSession();
      addLog('  Cleared crew session');

      // Clear SOPs
      const existingSops = await services.labs.sops.findAll();
      for (const sop of existingSops) {
        await services.labs.sops.archiveSop(sop.id);
      }
      addLog(`  Archived ${existingSops.length} SOPs`);

      // Clear knowledge items
      const existingKnowledge = await services.labs.knowledge.findAll();
      for (const item of existingKnowledge) {
        await services.labs.knowledge.delete(item.id);
      }
      addLog(`  Deleted ${existingKnowledge.length} knowledge items`);

      // Clear catalog
      const existingProducts = await services.labs.catalog.findAllProducts();
      for (const p of existingProducts) {
        await services.labs.catalog.deleteProduct(p.id);
      }
      const existingTechniques = await services.labs.catalog.findAllTechniques();
      for (const t of existingTechniques) {
        await services.labs.catalog.deleteTechnique(t.id);
      }
      const existingTools = await services.labs.catalog.findAllToolMethods();
      for (const tm of existingTools) {
        await services.labs.catalog.deleteToolMethod(tm.id);
      }
      addLog(`  Deleted ${existingProducts.length} products, ${existingTechniques.length} techniques, ${existingTools.length} tools`);

      // Clear crew members
      const existingCrew = await services.crew.findAll();
      for (const c of existingCrew) {
        await services.crew.delete(c.id);
      }
      addLog(`  Deleted ${existingCrew.length} crew members`);

      // Clear loop structure (Build 3d)
      await services.loopManagement.clearAll();
      addLog('  Cleared loop contexts and iterations');

      addLog('Clear complete. Re-seeding...');

      // Re-seed
      const seedResult = await seedAllLabsData(services, addLog);
      setResult(seedResult);
      queryClient.invalidateQueries();
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`ERROR: ${message}`);
      setState('error');
    }
  }, [services, addLog, endSession, queryClient]);

  const handleSeedDemo = useCallback(async () => {
    if (!services) return;
    setState('seeding');
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      const exists = await hasExistingData();
      if (exists) {
        addLog('Demo data already seeded — projects found in IndexedDB');
        addLog('Use "Clear & Re-seed" to start fresh, then try again');
        setState('idle');
        return;
      }

      addLog('Seeding demo scenario...');

      addLog('Creating demo customers...');
      const customerIds = await seedCustomers(services);
      addLog(`  Created ${customerIds.length} customers`);

      addLog('Creating demo projects...');
      const projectIds = await seedProjects(services, customerIds);
      addLog(`  Created ${projectIds.length} projects`);

      addLog('Creating demo tasks...');
      const taskCount = await seedTasks(services, projectIds);
      addLog(`  Created ${taskCount} tasks`);

      addLog('Creating activity events...');
      await seedActivityEvents(services, projectIds);
      addLog('  Activity events created');

      setResult({
        sops: 0,
        checklistItems: 0,
        knowledgeItems: 0,
        products: 0,
        techniques: 0,
        toolMethods: 0,
        crewMembers: 0,
        catalogItems: 0,
        customers: customerIds.length,
        projects: projectIds.length,
        tasks: taskCount,
      });

      addLog('Demo scenario complete!');
      queryClient.invalidateQueries();
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`ERROR: ${message}`);
      setState('error');
    }
  }, [services, addLog, queryClient]);

  const isWorking = state === 'seeding' || state === 'clearing';
  const total = result
    ? result.sops + result.checklistItems + result.knowledgeItems + result.products + result.techniques + result.toolMethods + result.crewMembers + result.catalogItems + (result.customers || 0) + (result.projects || 0) + (result.tasks || 0)
    : 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: '#0F766E' }}>Labs</Link>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-sm text-gray-500">Seed Data</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Seed Data</h1>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Load initial SOPs, knowledge items, and catalog data from the Hooomz field guides into IndexedDB.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* What gets seeded */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#111827' }}>Data Sources</h2>
          <div className="space-y-2">
            {[
              { label: '21 SOPs', desc: '5 trades: Drywall, Finish Carpentry, Flooring, Paint, Safety' },
              { label: '~140 Checklist Items', desc: 'Quick steps from each SOP' },
              { label: '~15 Knowledge Items', desc: 'Lab test references (L-2026-xxx)' },
              { label: '28 Products', desc: 'Flooring, paint, trim, drywall, tile' },
              { label: '18 Techniques', desc: 'Installation methods per trade' },
              { label: '16 Tool Methods', desc: 'Saws, nailers, sanders, rollers' },
              { label: '2 Crew Members', desc: 'Nathan ($45/$95) + Nishant ($28/$55)' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Database size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                <div>
                  <span className="text-xs font-medium" style={{ color: '#374151' }}>{item.label}</span>
                  <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSeed}
            disabled={isWorking || !services}
            className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#0F766E', minHeight: '48px' }}
          >
            {state === 'seeding' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Database size={16} />
                Seed All Data
              </>
            )}
          </button>

          <button
            onClick={handleSeedDemo}
            disabled={isWorking || !services}
            className="w-full py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: '#FFFFFF',
              border: '2px solid #3B82F6',
              color: '#3B82F6',
              minHeight: '48px',
            }}
          >
            <Users size={16} />
            Seed Demo Scenario
          </button>

          <button
            onClick={handleClearAndReseed}
            disabled={isWorking || !services}
            className="w-full py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: '#FFFFFF',
              border: '2px solid #EF4444',
              color: '#EF4444',
              minHeight: '48px',
            }}
          >
            {state === 'clearing' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Clearing &amp; Re-seeding...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Clear &amp; Re-seed
              </>
            )}
          </button>
        </div>

        {/* Result summary */}
        {result && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #10B981' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                Seed Complete — {total} records
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'SOPs', count: result.sops },
                { label: 'Checklist Items', count: result.checklistItems },
                { label: 'Knowledge Items', count: result.knowledgeItems },
                { label: 'Products', count: result.products },
                { label: 'Techniques', count: result.techniques },
                { label: 'Tool Methods', count: result.toolMethods },
                { label: 'Crew Members', count: result.crewMembers },
                { label: 'Catalog Items', count: result.catalogItems },
                ...(result.customers ? [{ label: 'Customers', count: result.customers }] : []),
                ...(result.projects ? [{ label: 'Projects', count: result.projects }] : []),
                ...(result.tasks ? [{ label: 'Tasks', count: result.tasks }] : []),
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs px-2 py-1 rounded" style={{ background: '#F0FDF4' }}>
                  <span style={{ color: '#374151' }}>{item.label}</span>
                  <span className="font-semibold" style={{ color: '#10B981' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #EF4444' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: '#EF4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>Error</span>
            </div>
            <p className="text-xs mt-1" style={{ color: '#991B1B' }}>{error}</p>
          </div>
        )}

        {/* Progress log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Log</h3>
            <div
              className="font-mono text-[11px] space-y-0.5 max-h-64 overflow-y-auto"
              style={{ color: '#374151' }}
            >
              {logs.map((log, i) => (
                <div key={i} className={log.startsWith('ERROR') ? 'text-red-600' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>After seeding, check:</h3>
          <div className="space-y-2">
            {[
              { href: '/', label: 'Dashboard', desc: 'Should show active projects' },
              { href: '/leads', label: 'Lead Pipeline', desc: 'Pipeline overview' },
              { href: '/labs/sops', label: 'SOPs', desc: 'Should show 21 SOPs' },
              { href: '/labs/knowledge', label: 'Knowledge Base', desc: 'Should show lab test findings' },
              { href: '/labs/catalogs', label: 'Catalogs', desc: 'Products, techniques, tools' },
              { href: '/labs/training', label: 'Training', desc: 'Crew certification status' },
              { href: '/labs/structure', label: 'Building Structure', desc: 'Define floors and rooms' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: '#0F766E' }}>{link.label}</span>
                  <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{link.desc}</span>
                </div>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
