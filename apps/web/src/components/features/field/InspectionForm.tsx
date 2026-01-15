'use client';

/**
 * InspectionForm Component
 *
 * Schedule or record an inspection with checklist template.
 */

import React, { useState, useEffect } from 'react';
import type { Inspection, ChecklistItem } from '@hooomz/shared-contracts';
import { Button, Badge } from '@/components/ui';

interface InspectionFormProps {
  inspection?: Inspection;
  projectId: string;
  onSubmit: (data: Partial<Inspection>) => void;
  onCancel: () => void;
}

// Checklist templates by inspection type
const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  safety: [
    {
      id: 'safety-1',
      title: 'Personal Protective Equipment',
      description: 'Verify all workers have proper PPE (hard hats, safety glasses, boots)',
      required: true,
      checked: false,
    },
    {
      id: 'safety-2',
      title: 'Fall Protection',
      description: 'Check guardrails, safety nets, and personal fall arrest systems',
      required: true,
      checked: false,
    },
    {
      id: 'safety-3',
      title: 'Scaffolding Inspection',
      description: 'Verify scaffolding is properly erected and tagged',
      required: true,
      checked: false,
    },
    {
      id: 'safety-4',
      title: 'Emergency Equipment',
      description: 'Check fire extinguishers, first aid kits, and emergency exits',
      required: true,
      checked: false,
    },
    {
      id: 'safety-5',
      title: 'Hazardous Materials',
      description: 'Verify proper storage and labeling of hazardous materials',
      required: true,
      checked: false,
    },
  ],
  quality: [
    {
      id: 'quality-1',
      title: 'Material Compliance',
      description: 'Verify materials meet specification requirements',
      required: true,
      checked: false,
    },
    {
      id: 'quality-2',
      title: 'Workmanship Standards',
      description: 'Check work meets quality standards and specifications',
      required: true,
      checked: false,
    },
    {
      id: 'quality-3',
      title: 'Dimensional Accuracy',
      description: 'Verify measurements and tolerances are within acceptable range',
      required: true,
      checked: false,
    },
    {
      id: 'quality-4',
      title: 'Surface Finishes',
      description: 'Inspect surface finishes for defects or damage',
      required: false,
      checked: false,
    },
    {
      id: 'quality-5',
      title: 'Code Compliance',
      description: 'Verify work complies with building codes and regulations',
      required: true,
      checked: false,
    },
  ],
  progress: [
    {
      id: 'progress-1',
      title: 'Schedule Status',
      description: 'Compare actual progress to planned schedule',
      required: true,
      checked: false,
    },
    {
      id: 'progress-2',
      title: 'Completed Activities',
      description: 'Document all completed activities since last inspection',
      required: true,
      checked: false,
    },
    {
      id: 'progress-3',
      title: 'Work in Progress',
      description: 'Document current activities and percentage complete',
      required: true,
      checked: false,
    },
    {
      id: 'progress-4',
      title: 'Upcoming Activities',
      description: 'Review planned activities for next period',
      required: false,
      checked: false,
    },
    {
      id: 'progress-5',
      title: 'Delays and Issues',
      description: 'Document any delays, issues, or schedule impacts',
      required: true,
      checked: false,
    },
  ],
  final: [
    {
      id: 'final-1',
      title: 'Punch List Items',
      description: 'Verify all punch list items are completed',
      required: true,
      checked: false,
    },
    {
      id: 'final-2',
      title: 'Code Compliance Final',
      description: 'Final verification of all code requirements',
      required: true,
      checked: false,
    },
    {
      id: 'final-3',
      title: 'Warranty Documentation',
      description: 'Collect all warranty documents and certificates',
      required: true,
      checked: false,
    },
    {
      id: 'final-4',
      title: 'Operation Manuals',
      description: 'Verify all operation and maintenance manuals provided',
      required: true,
      checked: false,
    },
    {
      id: 'final-5',
      title: 'As-Built Drawings',
      description: 'Confirm as-built drawings are complete and accurate',
      required: true,
      checked: false,
    },
    {
      id: 'final-6',
      title: 'Final Cleanup',
      description: 'Verify site is clean and ready for occupancy',
      required: true,
      checked: false,
    },
  ],
};

const INSPECTION_TYPES = [
  { value: 'safety', label: 'Safety Inspection' },
  { value: 'quality', label: 'Quality Control' },
  { value: 'progress', label: 'Progress Inspection' },
  { value: 'final', label: 'Final Inspection' },
];

export function InspectionForm({
  inspection,
  projectId,
  onSubmit,
  onCancel,
}: InspectionFormProps) {
  const [title, setTitle] = useState(inspection?.title || '');
  const [inspectionType, setInspectionType] = useState(
    inspection?.inspectionType || 'safety'
  );
  const [scheduledDate, setScheduledDate] = useState(
    inspection?.scheduledDate || ''
  );
  const [inspector, setInspector] = useState(inspection?.inspector || '');
  const [notes, setNotes] = useState(inspection?.notes || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    inspection?.checklistItems || []
  );

  // Load template when inspection type changes
  useEffect(() => {
    if (!inspection && inspectionType) {
      const template = CHECKLIST_TEMPLATES[inspectionType] || [];
      setChecklist(template);
    }
  }, [inspectionType, inspection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: Partial<Inspection> = {
      title: title.trim(),
      inspectionType,
      scheduledDate: scheduledDate || undefined,
      inspector: inspector.trim() || undefined,
      notes: notes.trim() || undefined,
      checklistItems: checklist,
      projectId,
    };

    // If editing existing inspection, preserve status and dates
    if (inspection) {
      data.status = inspection.status;
      data.completedDate = inspection.completedDate;
    } else {
      data.status = 'pending';
    }

    onSubmit(data);
  };

  const handleChecklistItemChange = (itemId: string, field: string, value: any) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      title: 'New Item',
      description: '',
      required: false,
      checked: false,
    };
    setChecklist([...checklist, newItem]);
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((item) => item.id !== itemId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inspection Type *
          </label>
          <select
            value={inspectionType}
            onChange={(e) => setInspectionType(e.target.value)}
            disabled={!!inspection}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            required
          >
            {INSPECTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {inspection && (
            <p className="text-sm text-gray-500 mt-1">
              Cannot change type after creation
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of inspection"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspector
            </label>
            <input
              type="text"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              placeholder="Name of inspector"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes or instructions"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Checklist Items ({checklist.length})
          </h3>
          <Button type="button" variant="ghost" onClick={addChecklistItem}>
            + Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {checklist.map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      handleChecklistItemChange(item.id, 'title', e.target.value)
                    }
                    placeholder="Item title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.required}
                      onChange={(e) =>
                        handleChecklistItemChange(
                          item.id,
                          'required',
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => removeChecklistItem(item.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <textarea
                value={item.description || ''}
                onChange={(e) =>
                  handleChecklistItemChange(item.id, 'description', e.target.value)
                }
                rows={2}
                placeholder="Item description or instructions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          ))}
        </div>

        {checklist.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No checklist items yet</p>
            <p className="text-sm">Click "Add Item" to create your first item</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {inspection ? 'Update Inspection' : 'Create Inspection'}
        </Button>
      </div>
    </form>
  );
}
