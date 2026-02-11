/**
 * Time Clock Service (Build 3a)
 *
 * Per-task time tracking with clock in/out, task switching, breaks, and idle detection.
 * All mutations log to the Activity spine.
 */

import type { TimeEntry } from '@hooomz/shared/types';
import type { TimeClockState } from '@hooomz/shared-contracts';
import type { TimeEntryRepository } from '../repositories/timeEntry.repository';
import type { TimeClockStateRepository } from '../repositories/timeClockState.repository';
import type { PendingBatchObservationRepository } from '../repositories/labs/pendingBatchObservation.repository';
import type { ActivityService } from '../repositories/activity.repository';

interface ClockInParams {
  crewMemberId: string;
  crewMemberName: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  hourlyRate?: number;
}

export interface SwitchResult {
  closedEntry: TimeEntry | null;
  newEntry: TimeEntry;
  batchCheckNeeded: boolean;
  pendingBatchCount: number;
}

export interface CompleteResult {
  closedEntry: TimeEntry | null;
  batchCheckNeeded: boolean;
  pendingBatchCount: number;
}

/** Build a new TimeEntry Omit<id> with sensible defaults */
function buildEntryData(fields: {
  projectId: string;
  taskId: string | null;
  crewMemberId: string;
  clockIn: string;
  hourlyRate: number;
  entryType: 'task' | 'break' | 'overhead';
}): Omit<TimeEntry, 'id'> {
  return {
    organization_id: 'org_default',
    project_id: fields.projectId,
    task_instance_id: fields.taskId,
    team_member_id: fields.crewMemberId,
    clock_in: fields.clockIn,
    clock_out: null,
    break_minutes: 0,
    total_hours: null,
    hourly_rate: fields.hourlyRate,
    note: null,
    gps_clock_in: null,
    gps_clock_out: null,
    captured_offline: false,
    entryType: fields.entryType,
    role: 'primary',
    idlePrompts: 0,
  };
}

export class TimeClockService {
  constructor(
    private timeEntryRepo: TimeEntryRepository,
    private timeClockStateRepo: TimeClockStateRepository,
    private pendingBatchRepo: PendingBatchObservationRepository,
    private activity: ActivityService,
  ) {}

