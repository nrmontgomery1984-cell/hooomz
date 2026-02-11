'use client';

/**
 * Active Crew Session Context (Build 3a)
 *
 * Tracks "who is holding the phone right now."
 * Not auth — just crew member selection for Year 1 (2-person crew, trust the tap).
 * Reads active session from IndexedDB on mount.
 * If no active session, hasActiveSession = false → layout shows CrewSelector.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ActiveCrewSessionRepository } from '../repositories/activeCrewSession.repository';
import { initializeStorage } from '../storage/initialize';

interface ActiveCrewContextValue {
  crewMemberId: string | null;
  crewMemberName: string | null;
  projectId: string | null;
  hasActiveSession: boolean;
  isLoading: boolean;
  startSession: (crewMemberId: string, name: string, projectId: string) => Promise<void>;
  endSession: () => Promise<void>;
  switchCrewMember: (crewMemberId: string, name: string) => Promise<void>;
}

const ActiveCrewContext = createContext<ActiveCrewContextValue | null>(null);

export function ActiveCrewProvider({ children }: { children: ReactNode }) {
  const [crewMemberId, setCrewMemberId] = useState<string | null>(null);
  const [crewMemberName, setCrewMemberName] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repo, setRepo] = useState<ActiveCrewSessionRepository | null>(null);

  // Initialize from IndexedDB on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const storage = await initializeStorage();
        const sessionRepo = new ActiveCrewSessionRepository(storage);

        if (!mounted) return;
        setRepo(sessionRepo);

        const activeSession = await sessionRepo.getActiveSession();
        if (mounted && activeSession) {
          setCrewMemberId(activeSession.crewMemberId);
          setCrewMemberName(activeSession.crewMemberName);
          setProjectId(activeSession.projectId);
          setHasActiveSession(true);
        }
      } catch (err) {
        console.error('Failed to load crew session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  const startSession = useCallback(async (id: string, name: string, projId: string) => {
    if (!repo) return;
    await repo.switchSession(id, name, projId);
    setCrewMemberId(id);
    setCrewMemberName(name);
    setProjectId(projId);
    setHasActiveSession(true);
  }, [repo]);

  const endSession = useCallback(async () => {
    if (!repo) return;
    await repo.deactivateAll();
    setCrewMemberId(null);
    setCrewMemberName(null);
    setProjectId(null);
    setHasActiveSession(false);
  }, [repo]);

  const switchCrewMember = useCallback(async (id: string, name: string) => {
    if (!repo || !projectId) return;
    await repo.switchSession(id, name, projectId);
    setCrewMemberId(id);
    setCrewMemberName(name);
  }, [repo, projectId]);

  return (
    <ActiveCrewContext.Provider
      value={{
        crewMemberId,
        crewMemberName,
        projectId,
        hasActiveSession,
        isLoading,
        startSession,
        endSession,
        switchCrewMember,
      }}
    >
      {children}
    </ActiveCrewContext.Provider>
  );
}

export function useActiveCrew(): ActiveCrewContextValue {
  const context = useContext(ActiveCrewContext);
  if (!context) {
    throw new Error('useActiveCrew must be used within an ActiveCrewProvider');
  }
  return context;
}
