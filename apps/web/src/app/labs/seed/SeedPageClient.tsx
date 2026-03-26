'use client';

/**
 * Labs Seed Data Page — Client Component
 *
 * Admin page at /labs/seed to load all hardcoded SOPs, knowledge items,
 * and catalog data into IndexedDB for testing.
 * GATED: only accessible in development mode (gate in page.tsx server wrapper).
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Database, Trash2, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { seedAllLabsData, type SeedResult } from '@/lib/data/seedAll';
import { seedCustomers, seedProjects, seedLineItems, seedTasks, seedActivityEvents, seedLeads, hasExistingData } from '@/lib/seed/seedData';
import { seedInteriorsDemo, wipeInteriorsDemo } from '@/lib/seed/interiorsData';

type SeedState = 'idle' | 'seeding' | 'done' | 'error' | 'clearing';

export default function SeedPageClient() {
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

      // Also seed demo data (customers, projects, tasks) so schedule has data
      addLog('Seeding demo scenario...');
      const customerIds = await seedCustomers(services);
      addLog(`  Created ${customerIds.length} customers`);
      const projectIds = await seedProjects(services, customerIds);
      addLog(`  Created ${projectIds.length} projects`);
      const lineItemCount = await seedLineItems(services, projectIds);
      addLog(`  Created ${lineItemCount} line items`);
      const taskCount = await seedTasks(services, projectIds);
      addLog(`  Created ${taskCount} tasks`);
      await seedActivityEvents(services, projectIds);
      addLog('  Activity events created');
      const leadCount = await seedLeads(services);
      addLog(`  Created ${leadCount} leads`);

      setResult({
        ...seedResult,
        customers: customerIds.length,
        projects: projectIds.length,
        tasks: taskCount,
        leads: leadCount,
      });
      queryClient.removeQueries();
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

      // Try granular clear first; if IndexedDB stores are missing, nuke the DB
      try {
        // Clear line items (estimates)
        const { lineItems } = await services.estimating.lineItems.findAll();
        for (const li of lineItems) {
          await services.estimating.lineItems.delete(li.id);
        }
        if (lineItems.length > 0) addLog(`  Deleted ${lineItems.length} line items`);

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

        // Clear tool research data
        await services.labs.toolResearch.clearAll();
        addLog('  Cleared tool research data');

      } catch (clearErr) {
        // IndexedDB stores missing — delete entire database and reinitialize
        addLog('  Store mismatch detected — deleting database and recreating...');
        await new Promise<void>((resolve, reject) => {
          const req = window.indexedDB.deleteDatabase('hooomz_db');
          req.onsuccess = () => resolve();
          req.onerror = () => reject(new Error('Failed to delete database'));
        });
        // Reload the page to reinitialize the DB with all stores
        addLog('  Database deleted. Reloading...');
        window.location.reload();
        return;
      }

      addLog('Clear complete. Re-seeding Labs + Demo...');

      // Re-seed Labs
      const seedResult = await seedAllLabsData(services, addLog);

      // Re-seed Demo (customers, projects, line items, tasks, activity)
      addLog('Seeding demo scenario...');
      const customerIds = await seedCustomers(services);
      addLog(`  Created ${customerIds.length} customers`);
      const projectIds = await seedProjects(services, customerIds);
      addLog(`  Created ${projectIds.length} projects`);
      const lineItemCount = await seedLineItems(services, projectIds);
      addLog(`  Created ${lineItemCount} line items`);
      const taskCount = await seedTasks(services, projectIds);
      addLog(`  Created ${taskCount} tasks`);
      await seedActivityEvents(services, projectIds);
      addLog('  Activity events created');

      addLog('Seeding leads...');
      const leadCount = await seedLeads(services);
      addLog(`  Created ${leadCount} leads`);

      setResult({
        ...seedResult,
        customers: customerIds.length,
        projects: projectIds.length,
        tasks: taskCount,
        leads: leadCount,
      });
      queryClient.removeQueries();
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

      addLog('Creating line items (estimates)...');
      const lineItemCount = await seedLineItems(services, projectIds);
      addLog(`  Created ${lineItemCount} line items`);

      addLog('Creating demo tasks...');
      const taskCount = await seedTasks(services, projectIds);
      addLog(`  Created ${taskCount} tasks`);

      addLog('Creating activity events...');
      await seedActivityEvents(services, projectIds);
      addLog('  Activity events created');

      addLog('Creating leads...');
      const leadCount = await seedLeads(services);
      addLog(`  Created ${leadCount} leads`);

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
        leads: leadCount,
      });

      addLog('Demo scenario complete!');
      queryClient.removeQueries();
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`ERROR: ${message}`);
      setState('error');
    }
  }, [services, addLog, queryClient]);

  const handleSeedInteriors = useCallback(async () => {
    if (!services) return;
    setState('seeding');
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      await seedInteriorsDemo(services, addLog);
      queryClient.removeQueries();
      setState('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      addLog(`ERROR: ${message}`);
      setState('error');
    }
  }, [services, addLog, queryClient]);

  const handleWipeInteriors = useCallback(async () => {
    if (!services) return;
    setState('clearing');
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      await wipeInteriorsDemo(services, addLog);
      queryClient.removeQueries();
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
    ? result.sops + result.checklistItems + result.knowledgeItems + result.products + result.techniques + result.toolMethods + result.crewMembers + result.catalogItems + (result.customers || 0) + (result.projects || 0) + (result.tasks || 0) + (result.leads || 0)
    : 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--surface-2)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>/</span>
            <span className="text-sm" style={{ color: 'var(--mid)' }}>Seed Data</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--charcoal)' }}>Seed Data</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Load initial SOPs, knowledge items, and catalog data from the Hooomz field guides into IndexedDB.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* What gets seeded */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--charcoal)' }}>Data Sources</h2>
          <div className="space-y-2">
            {[
              { label: '21 SOPs', desc: '5 trades: Drywall, Finish Carpentry, Flooring, Paint, Safety' },
              { label: '~140 Checklist Items', desc: 'Quick steps from each SOP' },
              { label: '~15 Knowledge Items', desc: 'Lab test references (L-2026-xxx)' },
              { label: '28 Products', desc: 'Flooring, paint, trim, drywall, tile' },
              { label: '18 Techniques', desc: 'Installation methods per trade' },
              { label: '16 Tool Methods', desc: 'Saws, nailers, sanders, rollers' },
              { label: '2 Crew Members', desc: 'Nathan ($45/$95) + Nishant ($28/$55)' },
              { label: '6 Tool Platforms', desc: 'Cordless platform comparisons' },
              { label: '~63 Research Items', desc: 'Saws, PPE, instruments, fastening, measuring, site mgmt' },
              { label: '18 Inventory Items', desc: '8 owned + 10 RIDGID purchasing' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <Database size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--muted)' }} />
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--mid)' }}>{item.label}</span>
                  <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>{item.desc}</span>
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
            style={{ background: 'var(--accent)', minHeight: '48px' }}
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
              background: 'var(--surface)',
              border: '2px solid var(--blue)',
              color: 'var(--blue)',
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
              background: 'var(--surface)',
              border: '2px solid var(--red)',
              color: 'var(--red)',
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

        {/* Interiors Demo */}
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>Interiors Demo</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            5 customers, 7 jobs at various pipeline stages, consultations, quotes, change orders, and ~18 activity events.
          </p>
          <div className="space-y-2">
            <button
              onClick={handleSeedInteriors}
              disabled={isWorking || !services}
              className="w-full py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'var(--surface)',
                border: '2px solid var(--accent)',
                color: 'var(--accent)',
                minHeight: '44px',
              }}
            >
              {state === 'seeding' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database size={14} />
                  Load Interiors Demo Data
                </>
              )}
            </button>
            <button
              onClick={handleWipeInteriors}
              disabled={isWorking || !services}
              className="w-full py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'var(--surface)',
                border: '2px solid var(--yellow)',
                color: 'var(--yellow)',
                minHeight: '44px',
              }}
            >
              {state === 'clearing' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Wiping...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Wipe Demo Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result summary */}
        {result && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--green)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
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
                ...(result.toolPlatforms ? [{ label: 'Tool Platforms', count: result.toolPlatforms }] : []),
                ...(result.toolResearchItems ? [{ label: 'Research Items', count: result.toolResearchItems }] : []),
                ...(result.toolInventoryItems ? [{ label: 'Inventory Items', count: result.toolInventoryItems }] : []),
                ...(result.customers ? [{ label: 'Customers', count: result.customers }] : []),
                ...(result.projects ? [{ label: 'Projects', count: result.projects }] : []),
                ...(result.tasks ? [{ label: 'Tasks', count: result.tasks }] : []),
                ...(result.leads ? [{ label: 'Leads', count: result.leads }] : []),
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs px-2 py-1 rounded" style={{ background: 'var(--green-bg)' }}>
                  <span style={{ color: 'var(--mid)' }}>{item.label}</span>
                  <span className="font-semibold" style={{ color: 'var(--green)' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--red)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: 'var(--red)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--red)' }}>Error</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        {/* Progress log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Log</h3>
            <div
              className="font-mono text-[11px] space-y-0.5 max-h-64 overflow-y-auto"
              style={{ color: 'var(--mid)' }}
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
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>After seeding, check:</h3>
          <div className="space-y-2">
            {[
              { href: '/', label: 'Dashboard', desc: 'Should show active projects' },
              { href: '/schedule', label: 'Schedule', desc: 'Calendar with 18 seeded tasks' },
              { href: '/leads', label: 'Lead Pipeline', desc: 'Pipeline overview' },
              { href: '/labs/sops', label: 'SOPs', desc: 'Should show 21 SOPs' },
              { href: '/labs/knowledge', label: 'Knowledge Base', desc: 'Should show lab test findings' },
              { href: '/labs/catalogs', label: 'Catalogs', desc: 'Products, techniques, tools' },
              { href: '/labs/training', label: 'Training', desc: 'Crew certification status' },
              { href: '/labs/structure', label: 'Building Structure', desc: 'Define floors and rooms' },
              { href: '/labs/tool-research', label: 'Tool Research', desc: 'Platform comparison & inventory' },
              { href: '/sales', label: 'Sales Dashboard', desc: 'Pipeline, funnel, this week, performance' },
              { href: '/sales/quotes', label: 'Quotes', desc: 'Quote list with status tracking' },
              { href: '/sales/consultations', label: 'Consultations', desc: 'Scheduled & completed consultations' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface)]"
              >
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{link.label}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{link.desc}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
