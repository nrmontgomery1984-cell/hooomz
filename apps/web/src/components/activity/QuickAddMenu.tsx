'use client';

/**
 * QuickAddMenu
 *
 * A quick-access bottom sheet for logging common daily activities.
 * Designed for field workers who need to log events quickly with one hand.
 *
 * Decision Filter Check:
 * - #1 Activity Log: Every quick-add writes to the activity log
 * - #6 Mobile/Field: 48px touch targets, one-hand operation with gloves
 * - #5 Mental Model: Actions match how contractors think about their day
 * - #7 Traceability: All events include actor, timestamp, context
 *
 * Follows Hooomz UI spec:
 * - 48px minimum touch targets (work gloves)
 * - Bottom sheet presentation (~40% screen height)
 * - Light, warm aesthetic
 * - Progressive disclosure (FAB → sheet → form)
 *
 * 19 Total Actions (per spec):
 * FREQUENT (8): Done, Photo, Note, Time, Blocked, Delivery, Sub Arrived, Site Visit
 * MORE (11): Issue, Client Request, Weather Delay, Task Started, Inspection Scheduled,
 *            Inspection Passed, Inspection Failed, Receipt, Safety Incident, Sub Departed, Task Unblocked
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCreateActivity } from '@/lib/api/hooks/useActivity';
import type { ActivityEventType } from '@hooomz/shared';

// ============================================================================
// Types
// ============================================================================

interface QuickAddAction {
  id: string;
  type: ActivityEventType | 'time.toggle' | 'photo.capture';
  label: string;
  icon: string;
  entityType: string;
  homeownerVisible: boolean;
  /** Voice triggers for this action */
  voiceTriggers?: string[];
  /** Special handling flag */
  special?: 'time' | 'photo' | 'sub';
}

interface QuickAddField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'toggle' | 'date' | 'time';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface FormConfig {
  title: string;
  subtitle: string;
  fields: QuickAddField[];
  submitLabel?: string;
}

// ============================================================================
// Action Definitions (per spec - 19 total)
// ============================================================================

/** FREQUENT ACTIONS (8) - Always visible in first two rows */
const FREQUENT_ACTIONS: QuickAddAction[] = [
  // Row 1: Most used
  {
    id: 'done',
    type: 'task.completed',
    label: 'Done',
    icon: '☑️',
    entityType: 'task_instance',
    homeownerVisible: true,
    voiceTriggers: ['done', 'completed', 'finished'],
  },
  {
    id: 'photo',
    type: 'photo.capture',
    label: 'Photo',
    icon: '📷',
    entityType: 'photo',
    homeownerVisible: false,
    voiceTriggers: ['photo', 'picture', 'snap'],
    special: 'photo',
  },
  {
    id: 'note',
    type: 'field_note.created',
    label: 'Note',
    icon: '📝',
    entityType: 'field_note',
    homeownerVisible: false,
    voiceTriggers: ['note', 'notes', 'remember'],
  },
  {
    id: 'time',
    type: 'time.toggle',
    label: 'Time',
    icon: '⏱️',
    entityType: 'time_entry',
    homeownerVisible: false,
    voiceTriggers: ['clock', 'time', 'punch'],
    special: 'time',
  },
  // Row 2: Common situational
  {
    id: 'blocked',
    type: 'task.blocked',
    label: 'Blocked',
    icon: '🚫',
    entityType: 'task_instance',
    homeownerVisible: false,
    voiceTriggers: ['blocked', 'stuck', 'waiting'],
  },
  {
    id: 'delivery',
    type: 'material.delivered',
    label: 'Delivery',
    icon: '🚚',
    entityType: 'delivery',
    homeownerVisible: true,
    voiceTriggers: ['delivery', 'delivered', 'materials arrived'],
  },
  {
    id: 'sub_arrived',
    type: 'site.sub_arrived',
    label: 'Sub Arrived',
    icon: '🚗',
    entityType: 'site_visit',
    homeownerVisible: false,
    voiceTriggers: ['sub arrived', 'trade arrived', 'contractor here'],
  },
  {
    id: 'site_visit',
    type: 'site.visit_logged',
    label: 'Site Visit',
    icon: '📍',
    entityType: 'site_visit',
    homeownerVisible: true,
    voiceTriggers: ['site visit', 'visited site', 'on site'],
  },
];

