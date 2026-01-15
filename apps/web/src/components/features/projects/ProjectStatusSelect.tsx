'use client';

/**
 * ProjectStatusSelect Component
 *
 * Dropdown to change project status with confirmation modal.
 * Prevents accidental status changes with confirmation dialog.
 */

import React, { useState } from 'react';
import { Badge, Modal, Button } from '@/components/ui';

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', variant: 'info' as const },
  { value: 'in-progress', label: 'In Progress', variant: 'warning' as const },
  { value: 'on-hold', label: 'On Hold', variant: 'neutral' as const },
  { value: 'completed', label: 'Completed', variant: 'success' as const },
  { value: 'cancelled', label: 'Cancelled', variant: 'neutral' as const },
];

interface ProjectStatusSelectProps {
  projectId: string;
  currentStatus: string;
  onStatusChange?: (projectId: string, newStatus: string) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

export function ProjectStatusSelect({
  projectId,
  currentStatus,
  onStatusChange,
  size = 'md',
}: ProjectStatusSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatusConfig = PROJECT_STATUSES.find(
    (s) => s.value === currentStatus
  ) || PROJECT_STATUSES[0];

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, you might show a dropdown here
    // For simplicity, we'll cycle through statuses
    const currentIndex = PROJECT_STATUSES.findIndex((s) => s.value === currentStatus);
    const nextIndex = (currentIndex + 1) % PROJECT_STATUSES.length;
    const nextStatus = PROJECT_STATUSES[nextIndex];

    setPendingStatus(nextStatus.value);
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingStatus || !onStatusChange) return;

    setIsUpdating(true);
    try {
      await onStatusChange(projectId, pendingStatus);
      setIsModalOpen(false);
      setPendingStatus(null);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setPendingStatus(null);
  };

  const pendingStatusConfig = PROJECT_STATUSES.find(
    (s) => s.value === pendingStatus
  );

  return (
    <>
      <div onClick={handleStatusClick}>
        <Badge
          variant={currentStatusConfig.variant}
          size={size}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          {currentStatusConfig.label}
        </Badge>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Change Project Status"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Change status from{' '}
            <span className="font-semibold">{currentStatusConfig.label}</span> to{' '}
            <span className="font-semibold">{pendingStatusConfig?.label}</span>?
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleConfirm}
              loading={isUpdating}
              fullWidth
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isUpdating}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
