/**
 * Element Modal Component
 * Displays element details and allows status changes, notes, and photos
 *
 * Uses BottomSheet on mobile for slide-up behavior
 * Max height 70% viewport, 44px touch targets
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  FloorPlanElement,
  Loop,
  LoopStatus,
  ActivityEvent,
} from '../../types/database';
import { statusColors, STATUS_OPTIONS } from '../ui/colors';
import { Button, BottomSheet } from '../ui';

// ============================================================================
// TYPES
// ============================================================================

export interface ElementModalProps {
  isOpen: boolean;
  element: FloorPlanElement;
  loop: Loop;
  recentActivity?: ActivityEvent[];
  onStatusChange: (loopId: string, status: LoopStatus) => void;
  onAddNote?: (loopId: string, note: string) => void;
  onAddPhoto?: (loopId: string, file: File, caption?: string) => void;
  onClose: () => void;
  isUpdating?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format activity event for display
 */
function formatActivityEvent(event: ActivityEvent): string {
  const date = new Date(event.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Extract description from event type
  const typeMap: Record<string, string> = {
    'loop.status_changed': 'Status changed',
    'loop.completed': 'Marked complete',
    'loop.blocked': 'Marked blocked',
    'task.started': 'Work started',
    'task.completed': 'Task completed',
    'task.note_added': 'Note added',
    'task.photo_added': 'Photo added',
    'task.progress_logged': 'Progress logged',
  };

  const description = typeMap[event.event_type] || event.event_type.replace(/\./g, ' ');
  const actor = (event.payload?.actor_name as string) || '';

  return `${dateStr}: ${description}${actor ? ` (${actor})` : ''}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ElementModal({
  isOpen,
  element,
  loop,
  recentActivity = [],
  onStatusChange,
  onAddNote,
  onAddPhoto,
  onClose,
  isUpdating = false,
}: ElementModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<LoopStatus>(loop.status);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  // Reset state when loop changes
  useEffect(() => {
    setSelectedStatus(loop.status);
  }, [loop.status]);

  // Handle status selection
  const handleStatusSelect = useCallback(
    (status: LoopStatus) => {
      setSelectedStatus(status);
      if (status !== loop.status) {
        onStatusChange(loop.id, status);
      }
    },
    [loop.id, loop.status, onStatusChange]
  );

  // Handle note submission
  const handleNoteSubmit = useCallback(() => {
    if (note.trim() && onAddNote) {
      onAddNote(loop.id, note.trim());
      setNote('');
      setShowNoteInput(false);
    }
  }, [loop.id, note, onAddNote]);

  // Handle photo selection
  const handlePhotoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPendingPhoto(file);
      }
    },
    []
  );

  // Handle photo submission with caption
  const handlePhotoSubmit = useCallback(() => {
    if (pendingPhoto && onAddPhoto) {
      onAddPhoto(loop.id, pendingPhoto, photoCaption.trim() || undefined);
      setPendingPhoto(null);
      setPhotoCaption('');
    }
  }, [loop.id, pendingPhoto, photoCaption, onAddPhoto]);

  // Cancel photo
  const handlePhotoCancel = useCallback(() => {
    setPendingPhoto(null);
    setPhotoCaption('');
  }, []);

  // Get display info
  const displayName = element.label || loop.name;

  // Get last 3 activity events
  const displayActivity = recentActivity.slice(0, 3);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={displayName}>
      <div className="space-y-5 pt-2">
        {/* Status Selection - 44px touch targets */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = selectedStatus === option.value;
              const color = statusColors[option.value];

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  disabled={isUpdating}
                  className={`
                    flex items-center justify-center gap-2
                    min-h-[44px] px-3 py-2
                    rounded-lg border-2 transition-all
                    font-medium text-sm
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons - 44px touch targets */}
        <div className="flex gap-2">
          {/* Add Note Button */}
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowNoteInput(!showNoteInput)}
            className="flex-1 min-h-[44px]"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Note
          </Button>

          {/* Add Photo Button */}
          <label className="flex-1">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <span
              className="
                w-full inline-flex items-center justify-center
                px-4 py-2 min-h-[44px]
                font-medium rounded-lg
                bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400
                transition-colors duration-150 cursor-pointer
              "
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
              Photo
            </span>
          </label>
        </div>

        {/* Note Input */}
        {showNoteInput && (
          <div className="space-y-2 bg-gray-50 rounded-lg p-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter a note..."
              rows={3}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNoteInput(false);
                  setNote('');
                }}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleNoteSubmit}
                disabled={!note.trim()}
                className="min-h-[44px]"
              >
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Photo Preview & Caption */}
        {pendingPhoto && (
          <div className="space-y-2 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(pendingPhoto)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {pendingPhoto.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(pendingPhoto.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <input
              type="text"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="Add a caption (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePhotoCancel}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePhotoSubmit}
                className="min-h-[44px]"
              >
                Upload Photo
              </Button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {displayActivity.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Recent Activity
            </h3>
            <ul className="space-y-1.5">
              {displayActivity.map((event) => (
                <li key={event.id} className="text-sm text-gray-600 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {formatActivityEvent(event)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

export default ElementModal;
