'use client';

/**
 * Idle Detection Hook (Build 3a)
 *
 * Tracks user interaction and detects 15-minute idle periods.
 * - Registers global event listeners (touch, click, keydown, scroll)
 * - Debounced interaction recording (max 1 call/30s)
 * - Polling every 60s to check idle state
 * - Only active when clocked in with a running task
 * - Best-effort Notification API for background idle alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useServices } from '../services/ServicesContext';

interface UseIdleDetectionOptions {
  crewMemberId: string | null;
  isClockedIn: boolean;
  isOnBreak: boolean;
}

interface UseIdleDetectionReturn {
  isIdle: boolean;
  dismissIdle: () => void;
}

export function useIdleDetection({
  crewMemberId,
  isClockedIn,
  isOnBreak,
}: UseIdleDetectionOptions): UseIdleDetectionReturn {
  const [isIdle, setIsIdle] = useState(false);
  const services = useServices();
  const lastRecordedRef = useRef(0);
  const isActiveRef = useRef(false);

  // Track whether detection should be active
  isActiveRef.current = !!crewMemberId && isClockedIn && !isOnBreak;

  // Record interaction (debounced — max 1 call/30s)
  const recordInteraction = useCallback(() => {
    if (!isActiveRef.current || !crewMemberId) return;

    const now = Date.now();
    if (now - lastRecordedRef.current < 30_000) return;
    lastRecordedRef.current = now;

    services.timeClock.recordInteraction(crewMemberId)
      .catch(err => console.error('Failed to record interaction:', err));

    // If idle was showing, dismiss it
    if (isIdle) setIsIdle(false);
  }, [crewMemberId, services, isIdle]);

  // Dismiss idle prompt (user clicked "still working")
  const dismissIdle = useCallback(() => {
    setIsIdle(false);
    if (crewMemberId) {
      services.timeClock.recordInteraction(crewMemberId)
        .catch(err => console.error('Failed to record interaction:', err));
      services.timeClock.incrementIdlePrompts(crewMemberId)
        .catch(err => console.error('Failed to increment idle prompts:', err));
    }
  }, [crewMemberId, services]);

  // Register global event listeners
  useEffect(() => {
    if (!isActiveRef.current) return;

    const events = ['touchstart', 'click', 'keydown', 'scroll'] as const;
    const handler = () => recordInteraction();

    for (const event of events) {
      window.addEventListener(event, handler, { passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handler);
      }
    };
  }, [recordInteraction, isClockedIn, isOnBreak, crewMemberId]);

  // Poll for idle state every 60s
  useEffect(() => {
    if (!crewMemberId || !isClockedIn || isOnBreak) {
      setIsIdle(false);
      return;
    }

    const checkIdle = async () => {
      try {
        const idle = await services.timeClock.checkIdle(crewMemberId);
        if (idle && !isIdle) {
          setIsIdle(true);

          // Best-effort notification when document is hidden
          if (document.visibilityState === 'hidden' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Hooomz — Still working?', {
                body: 'No activity for 15 minutes.',
              });
            }
          }
        }
      } catch (err) {
        console.error('Idle check failed:', err);
      }
    };

    const interval = setInterval(checkIdle, 60_000);
    // Initial check after a short delay
    const timeout = setTimeout(checkIdle, 5_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [crewMemberId, isClockedIn, isOnBreak, services, isIdle]);

  // Request notification permission on mount (best-effort)
  useEffect(() => {
    if (isClockedIn && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isClockedIn]);

  return { isIdle, dismissIdle };
}
