'use client';

/**
 * ChecklistView Component
 *
 * Interactive checklist with photos and notes.
 * Large checkboxes for field use.
 */

import React, { useState } from 'react';
import type { ChecklistItem } from '@hooomz/shared-contracts';
import { Card, Badge, Button } from '@/components/ui';

interface ChecklistViewProps {
  items: ChecklistItem[];
  onItemCheck: (itemId: string, checked: boolean) => void;
  onAddNote?: (itemId: string, note: string) => void;
  onAddPhoto?: (itemId: string) => void;
  readOnly?: boolean;
}

export function ChecklistView({
  items,
  onItemCheck,
  onAddNote,
  onAddPhoto,
  readOnly = false,
}: ChecklistViewProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const getCompletionStats = () => {
    const completed = items.filter((item) => item.checked).length;
    const total = items.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const handleItemClick = (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
      const item = items.find((i) => i.id === itemId);
      if (item?.notes) {
        setNoteText(item.notes);
      } else {
        setNoteText('');
      }
    }
  };

  const handleSaveNote = (itemId: string) => {
    if (onAddNote && noteText.trim()) {
      onAddNote(itemId, noteText.trim());
      setNoteText('');
      setExpandedItem(null);
    }
  };

  const stats = getCompletionStats();

  if (items.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          No checklist items for this inspection
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Progress</h3>
          <span className="text-2xl font-bold text-gray-900">
            {stats.completed} / {stats.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              stats.percentage === 100
                ? 'bg-green-500'
                : stats.percentage > 0
                ? 'bg-yellow-500'
                : 'bg-gray-300'
            }`}
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-600 mt-2">
          {stats.percentage}% Complete
        </div>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedItem === item.id;

          return (
            <Card key={item.id} className={isExpanded ? 'border-primary-500' : ''}>
              <div className="space-y-3">
                {/* Main Item */}
                <div className="flex items-start gap-4">
                  {/* Large Checkbox */}
                  <button
                    onClick={() => !readOnly && onItemCheck(item.id, !item.checked)}
                    disabled={readOnly}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      item.checked
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300 hover:border-primary-500'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {item.checked && (
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Item Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4
                          className={`text-lg font-semibold ${
                            item.checked ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.required && (
                        <Badge variant="error" size="sm">
                          Required
                        </Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!readOnly && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleItemClick(item.id)}
                        >
                          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Add Note
                        </Button>
                        {onAddPhoto && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAddPhoto(item.id)}
                          >
                            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Add Photo
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Existing Notes */}
                    {item.notes && !isExpanded && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{item.notes}</p>
                      </div>
                    )}

                    {/* Photo Count */}
                    {item.photos && item.photos.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{item.photos.length} photos attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Note Editor */}
                {isExpanded && !readOnly && (
                  <div className="pl-16 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Note
                      </label>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter notes or observations..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveNote(item.id)}
                        disabled={!noteText.trim()}
                      >
                        Save Note
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setExpandedItem(null);
                          setNoteText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