  /**
   * Clock in — creates a TimeEntry + TimeClockState, fires time.clock_in
   */
  async clockIn(params: ClockInParams): Promise<{ entry: TimeEntry; state: TimeClockState }> {
    const { crewMemberId, crewMemberName, projectId, taskId, taskTitle, hourlyRate } = params;
    const now = new Date().toISOString();

    const entry = await this.timeEntryRepo.create(
      buildEntryData({
        projectId,
        taskId,
        crewMemberId,
        clockIn: now,
        hourlyRate: hourlyRate ?? 0,
        entryType: 'task',
      })
    );

    const state = await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId,
      isClockedIn: true,
      currentEntryId: entry.id,
      currentTaskId: taskId,
      currentTaskTitle: taskTitle,
      isOnBreak: false,
      clockInTime: now,
      lastInteractionTime: now,
    });

    this.activity.logTimeEvent('time.clock_in', projectId, entry.id, {
      worker_name: crewMemberName,
      task_id: taskId,
      task_name: taskTitle,
    }).catch(err => console.error('Failed to log time.clock_in:', err));

    return { entry, state };
  }

  /**
   * Clock out — closes the current TimeEntry, calculates total hours, clears state
   */
  async clockOut(crewMemberId: string, crewMemberName: string): Promise<TimeEntry | null> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isClockedIn || !state.currentEntryId) return null;

    const now = new Date().toISOString();
    const closedEntry = await this.closeEntry(state.currentEntryId, now);

    await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId: state.projectId,
      isClockedIn: false,
      currentEntryId: undefined,
      currentTaskId: undefined,
      currentTaskTitle: undefined,
      isOnBreak: false,
      clockInTime: undefined,
      lastInteractionTime: now,
    });

    if (closedEntry) {
      const durationMinutes = (closedEntry.total_hours ?? 0) * 60;
      this.activity.logTimeEvent('time.clock_out', state.projectId, closedEntry.id, {
        worker_name: crewMemberName,
        duration_minutes: durationMinutes,
        task_id: state.currentTaskId,
        task_name: state.currentTaskTitle,
      }).catch(err => console.error('Failed to log time.clock_out:', err));
    }

    return closedEntry;
  }

  /**
   * Switch task — closes current entry, creates new one, checks pending batch
   */
  async switchTask(
    crewMemberId: string,
    crewMemberName: string,
    newTaskId: string,
    newTaskTitle: string,
  ): Promise<SwitchResult> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isClockedIn) {
      throw new Error('Not clocked in');
    }

    const now = new Date().toISOString();
    const previousTaskId = state.currentTaskId;

    const closedEntry = state.currentEntryId
      ? await this.closeEntry(state.currentEntryId, now)
      : null;

    let batchCheckNeeded = false;
    let pendingBatchCount = 0;
    if (previousTaskId) {
      pendingBatchCount = await this.pendingBatchRepo.getPendingCount(previousTaskId);
      batchCheckNeeded = pendingBatchCount > 0;
    }

    const newEntry = await this.timeEntryRepo.create(
      buildEntryData({
        projectId: state.projectId,
        taskId: newTaskId,
        crewMemberId,
        clockIn: now,
        hourlyRate: closedEntry?.hourly_rate ?? 0,
        entryType: 'task',
      })
    );

    await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId: state.projectId,
      isClockedIn: true,
      currentEntryId: newEntry.id,
      currentTaskId: newTaskId,
      currentTaskTitle: newTaskTitle,
      isOnBreak: false,
      clockInTime: now,
      lastInteractionTime: now,
    });

    if (closedEntry) {
      this.activity.logTimeEvent('time.entry_logged', state.projectId, closedEntry.id, {
        worker_name: crewMemberName,
        duration_minutes: (closedEntry.total_hours ?? 0) * 60,
        task_id: previousTaskId,
        task_name: state.currentTaskTitle,
      }).catch(err => console.error('Failed to log time.entry_logged:', err));
    }

    return { closedEntry, newEntry, batchCheckNeeded, pendingBatchCount };
  }

  /**
   * Complete the current task — closes entry, checks batch, does NOT start a new task
   */
  async completeCurrentTask(crewMemberId: string, crewMemberName: string): Promise<CompleteResult> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isClockedIn) {
      throw new Error('Not clocked in');
    }

    const now = new Date().toISOString();
    const taskId = state.currentTaskId;

    const closedEntry = state.currentEntryId
      ? await this.closeEntry(state.currentEntryId, now)
      : null;

    let batchCheckNeeded = false;
    let pendingBatchCount = 0;
    if (taskId) {
      pendingBatchCount = await this.pendingBatchRepo.getPendingCount(taskId);
      batchCheckNeeded = pendingBatchCount > 0;
    }

    await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId: state.projectId,
      isClockedIn: true,
      currentEntryId: undefined,
      currentTaskId: undefined,
      currentTaskTitle: undefined,
      isOnBreak: false,
      clockInTime: state.clockInTime,
      lastInteractionTime: now,
    });

    if (closedEntry) {
      this.activity.logTimeEvent('time.entry_logged', state.projectId, closedEntry.id, {
        worker_name: crewMemberName,
        duration_minutes: (closedEntry.total_hours ?? 0) * 60,
        task_id: taskId,
        task_name: state.currentTaskTitle,
      }).catch(err => console.error('Failed to log time.entry_logged:', err));
    }

    return { closedEntry, batchCheckNeeded, pendingBatchCount };
  }

  /**
   * Start break — closes task entry, creates break entry
   */
  async startBreak(crewMemberId: string): Promise<TimeEntry> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isClockedIn) {
      throw new Error('Not clocked in');
    }

    const now = new Date().toISOString();

    if (state.currentEntryId) {
      await this.closeEntry(state.currentEntryId, now);
    }

    const breakEntry = await this.timeEntryRepo.create(
      buildEntryData({
        projectId: state.projectId,
        taskId: null,
        crewMemberId,
        clockIn: now,
        hourlyRate: 0,
        entryType: 'break',
      })
    );

    await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId: state.projectId,
      isClockedIn: true,
      currentEntryId: breakEntry.id,
      currentTaskId: state.currentTaskId,
      currentTaskTitle: state.currentTaskTitle,
      isOnBreak: true,
      clockInTime: state.clockInTime,
      lastInteractionTime: now,
    });

    return breakEntry;
  }

  /**
   * End break — closes break entry, resumes task (or specified task)
   */
  async endBreak(
    crewMemberId: string,
    resumeTaskId?: string,
    resumeTaskTitle?: string,
  ): Promise<TimeEntry> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isOnBreak) {
      throw new Error('Not on break');
    }

    const now = new Date().toISOString();

    if (state.currentEntryId) {
      await this.closeEntry(state.currentEntryId, now);
    }

    const taskId = resumeTaskId || state.currentTaskId || null;
    const taskTitle = resumeTaskTitle || state.currentTaskTitle || '';

    const taskEntry = await this.timeEntryRepo.create(
      buildEntryData({
        projectId: state.projectId,
        taskId,
        crewMemberId,
        clockIn: now,
        hourlyRate: 0,
        entryType: 'task',
      })
    );

    await this.timeClockStateRepo.upsertByCrewMember(crewMemberId, {
      crewMemberId,
      projectId: state.projectId,
      isClockedIn: true,
      currentEntryId: taskEntry.id,
      currentTaskId: taskId ?? undefined,
      currentTaskTitle: taskTitle,
      isOnBreak: false,
      clockInTime: state.clockInTime,
      lastInteractionTime: now,
    });

    return taskEntry;
  }

  /**
   * Record interaction — updates lastInteractionTime for idle detection
   */
  async recordInteraction(crewMemberId: string): Promise<void> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state) return;

    await this.timeClockStateRepo.update(state.id, {
      lastInteractionTime: new Date().toISOString(),
    });
  }

  /**
   * Check if crew member is idle (15 min threshold)
   */
  async checkIdle(crewMemberId: string, thresholdMinutes = 15): Promise<boolean> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state || !state.isClockedIn || state.isOnBreak) return false;

    const lastInteraction = new Date(state.lastInteractionTime).getTime();
    const now = Date.now();
    const idleMinutes = (now - lastInteraction) / (1000 * 60);

    return idleMinutes >= thresholdMinutes;
  }

  /**
   * Increment idle prompts on the current entry
   */
  async incrementIdlePrompts(crewMemberId: string): Promise<void> {
    const state = await this.timeClockStateRepo.getByCrewMember(crewMemberId);
    if (!state?.currentEntryId) return;

    const entry = await this.timeEntryRepo.findById(state.currentEntryId);
    if (!entry) return;

    await this.timeEntryRepo.update(state.currentEntryId, {
      idlePrompts: (entry.idlePrompts ?? 0) + 1,
    });
  }

  // ============================================================================
  // Queries
  // ============================================================================

  async getCurrentState(crewMemberId: string): Promise<TimeClockState | null> {
    return this.timeClockStateRepo.getByCrewMember(crewMemberId);
  }

  async getTodayEntries(crewMemberId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo.getTodayEntries(crewMemberId);
  }

  async getEntriesForTask(taskId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo.getByTask(taskId);
  }

  async getTodayTotalMinutes(crewMemberId: string): Promise<number> {
    const entries = await this.timeEntryRepo.getTodayEntries(crewMemberId);
    return entries.reduce((sum, e) => {
      if (e.entryType === 'break') return sum;
      return sum + ((e.total_hours ?? 0) * 60);
    }, 0);
  }

  async getTaskTotalMinutes(taskId: string): Promise<number> {
    const entries = await this.timeEntryRepo.getByTask(taskId);
    return entries.reduce((sum, e) => sum + ((e.total_hours ?? 0) * 60), 0);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private async closeEntry(entryId: string, closeTime: string): Promise<TimeEntry | null> {
    const entry = await this.timeEntryRepo.findById(entryId);
    if (!entry || entry.clock_out) return entry;

    const clockIn = new Date(entry.clock_in).getTime();
    const clockOut = new Date(closeTime).getTime();
    const totalHours = Math.max(0, (clockOut - clockIn) / (1000 * 60 * 60));

    return this.timeEntryRepo.update(entryId, {
      clock_out: closeTime,
      total_hours: Math.round(totalHours * 100) / 100,
    });
  }
}

/**
 * Factory function — follows service pattern
 */
export function createTimeClockService(
  timeEntryRepo: TimeEntryRepository,
  timeClockStateRepo: TimeClockStateRepository,
  pendingBatchRepo: PendingBatchObservationRepository,
  activity: ActivityService,
): TimeClockService {
  return new TimeClockService(timeEntryRepo, timeClockStateRepo, pendingBatchRepo, activity);
}