/** MORE ACTIONS (11) - Collapsed by default */
const MORE_ACTIONS: QuickAddAction[] = [
  {
    id: 'issue',
    type: 'site.issue',
    label: 'Issue',
    icon: '⚠️',
    entityType: 'field_note',
    homeownerVisible: true,
    voiceTriggers: ['issue', 'problem', 'concern'],
  },
  {
    id: 'client_request',
    type: 'client.request',
    label: 'Client Request',
    icon: '💬',
    entityType: 'client_request',
    homeownerVisible: true,
    voiceTriggers: ['client request', 'customer asked', 'homeowner wants'],
  },
  {
    id: 'weather_delay',
    type: 'site.weather_delay',
    label: 'Weather Delay',
    icon: '🌧️',
    entityType: 'delay',
    homeownerVisible: true,
    voiceTriggers: ['weather delay', 'rain delay', 'weather hold'],
  },
  {
    id: 'task_started',
    type: 'task.started',
    label: 'Task Started',
    icon: '▶️',
    entityType: 'task_instance',
    homeownerVisible: false,
    voiceTriggers: ['started', 'beginning', 'working on'],
  },
  {
    id: 'inspection_scheduled',
    type: 'inspection.scheduled',
    label: 'Inspection Scheduled',
    icon: '📅',
    entityType: 'inspection',
    homeownerVisible: true,
    voiceTriggers: ['inspection scheduled', 'scheduled inspection'],
  },
  {
    id: 'inspection_passed',
    type: 'inspection.passed',
    label: 'Inspection Passed',
    icon: '✓',
    entityType: 'inspection',
    homeownerVisible: true,
    voiceTriggers: ['inspection passed', 'passed inspection'],
  },
  {
    id: 'inspection_failed',
    type: 'inspection.failed',
    label: 'Inspection Failed',
    icon: '✗',
    entityType: 'inspection',
    homeownerVisible: true,
    voiceTriggers: ['inspection failed', 'failed inspection'],
  },
  {
    id: 'receipt',
    type: 'receipt.uploaded',
    label: 'Receipt',
    icon: '🧾',
    entityType: 'receipt',
    homeownerVisible: false,
    voiceTriggers: ['receipt', 'expense', 'purchase'],
  },
  {
    id: 'safety_incident',
    type: 'site.safety_incident',
    label: 'Safety Incident',
    icon: '🦺',
    entityType: 'safety_incident',
    homeownerVisible: true,
    voiceTriggers: ['safety incident', 'safety issue', 'injury'],
  },
  {
    id: 'sub_departed',
    type: 'site.sub_departed',
    label: 'Sub Departed',
    icon: '👋',
    entityType: 'site_visit',
    homeownerVisible: false,
    voiceTriggers: ['sub left', 'sub departed', 'contractor left'],
  },
  {
    id: 'task_unblocked',
    type: 'task.unblocked',
    label: 'Task Unblocked',
    icon: '✅',
    entityType: 'task_instance',
    homeownerVisible: false,
    voiceTriggers: ['unblocked', 'resolved', 'can proceed'],
  },
];

