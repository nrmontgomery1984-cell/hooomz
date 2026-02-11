# Build 3a Session Log — Time Clock + Batch Wiring

**Date:** 2026-02-08
**Build:** 3a (of Master Integration Spec)
**Status:** COMPLETE — typecheck passes (0 errors)

---

## What Was Built

Per-task time clock with persistent floating widget, idle detection, crew session mechanism, SOPProgressData enrichment, and BatchConfirmModal wiring into task completion flow.

---

## New Files (13)

| File | Purpose |
|------|---------|
| `apps/web/src/lib/repositories/activeCrewSession.repository.ts` | Crew session CRUD, one-active-at-a-time |
| `apps/web/src/lib/repositories/timeEntry.repository.ts` | Time entry CRUD + today/task/project queries |
| `apps/web/src/lib/repositories/timeClockState.repository.ts` | Clock state per crew member (upsert pattern) |
| `apps/web/src/lib/crew/ActiveCrewContext.tsx` | Crew session React context + provider |
| `apps/web/src/components/crew/CrewSelector.tsx` | Full-screen crew member + project picker |
| `apps/web/src/components/crew/CrewGate.tsx` | Layout wrapper: shows CrewSelector until session started |
| `apps/web/src/lib/services/timeClock.service.ts` | Time clock service: clock in/out, switch, break, idle |
| `apps/web/src/lib/hooks/useTimeClock.ts` | React Query hooks for time clock operations |
| `apps/web/src/components/timeclock/TimeClockWidget.tsx` | Floating persistent time clock widget |
| `apps/web/src/components/timeclock/TaskPicker.tsx` | Bottom sheet task selector for switching |
| `apps/web/src/lib/hooks/useIdleDetection.ts` | Global idle detection hook (15 min threshold) |
| `apps/web/src/components/timeclock/IdlePrompt.tsx` | Idle prompt modal with 4 options |
| `apps/web/src/lib/hooks/useCompleteTaskWithBatchCheck.ts` | Task completion wrapper with batch check |

## Modified Files (11)

| File | Change |
|------|--------|
| `packages/shared/src/types/team.ts` | Added entryType, role, sopVersionId, idlePrompts to TimeEntry |
| `packages/shared-contracts/src/types/integration.ts` | Added ActiveCrewSession, TimeClockState, CompletedStep types |
| `apps/web/src/lib/storage/StorageAdapter.ts` | 3 new store names (activeCrewSession, timeEntries, timeClockState) |
| `apps/web/src/lib/storage/IndexedDBAdapter.ts` | v7→v8, 3 new stores with indexes |
| `apps/web/src/lib/services/index.ts` | TimeClockService in Services interface + initialization |
| `apps/web/src/lib/repositories/activity.repository.ts` | Added time.entry_logged event type + summary |
| `apps/web/src/lib/hooks/useLocalData.ts` | CompletedStep type, isStepCompleted helper, enriched toggle |
| `apps/web/src/lib/hooks/useSOPTriggerIntegration.ts` | crewMemberId from ActiveCrewContext instead of props |
| `apps/web/src/components/sop/SOPChecklist.tsx` | crewMemberId from context, isStepCompleted helper |
| `apps/web/src/app/providers.tsx` | ActiveCrewProvider in provider chain |
| `apps/web/src/app/layout.tsx` | TimeClockWidget in layout |
| `apps/web/src/app/projects/[id]/page.tsx` | BatchConfirmModal wiring on task completion |

---

## IndexedDB Changes

- **Version:** 7 → 8
- **New stores (3):** activeCrewSession, timeEntries, timeClockState
- **Total stores:** 30
- **New indexes:**
  - activeCrewSession: crewMemberId, isActive
  - timeEntries: team_member_id, project_id, task_instance_id, entryType
  - timeClockState: crewMemberId

---

## Architecture Decisions

1. **Crew session is required** — CrewGate blocks app content until crew member + project selected
2. **Timer survives background** — recalculates from stored `clockInTime` timestamp, not a running counter
3. **Batch check is non-blocking** — modal appears after task switch/completion but doesn't prevent the action
4. **SOPProgressData backward-compatible** — `completedSteps` accepts both `number` and `CompletedStep` objects
5. **Idle detection debounced** — interaction recording capped at 1 call per 30 seconds, polling every 60 seconds
6. **Notification API best-effort** — fires browser notification when idle and tab is hidden, degrades gracefully

---

## Provider Chain Order

```
ThemeProvider → QueryClientProvider → ServicesProvider → ActiveCrewProvider → ToastProvider → QuickAddProvider
```

---

## Z-Index Stack

| Layer | Z-Index | Component |
|-------|---------|-----------|
| Content | default | Page content |
| Sticky headers | z-10 | Project detail header |
| BottomNav | z-40 | Navigation bar (h-16 = 64px) |
| TimeClockWidget | z-50 | Floating pill/card at bottom-[72px] right-4 |
| QuickAddSheet | z-50 | Bottom sheet overlay |
| IdlePrompt | z-[70] | Full-screen modal overlay |
| BatchConfirmModal | z-50 | Modal overlay |

---

## Types Added

### To `packages/shared/src/types/team.ts` (TimeEntry)
- `entryType?: 'task' | 'break' | 'overhead'`
- `role?: 'primary' | 'supervisor'`
- `sopVersionId?: string`
- `idlePrompts?: number`

### To `packages/shared-contracts/src/types/integration.ts`
- `ActiveCrewSession` — { id, crewMemberId, crewMemberName, projectId, startedAt, isActive }
- `TimeClockState` — { id, crewMemberId, projectId, isClockedIn, currentEntryId?, currentTaskId?, currentTaskTitle?, isOnBreak, clockInTime?, lastInteractionTime }
- `CompletedStep` — { stepNumber, completedAt, crewMemberId }

---

## Verification

- `pnpm run typecheck` — all packages pass
- `npx tsc --noEmit` (apps/web) — **0 errors**
- All operations offline-first (IndexedDB)
- Activity Log spine maintained (clock in/out/entry logged events)

---

## Next: Build 3b

Per the Master Integration Spec, remaining Build 3 items:
- SOP → Task Instance wiring (task templates from SOPs)
- Training gate (supervised completions tracking)
- Estimate → Budget conversion at crew wage rates
