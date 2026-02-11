'use client';

/**
 * QuickAddSheet — The most-used screen in Hooomz.
 *
 * A bottom sheet overlay for logging field activities in under 5 seconds.
 * Controlled by QuickAddContext (opened via "+" in BottomNav).
 *
 * Architecture:
 * - 19 actions organized as 8 frequent + 11 behind "More" toggle
 * - Each action opens a mini form with project selector + minimum required fields
 * - Submits create an immutable ActivityEvent via ActivityService (IndexedDB)
 * - Toast confirmation on success
 *
 * Design rules:
 * - All colors from CSS theme variables (never hardcoded)
 * - Lucide icons, thin line, 24px, charcoal
 * - Labels: 11px, gray
 * - Touch targets: 44px minimum (work gloves)
 * - Teal only on "Log" submit button
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle, Camera, FileText, Clock,
  XOctagon, Truck, UserPlus, Home,
  AlertTriangle, MessageSquare, CloudRain, Play,
  Calendar, CheckCircle2, XCircle, Receipt,
  Unlock, UserMinus, Shield,
  ArrowLeft, ChevronDown, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuickAdd } from './QuickAddContext';
import { ProjectSelector } from './ProjectSelector';
import { useActivityService } from '@/lib/services/ServicesContext';
import { useToast } from '@/components/ui/Toast';
import { useLocalTasks, useCompleteTask } from '@/lib/hooks/useLocalData';

// ============================================================================
// Types
// ============================================================================

interface QuickAddAction {
  id: string;
  eventType: string;
  label: string;
  icon: LucideIcon;
  entityType: string;
  homeownerVisible: boolean;
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'date' | 'time' | 'duration';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface FormConfig {
  title: string;
  fields: FormField[];
  submitLabel: string;
}

// ============================================================================
// Action Definitions — 19 actions per spec
// ============================================================================

const FREQUENT_ACTIONS: QuickAddAction[] = [
  { id: 'done', eventType: 'task.completed', label: 'Done', icon: CheckCircle, entityType: 'task', homeownerVisible: true },
  { id: 'photo', eventType: 'photo.uploaded', label: 'Photo', icon: Camera, entityType: 'photo', homeownerVisible: false },
  { id: 'note', eventType: 'note.created', label: 'Note', icon: FileText, entityType: 'field_note', homeownerVisible: false },
  { id: 'time', eventType: 'time.logged', label: 'Time', icon: Clock, entityType: 'time_entry', homeownerVisible: false },
  { id: 'blocked', eventType: 'task.blocked', label: 'Blocked', icon: XOctagon, entityType: 'task', homeownerVisible: false },
  { id: 'delivery', eventType: 'delivery.received', label: 'Delivery', icon: Truck, entityType: 'delivery', homeownerVisible: true },
  { id: 'sub_in', eventType: 'sub.arrived', label: 'Sub In', icon: UserPlus, entityType: 'site_visit', homeownerVisible: false },
  { id: 'visit', eventType: 'site.visit', label: 'Visit', icon: Home, entityType: 'site_visit', homeownerVisible: true },
];

const MORE_ACTIONS: QuickAddAction[] = [
  { id: 'issue', eventType: 'issue.reported', label: 'Issue', icon: AlertTriangle, entityType: 'field_note', homeownerVisible: true },
  { id: 'request', eventType: 'client.request', label: 'Request', icon: MessageSquare, entityType: 'client_request', homeownerVisible: true },
  { id: 'weather', eventType: 'weather.delay', label: 'Weather', icon: CloudRain, entityType: 'delay', homeownerVisible: true },
  { id: 'started', eventType: 'task.started', label: 'Started', icon: Play, entityType: 'task', homeownerVisible: false },
  { id: 'inspect', eventType: 'inspection.scheduled', label: 'Inspect', icon: Calendar, entityType: 'inspection', homeownerVisible: true },
  { id: 'passed', eventType: 'inspection.passed', label: 'Passed', icon: CheckCircle2, entityType: 'inspection', homeownerVisible: true },
  { id: 'failed', eventType: 'inspection.failed', label: 'Failed', icon: XCircle, entityType: 'inspection', homeownerVisible: true },
  { id: 'receipt', eventType: 'receipt.captured', label: 'Receipt', icon: Receipt, entityType: 'receipt', homeownerVisible: false },
  { id: 'unblocked', eventType: 'task.unblocked', label: 'Unblocked', icon: Unlock, entityType: 'task', homeownerVisible: false },
  { id: 'sub_left', eventType: 'sub.departed', label: 'Sub Left', icon: UserMinus, entityType: 'site_visit', homeownerVisible: false },
  { id: 'safety', eventType: 'safety.logged', label: 'Safety', icon: Shield, entityType: 'safety_incident', homeownerVisible: true },
];

// ============================================================================
// Form Configurations — per action
// ============================================================================

const WORK_CATEGORY_OPTIONS = [
  { value: 'FL', label: 'Flooring' },
  { value: 'PT', label: 'Paint' },
  { value: 'FC', label: 'Finish Carpentry' },
  { value: 'TL', label: 'Tile' },
  { value: 'DW', label: 'Drywall' },
  { value: 'OH', label: 'Other' },
];

const TRADE_OPTIONS = [
  { value: 'flooring', label: 'Flooring' },
  { value: 'paint', label: 'Paint' },
  { value: 'trim', label: 'Finish Carpentry' },
  { value: 'tile', label: 'Tile' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const FORM_CONFIGS: Record<string, FormConfig> = {
  done: {
    title: 'Task Completed',
    fields: [
      { key: 'note', label: 'Note', type: 'textarea', placeholder: 'Any details? (optional)' },
    ],
    submitLabel: 'Mark Done',
  },
  photo: {
    title: 'Add Photo',
    fields: [
      { key: 'caption', label: 'Caption', type: 'text', placeholder: 'What is this photo of?' },
      { key: 'location_tag', label: 'Location', type: 'text', placeholder: 'Room or area (optional)' },
    ],
    submitLabel: 'Log',
  },
  note: {
    title: 'Add Note',
    fields: [
      { key: 'text', label: 'Note', type: 'textarea', placeholder: 'What do you want to note?', required: true },
      { key: 'work_category', label: 'Category', type: 'select', options: WORK_CATEGORY_OPTIONS },
    ],
    submitLabel: 'Log',
  },
  time: {
    title: 'Log Time',
    fields: [
      { key: 'duration_hours', label: 'Duration', type: 'duration' },
      { key: 'work_category', label: 'Category', type: 'select', options: WORK_CATEGORY_OPTIONS },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'What were you working on? (optional)' },
    ],
    submitLabel: 'Log',
  },
  blocked: {
    title: 'Task Blocked',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'Which task is blocked?', required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why is it blocked?', required: true },
    ],
    submitLabel: 'Log',
  },
  delivery: {
    title: 'Material Delivery',
    fields: [
      { key: 'description', label: 'What arrived?', type: 'text', placeholder: 'Describe the delivery', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Any details? (optional)' },
    ],
    submitLabel: 'Log',
  },
  sub_in: {
    title: 'Sub Arrived',
    fields: [
      { key: 'sub_name', label: 'Name / Company', type: 'text', placeholder: 'Who arrived?', required: true },
      { key: 'trade', label: 'Trade', type: 'select', options: TRADE_OPTIONS },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Any details? (optional)' },
    ],
    submitLabel: 'Log',
  },
  visit: {
    title: 'Site Visit',
    fields: [
      { key: 'note', label: 'Note', type: 'textarea', placeholder: 'Observations? (optional)' },
    ],
    submitLabel: 'Log',
  },
  issue: {
    title: 'Report Issue',
    fields: [
      { key: 'description', label: 'Issue', type: 'textarea', placeholder: 'Describe the issue...', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY_OPTIONS, required: true },
      { key: 'work_category', label: 'Category', type: 'select', options: WORK_CATEGORY_OPTIONS },
    ],
    submitLabel: 'Log',
  },
  request: {
    title: 'Client Request',
    fields: [
      { key: 'description', label: 'Request', type: 'textarea', placeholder: 'What did the client request?', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Additional context (optional)' },
    ],
    submitLabel: 'Log',
  },
  weather: {
    title: 'Weather Delay',
    fields: [
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Describe conditions (optional)' },
      { key: 'estimated_resume', label: 'Expected Resume', type: 'text', placeholder: 'e.g. Tomorrow AM, 2 hours' },
    ],
    submitLabel: 'Log',
  },
  started: {
    title: 'Task Started',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'What are you starting?', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Any details? (optional)' },
    ],
    submitLabel: 'Log',
  },
  inspect: {
    title: 'Schedule Inspection',
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Inspector or details (optional)' },
    ],
    submitLabel: 'Log',
  },
  passed: {
    title: 'Inspection Passed',
    fields: [
      { key: 'note', label: 'Note', type: 'textarea', placeholder: 'Inspector comments (optional)' },
    ],
    submitLabel: 'Log',
  },
  failed: {
    title: 'Inspection Failed',
    fields: [
      { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why did it fail?', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'Corrective action needed (optional)' },
    ],
    submitLabel: 'Log',
  },
  receipt: {
    title: 'Log Receipt',
    fields: [
      { key: 'amount', label: 'Amount ($)', type: 'text', placeholder: '0.00', required: true },
      { key: 'vendor', label: 'Vendor', type: 'text', placeholder: 'Where from?', required: true },
      { key: 'work_category', label: 'Category', type: 'select', options: WORK_CATEGORY_OPTIONS },
    ],
    submitLabel: 'Log',
  },
  unblocked: {
    title: 'Task Unblocked',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'Which task is unblocked?', required: true },
      { key: 'note', label: 'Note', type: 'textarea', placeholder: 'How was it resolved? (optional)' },
    ],
    submitLabel: 'Log',
  },
  sub_left: {
    title: 'Sub Departed',
    fields: [
      { key: 'sub_name', label: 'Name / Company', type: 'text', placeholder: 'Who left?', required: true },
      { key: 'note', label: 'Note', type: 'text', placeholder: 'What did they complete? (optional)' },
    ],
    submitLabel: 'Log',
  },
  safety: {
    title: 'Safety Report',
    fields: [
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What happened?', required: true },
    ],
    submitLabel: 'Log',
  },
};

// ============================================================================
// Summary Auto-Generation
// ============================================================================

function generateSummary(actionId: string, formData: Record<string, string>): string {
  switch (actionId) {
    case 'done':
      return `Completed: ${formData.task_name || 'task'}`;
    case 'photo':
      return formData.caption ? `Photo — ${formData.caption}` : 'Photo logged';
    case 'note':
      return formData.text?.length > 60 ? `${formData.text.slice(0, 57)}...` : (formData.text || 'Note added');
    case 'time': {
      const hrs = formData.duration_hours || '0';
      const cat = formData.work_category ? ` — ${formData.work_category}` : '';
      return `${hrs} hrs logged${cat}`;
    }
    case 'blocked':
      return `Blocked: ${formData.reason?.slice(0, 60) || formData.task_name || 'task'}`;
    case 'delivery':
      return `Delivery: ${formData.description || 'materials received'}`;
    case 'sub_in':
      return `Sub arrived: ${formData.sub_name || 'unknown'}`;
    case 'visit':
      return 'Site visit logged';
    case 'issue':
      return `Issue: ${formData.description?.slice(0, 60) || 'reported'}`;
    case 'request':
      return `Client request: ${formData.description?.slice(0, 60) || 'logged'}`;
    case 'weather':
      return `Weather delay${formData.estimated_resume ? ` — resume ${formData.estimated_resume}` : ''}`;
    case 'started':
      return `Started: ${formData.task_name || 'task'}`;
    case 'inspect':
      return `Inspection scheduled${formData.date ? ` for ${formData.date}` : ''}`;
    case 'passed':
      return 'Inspection passed';
    case 'failed':
      return `Inspection failed: ${formData.reason?.slice(0, 60) || 'see notes'}`;
    case 'receipt': {
      const amt = formData.amount ? `$${formData.amount}` : 'Receipt';
      return `${amt}${formData.vendor ? ` — ${formData.vendor}` : ''}`;
    }
    case 'unblocked':
      return `Unblocked: ${formData.task_name || 'task'}`;
    case 'sub_left':
      return `Sub departed: ${formData.sub_name || 'unknown'}`;
    case 'safety':
      return `Safety: ${formData.description?.slice(0, 60) || 'incident logged'}`;
    default:
      return 'Activity logged';
  }
}

// ============================================================================
// Duration Picker Component
// ============================================================================

const QUICK_DURATIONS = [
  { value: '0.5', label: '30m' },
  { value: '1', label: '1h' },
  { value: '2', label: '2h' },
  { value: '4', label: '4h' },
  { value: '8', label: '8h' },
];

function DurationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-secondary)' }}>
        Duration
      </label>
      <div className="flex gap-2 mb-2">
        {QUICK_DURATIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            className="flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-colors border"
            style={{
              borderColor: value === d.value ? 'var(--theme-accent)' : 'var(--theme-border)',
              backgroundColor: value === d.value ? 'var(--theme-accent-light)' : 'var(--theme-background)',
              color: value === d.value ? 'var(--theme-accent)' : 'var(--theme-secondary)',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
      <input
        type="number"
        step="0.25"
        min="0"
        max="24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Custom hours"
        className="input w-full"
      />
    </div>
  );
}

// ============================================================================
// QuickAddSheet Component
// ============================================================================

type SheetState = 'grid' | 'form';

export function QuickAddSheet() {
  const { isOpen, close } = useQuickAdd();
  const activityService = useActivityService();
  const { showToast } = useToast();

  const [sheetState, setSheetState] = useState<SheetState>('grid');
  const [selectedAction, setSelectedAction] = useState<QuickAddAction | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const completeTask = useCompleteTask();

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSheetState('grid');
        setSelectedAction(null);
        setFormData({});
        setShowMore(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const handleSelectAction = useCallback((action: QuickAddAction) => {
    setSelectedAction(action);
    setFormData({});
    setSheetState('form');
  }, []);

  const handleBack = useCallback(() => {
    setSheetState('grid');
    setSelectedAction(null);
    setFormData({});
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedAction || !selectedProjectId) return;

    const config = FORM_CONFIGS[selectedAction.id];
    if (!config) return;

    // Special validation for "done" — must select a task
    if (selectedAction.id === 'done' && !formData.task_id) {
      showToast({ message: 'Please select a task', variant: 'warning', duration: 3000 });
      return;
    }

    // Validate required fields
    const missing = config.fields.filter((f) => f.required && !formData[f.key]?.trim());
    if (missing.length > 0) {
      showToast({
        message: `Please fill in: ${missing.map((f) => f.label).join(', ')}`,
        variant: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // "Done" action → actually complete the task (updates status + auto-logs activity)
      if (selectedAction.id === 'done' && formData.task_id) {
        await completeTask.mutateAsync({
          projectId: selectedProjectId,
          taskId: formData.task_id,
          taskTitle: formData.task_name,
        });
        showToast({ message: 'Task completed', variant: 'success', duration: 2000 });
        close();
        return;
      }

      // All other actions → generic activity event
      const summary = generateSummary(selectedAction.id, formData);

      await activityService.create({
        event_type: selectedAction.eventType,
        project_id: selectedProjectId,
        entity_type: selectedAction.entityType,
        entity_id: `${selectedAction.entityType}_${Date.now()}`,
        summary,
        homeowner_visible: selectedAction.homeownerVisible,
        work_category_code: formData.work_category || null,
        event_data: { ...formData },
      });

      showToast({ message: 'Logged', variant: 'success', duration: 2000 });
      close();
    } catch (error) {
      console.error('Failed to log activity:', error);
      showToast({ message: 'Failed to log. Try again.', variant: 'error', duration: 4000 });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAction, selectedProjectId, formData, activityService, completeTask, showToast, close]);

  if (!isOpen) return null;

  const config = selectedAction ? FORM_CONFIGS[selectedAction.id] : null;

  return (
    <div
      className="fixed inset-0 z-50 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto animate-slide-up"
        style={{
          backgroundColor: 'var(--theme-background)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 sticky top-0 z-10" style={{ backgroundColor: 'var(--theme-background)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--theme-muted)' }} />
        </div>

        {/* ================================================================ */}
        {/* ACTION GRID STATE */}
        {/* ================================================================ */}
        {sheetState === 'grid' && (
          <div className="px-4 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-primary)' }}>
                Quick Add
              </h2>
              <button
                onClick={close}
                className="p-2 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={20} style={{ color: 'var(--theme-muted)' }} strokeWidth={1.5} />
              </button>
            </div>

            {/* Frequent Actions — 4 columns */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {FREQUENT_ACTIONS.map((action) => (
                <ActionButton key={action.id} action={action} onClick={() => handleSelectAction(action)} />
              ))}
            </div>

            {/* More Toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full py-3 mb-4 flex items-center justify-center gap-2 text-sm font-medium rounded-xl border transition-colors"
              style={{
                color: 'var(--theme-secondary)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <span>{showMore ? 'Less' : 'More Actions'}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.5}
                className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
                style={{ color: 'var(--theme-secondary)' }}
              />
            </button>

            {/* More Actions */}
            {showMore && (
              <div className="grid grid-cols-4 gap-3">
                {MORE_ACTIONS.map((action) => (
                  <ActionButton key={action.id} action={action} onClick={() => handleSelectAction(action)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* FORM STATE */}
        {/* ================================================================ */}
        {sheetState === 'form' && selectedAction && config && (
          <div className="px-4 pb-8">
            {/* Form Header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Back"
              >
                <ArrowLeft size={20} strokeWidth={1.5} style={{ color: 'var(--theme-muted)' }} />
              </button>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-primary)' }}>
                {config.title}
              </h2>
            </div>

            {/* Project Selector — always first */}
            <ProjectSelector value={selectedProjectId} onChange={setSelectedProjectId} />

            {/* Task Selector — for "done" action only */}
            {selectedAction.id === 'done' && (
              <TaskSelector
                projectId={selectedProjectId}
                value={formData.task_id || ''}
                onChange={(taskId, taskTitle) => {
                  setFormData((prev) => ({ ...prev, task_id: taskId, task_name: taskTitle }));
                }}
              />
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {config.fields.map((field) => (
                <FormFieldRenderer
                  key={field.key}
                  field={field}
                  value={formData[field.key] || ''}
                  onChange={(v) => handleFieldChange(field.key, v)}
                />
              ))}
            </div>

            {/* Submit */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={close}
                disabled={isSubmitting}
                className="btn flex-1 min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedProjectId}
                className="flex-1 min-h-[48px] rounded-xl font-medium text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--theme-accent)', borderRadius: 'var(--theme-radius)' }}
              >
                {isSubmitting ? 'Saving...' : config.submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function TaskSelector({
  projectId,
  value,
  onChange,
}: {
  projectId: string | null;
  value: string;
  onChange: (taskId: string, taskTitle: string) => void;
}) {
  const { data, isLoading } = useLocalTasks(projectId, ['not-started', 'in-progress', 'blocked']);
  const tasks = data?.tasks || [];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
        Task <span style={{ color: 'var(--theme-status-red)' }} className="ml-1">*</span>
      </label>

      {!projectId ? (
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>Select a project first</p>
      ) : isLoading ? (
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>No active tasks for this project</p>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            const task = tasks.find((t) => t.id === e.target.value);
            onChange(e.target.value, task?.title || '');
          }}
          className="input"
        >
          <option value="">Select task...</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>{task.title}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function ActionButton({ action, onClick }: { action: QuickAddAction; onClick: () => void }) {
  const Icon = action.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center min-h-[76px] min-w-[44px] p-2 rounded-2xl transition-colors"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <Icon size={24} strokeWidth={1.5} style={{ color: 'var(--theme-primary)' }} />
      <span className="text-[11px] mt-1.5 font-medium text-center leading-tight" style={{ color: 'var(--theme-secondary)' }}>
        {action.label}
      </span>
    </button>
  );
}

function FormFieldRenderer({ field, value, onChange }: { field: FormField; value: string; onChange: (v: string) => void }) {
  if (field.type === 'duration') {
    return <DurationPicker value={value} onChange={onChange} />;
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
        {field.label}
        {field.required && <span style={{ color: 'var(--theme-status-red)' }} className="ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="textarea"
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : field.type === 'date' ? (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="input" />
      ) : field.type === 'time' ? (
        <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="input" />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="input"
        />
      )}
    </div>
  );
}