/** Form configurations for each action */
const FORM_CONFIGS: Record<string, FormConfig> = {
  done: {
    title: 'Task Completed',
    subtitle: 'Mark a task as done',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'What did you complete?', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any details? (optional)' },
    ],
    submitLabel: 'Complete',
  },
  photo: {
    title: 'Add Photo',
    subtitle: 'Capture and tag a photo',
    fields: [
      { key: 'caption', label: 'Caption', type: 'text', placeholder: 'What is this photo of?' },
      { key: 'task_link', label: 'Link to Task', type: 'text', placeholder: 'Which task? (optional)' },
    ],
    submitLabel: 'Save Photo',
  },
  note: {
    title: 'Add Note',
    subtitle: 'Quick field note',
    fields: [
      { key: 'content', label: 'Note', type: 'textarea', placeholder: 'What do you want to note?', required: true },
      { key: 'task_link', label: 'Link to Task', type: 'text', placeholder: 'Which task? (optional)' },
      { key: 'flag_for_co', label: 'Flag for Change Order', type: 'toggle' },
    ],
    submitLabel: 'Save Note',
  },
  time: {
    title: 'Time Tracking',
    subtitle: 'Clock in or out',
    fields: [
      { key: 'clock_action', label: 'Action', type: 'toggle' },
      { key: 'task_link', label: 'Working on', type: 'text', placeholder: 'Which task? (optional)' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes? (optional)' },
    ],
  },
  blocked: {
    title: 'Task Blocked',
    subtitle: 'Report a blocker',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'Which task is blocked?', required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why is it blocked?', required: true },
      { key: 'share_with_homeowner', label: 'Share with Homeowner', type: 'toggle' },
    ],
    submitLabel: 'Report Block',
  },
  delivery: {
    title: 'Material Delivery',
    subtitle: 'Log a delivery',
    fields: [
      { key: 'vendor', label: 'Vendor', type: 'text', placeholder: 'Where from?', required: true },
      { key: 'items', label: 'Items', type: 'textarea', placeholder: 'What was delivered? (optional)' },
    ],
    submitLabel: 'Log Delivery',
  },
  sub_arrived: {
    title: 'Sub Arrived',
    subtitle: 'Trade partner on site',
    fields: [
      { key: 'sub_name', label: 'Name/Company', type: 'text', placeholder: 'Who arrived?', required: true },
      { key: 'trade', label: 'Trade', type: 'select', options: [
        { value: 'flooring', label: 'Flooring' },
        { value: 'paint', label: 'Paint' },
        { value: 'trim', label: 'Finish Carpentry' },
        { value: 'tile', label: 'Tile' },
        { value: 'drywall', label: 'Drywall' },
        { value: 'other', label: 'Other' },
      ]},
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes? (optional)' },
    ],
    submitLabel: 'Log Arrival',
  },
  site_visit: {
    title: 'Site Visit',
    subtitle: 'Log your visit',
    fields: [
      { key: 'purpose', label: 'Purpose', type: 'text', placeholder: 'Why are you visiting?', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Observations? (optional)' },
    ],
    submitLabel: 'Log Visit',
  },
  issue: {
    title: 'Report Issue',
    subtitle: 'Flag a problem',
    fields: [
      { key: 'issue_type', label: 'Type', type: 'select', options: [
        { value: 'quality', label: 'Quality Issue' },
        { value: 'safety', label: 'Safety Concern' },
        { value: 'material', label: 'Material Problem' },
        { value: 'scope', label: 'Scope Question' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the issue...', required: true },
      { key: 'flag_for_co', label: 'Flag for Change Order', type: 'toggle' },
    ],
    submitLabel: 'Report Issue',
  },
  client_request: {
    title: 'Client Request',
    subtitle: 'Log a customer request',
    fields: [
      { key: 'request_type', label: 'Type', type: 'select', options: [
        { value: 'change', label: 'Change Request' },
        { value: 'question', label: 'Question' },
        { value: 'concern', label: 'Concern' },
        { value: 'approval', label: 'Approval Needed' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'request_details', label: 'Details', type: 'textarea', placeholder: 'What did they request?', required: true },
    ],
    submitLabel: 'Log Request',
  },
  weather_delay: {
    title: 'Weather Delay',
    subtitle: 'Log a weather-related delay',
    fields: [
      { key: 'delay_reason', label: 'Reason', type: 'select', options: [
        { value: 'rain', label: 'Rain' },
        { value: 'snow', label: 'Snow/Ice' },
        { value: 'wind', label: 'High Wind' },
        { value: 'temperature', label: 'Extreme Temperature' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'expected_duration', label: 'Expected Duration', type: 'text', placeholder: 'How long? (e.g., 2 hours, rest of day)' },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details? (optional)' },
    ],
    submitLabel: 'Log Delay',
  },
  task_started: {
    title: 'Task Started',
    subtitle: 'Mark work as started',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'What are you starting?', required: true },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes? (optional)' },
    ],
    submitLabel: 'Start Task',
  },
  inspection_scheduled: {
    title: 'Inspection Scheduled',
    subtitle: 'Schedule an inspection',
    fields: [
      { key: 'inspection_type', label: 'Type', type: 'select', options: [
        { value: 'floor_flatness', label: 'Floor Flatness Check' },
        { value: 'paint_quality', label: 'Paint Quality' },
        { value: 'trim_alignment', label: 'Trim Alignment' },
        { value: 'final_walkthrough', label: 'Final Walkthrough' },
        { value: 'punch_list', label: 'Punch List Review' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'scheduled_date', label: 'Date', type: 'date', required: true },
      { key: 'scheduled_time', label: 'Time', type: 'time' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes? (optional)' },
    ],
    submitLabel: 'Schedule',
  },
  inspection_passed: {
    title: 'Inspection Passed',
    subtitle: 'Log a passed inspection',
    fields: [
      { key: 'inspection_type', label: 'Type', type: 'select', options: [
        { value: 'floor_flatness', label: 'Floor Flatness Check' },
        { value: 'paint_quality', label: 'Paint Quality' },
        { value: 'trim_alignment', label: 'Trim Alignment' },
        { value: 'final_walkthrough', label: 'Final Walkthrough' },
        { value: 'punch_list', label: 'Punch List Review' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Inspector comments? (optional)' },
    ],
    submitLabel: 'Log Pass',
  },
  inspection_failed: {
    title: 'Inspection Failed',
    subtitle: 'Log a failed inspection',
    fields: [
      { key: 'inspection_type', label: 'Type', type: 'select', options: [
        { value: 'floor_flatness', label: 'Floor Flatness Check' },
        { value: 'paint_quality', label: 'Paint Quality' },
        { value: 'trim_alignment', label: 'Trim Alignment' },
        { value: 'final_walkthrough', label: 'Final Walkthrough' },
        { value: 'punch_list', label: 'Punch List Review' },
        { value: 'other', label: 'Other' },
      ], required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', placeholder: 'Why did it fail?', required: true },
      { key: 'notes', label: 'Corrective Action', type: 'textarea', placeholder: 'What needs to be done?' },
    ],
    submitLabel: 'Log Failure',
  },
  receipt: {
    title: 'Upload Receipt',
    subtitle: 'Log an expense',
    fields: [
      { key: 'vendor', label: 'Vendor', type: 'text', placeholder: 'Where from?', required: true },
      { key: 'amount', label: 'Amount', type: 'text', placeholder: '$0.00', required: true },
      { key: 'category', label: 'Category', type: 'select', options: [
        { value: 'materials', label: 'Materials' },
        { value: 'tools', label: 'Tools' },
        { value: 'equipment', label: 'Equipment Rental' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'other', label: 'Other' },
      ]},
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'What was purchased? (optional)' },
    ],
    submitLabel: 'Log Receipt',
  },
  safety_incident: {
    title: 'Safety Incident',
    subtitle: 'Report a safety event',
    fields: [
      { key: 'severity', label: 'Severity', type: 'select', options: [
        { value: 'near_miss', label: 'Near Miss' },
        { value: 'minor', label: 'Minor (First Aid)' },
        { value: 'major', label: 'Major (Medical Attention)' },
        { value: 'critical', label: 'Critical (Emergency)' },
      ], required: true },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'What happened?', required: true },
      { key: 'action_taken', label: 'Action Taken', type: 'textarea', placeholder: 'What was done?' },
    ],
    submitLabel: 'Report Incident',
  },
  sub_departed: {
    title: 'Sub Departed',
    subtitle: 'Trade partner left site',
    fields: [
      { key: 'sub_name', label: 'Name/Company', type: 'text', placeholder: 'Who left?', required: true },
      { key: 'trade', label: 'Trade', type: 'select', options: [
        { value: 'flooring', label: 'Flooring' },
        { value: 'paint', label: 'Paint' },
        { value: 'trim', label: 'Finish Carpentry' },
        { value: 'tile', label: 'Tile' },
        { value: 'drywall', label: 'Drywall' },
        { value: 'other', label: 'Other' },
      ]},
      { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'What did they complete? (optional)' },
    ],
    submitLabel: 'Log Departure',
  },
  task_unblocked: {
    title: 'Task Unblocked',
    subtitle: 'Blocker resolved',
    fields: [
      { key: 'task_name', label: 'Task', type: 'text', placeholder: 'Which task is unblocked?', required: true },
      { key: 'resolution', label: 'Resolution', type: 'textarea', placeholder: 'How was it resolved?' },
    ],
    submitLabel: 'Mark Unblocked',
  },
};

// ============================================================================
// Component Props
// ============================================================================

interface QuickAddMenuProps {
  /** Project ID to associate events with (auto-populated in project context) */
  projectId?: string;
  /** Task ID if opened from task context */
  taskId?: string;
  /** Task name if opened from task context */
  taskName?: string;
  /** Called after an event is successfully created */
  onEventCreated?: () => void;
  /** Called when photo capture is requested */
  onOpenCamera?: () => void;
  /** Additional class names */
  className?: string;
}

type MenuState = 'closed' | 'sheet' | 'form';

// ============================================================================
// Component
// ============================================================================

export function QuickAddMenu({
  projectId = 'proj-001', // Default mock project
  taskId,
  taskName,
  onEventCreated,
  onOpenCamera,
  className = '',
}: QuickAddMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const [selectedAction, setSelectedAction] = useState<QuickAddAction | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const createActivity = useCreateActivity();

  // Pre-populate task info if in task context
  useEffect(() => {
    if (taskId && taskName) {
      setFormData((prev) => ({ ...prev, task_name: taskName, task_link: taskId }));
    }
  }, [taskId, taskName]);

  const handleClose = useCallback(() => {
    setMenuState('closed');
    setSelectedAction(null);
    setShowMoreActions(false);
    setFormData(taskId ? { task_name: taskName || '', task_link: taskId } : {});
  }, [taskId, taskName]);

  // Close sheet when clicking backdrop
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleSelectAction = useCallback((action: QuickAddAction) => {
    // Special handling for photo - open camera immediately
    if (action.special === 'photo') {
      onOpenCamera?.();
      handleClose();
      return;
    }

    setSelectedAction(action);
    // Initialize toggle states
    if (action.id === 'time') {
      setFormData((prev) => ({ ...prev, clock_action: clockedIn ? 'out' : 'in' }));
    }
    setMenuState('form');
  }, [clockedIn, handleClose, onOpenCamera]);

  const handleFieldChange = useCallback((key: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedAction) return;

    const config = FORM_CONFIGS[selectedAction.id];

    // Validate required fields
    const missingRequired = config?.fields.filter(
      (f) => f.required && !formData[f.key]
    );
    if (missingRequired && missingRequired.length > 0) {
      alert(`Please fill in: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine actual event type based on action and form data
      let eventType: string = selectedAction.type;
      const eventData: Record<string, unknown> = { ...formData, _version: 1 };

      // Special handling for time toggle
      if (selectedAction.id === 'time') {
        eventType = formData.clock_action === 'in' ? 'time.clock_in' : 'time.clock_out';
        setClockedIn(formData.clock_action === 'in');
      }

      // Special handling for blocked - check share with homeowner
      let homeownerVisible = selectedAction.homeownerVisible;
      if (selectedAction.id === 'blocked' && formData.share_with_homeowner === 'true') {
        eventType = 'task.blocked_shared';
        homeownerVisible = true;
      }

      // Special handling for issue with CO flag
      if (selectedAction.id === 'issue' && formData.flag_for_co === 'true') {
        eventData.flagged_for_co = true;
      }

      await createActivity.mutateAsync({
        event_type: eventType,
        project_id: projectId,
        entity_type: selectedAction.entityType,
        entity_id: `${selectedAction.entityType}-${Date.now()}`,
        homeowner_visible: homeownerVisible,
        event_data: eventData,
      });

      handleClose();
      onEventCreated?.();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to log activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAction, formData, projectId, createActivity, handleClose, onEventCreated]);

  const config = selectedAction ? FORM_CONFIGS[selectedAction.id] : null;

  return (
    <>
      {/* FAB Button - Coral/Terracotta for visibility against cream background */}
      <button
        onClick={() => setMenuState(menuState === 'closed' ? 'sheet' : 'closed')}
        className={`
          w-14 h-14 rounded-full
          bg-coral text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200
          ${menuState !== 'closed' ? 'rotate-45 bg-slate-600' : 'hover:brightness-110'}
          ${className}
        `}
        aria-label={menuState === 'closed' ? 'Quick add activity' : 'Close menu'}
        aria-expanded={menuState !== 'closed'}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Bottom Sheet Backdrop */}
      {menuState !== 'closed' && (
        <div
          className="fixed inset-0 bg-black/30 z-50 animate-in fade-in duration-200"
          onClick={handleBackdropClick}
        >
          {/* Bottom Sheet */}
          <div
            ref={sheetRef}
            className="
              absolute bottom-0 left-0 right-0
              bg-white rounded-t-3xl shadow-xl
              animate-in slide-in-from-bottom duration-300
              max-h-[85vh] overflow-y-auto
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-3 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {menuState === 'sheet' && (
              <div className="px-4 pb-8">
                {/* Header */}
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Add</h2>

                {/* FREQUENT Actions - 8 buttons in 2 rows */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {FREQUENT_ACTIONS.map((action) => (
                    <QuickAddButton
                      key={action.id}
                      action={action}
                      onClick={() => handleSelectAction(action)}
                    />
                  ))}
                </div>

                {/* MORE Actions Toggle */}
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="
                    w-full py-3 mb-4
                    flex items-center justify-center gap-2
                    text-sm font-medium text-slate-500
                    border border-slate-200 rounded-xl
                    hover:bg-slate-50 transition-colors
                  "
                >
                  <span>{showMoreActions ? 'Less' : 'More Actions'}</span>
                  <span className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* MORE Actions - 11 buttons (collapsed by default) */}
                {showMoreActions && (
                  <div className="grid grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                    {MORE_ACTIONS.map((action) => (
                      <QuickAddButton
                        key={action.id}
                        action={action}
                        onClick={() => handleSelectAction(action)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {menuState === 'form' && selectedAction && config && (
              <div className="px-4 pb-8">
                {/* Form Header */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setMenuState('sheet')}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Back to menu"
                  >
                    ←
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{config.title}</h2>
                    <p className="text-sm text-slate-500">{config.subtitle}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {config.fields.map((field) => (
                    <div key={field.key}>
                      {field.type === 'toggle' ? (
                        <ToggleField
                          field={field}
                          actionId={selectedAction.id}
                          value={formData[field.key] as string}
                          onChange={(value) => handleFieldChange(field.key, value)}
                        />
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-slate-600 mb-1">
                            {field.label}
                            {field.required && <span className="text-coral ml-1">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={(formData[field.key] as string) || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                              className="
                                w-full px-4 py-3
                                border border-slate-200 rounded-xl
                                text-slate-700 placeholder:text-slate-400
                                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                                resize-none
                              "
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={(formData[field.key] as string) || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="
                                w-full min-h-[48px] px-4 py-3
                                border border-slate-200 rounded-xl
                                text-slate-700
                                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                              "
                            >
                              <option value="">Select...</option>
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              value={(formData[field.key] as string) || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="
                                w-full min-h-[48px] px-4 py-3
                                border border-slate-200 rounded-xl
                                text-slate-700
                                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                              "
                            />
                          ) : field.type === 'time' ? (
                            <input
                              type="time"
                              value={(formData[field.key] as string) || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="
                                w-full min-h-[48px] px-4 py-3
                                border border-slate-200 rounded-xl
                                text-slate-700
                                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                              "
                            />
                          ) : (
                            <input
                              type="text"
                              value={(formData[field.key] as string) || ''}
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="
                                w-full min-h-[48px] px-4 py-3
                                border border-slate-200 rounded-xl
                                text-slate-700 placeholder:text-slate-400
                                focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                              "
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="
                      flex-1 min-h-[48px]
                      border border-slate-200 rounded-xl
                      text-slate-600 font-medium
                      hover:bg-slate-50 active:bg-slate-100
                      transition-colors
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="
                      flex-1 min-h-[48px]
                      bg-teal text-white rounded-xl
                      font-medium
                      hover:bg-teal-600 active:bg-teal-700
                      transition-colors
                      disabled:opacity-50
                      flex items-center justify-center gap-2
                    "
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Saving...
                      </>
                    ) : (
                      config.submitLabel || 'Save'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface QuickAddButtonProps {
  action: QuickAddAction;
  onClick: () => void;
}

function QuickAddButton({ action, onClick }: QuickAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex flex-col items-center justify-center
        min-h-[80px] min-w-[48px] p-2
        rounded-2xl
        bg-slate-50 hover:bg-slate-100 active:bg-slate-200
        transition-colors
      "
    >
      <span className="text-2xl mb-1">{action.icon}</span>
      <span className="text-xs font-medium text-slate-600 text-center leading-tight">{action.label}</span>
    </button>
  );
}

interface ToggleFieldProps {
  field: QuickAddField;
  actionId: string;
  value: string;
  onChange: (value: string) => void;
}

function ToggleField({ field, actionId, value, onChange }: ToggleFieldProps) {
  // Different toggle options based on action type
  let options: { value: string; label: string }[] = [];

  if (actionId === 'time' && field.key === 'clock_action') {
    options = [
      { value: 'in', label: 'Clock In' },
      { value: 'out', label: 'Clock Out' },
    ];
  } else if (field.key === 'flag_for_co' || field.key === 'photo_needed' || field.key === 'share_with_homeowner') {
    // Boolean toggle
    return (
      <label className="flex items-center gap-3 min-h-[48px] cursor-pointer">
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : '')}
          className="w-5 h-5 rounded border-slate-300 text-teal focus:ring-teal"
        />
        <span className="text-sm font-medium text-slate-700">{field.label}</span>
      </label>
    );
  }

  // If no options defined, return null
  if (options.length === 0) return null;

  // Two-option toggle button
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 min-h-[48px] rounded-xl font-medium
            transition-colors
            ${value === opt.value
              ? 'bg-teal text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
