'use client';

/**
 * TaskForm Component
 *
 * Form for creating and editing tasks.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, CreateTaskInput } from '@hooomz/shared-contracts';
import { useSchedulingService } from '@/lib/services/ServicesContext';
import { Modal, Input, Select, Button, Card, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface TaskFormProps {
  mode: 'create' | 'edit';
  projectId?: string;
  task?: Task;
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
}

export function TaskForm({ mode, projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const router = useRouter();
  const schedulingService = useSchedulingService();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CreateTaskInput>({
    projectId: task?.projectId || projectId || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo || '',
    startDate: task?.startDate || '',
    dueDate: task?.dueDate || '',
    estimatedHours: task?.estimatedHours || 0,
    tags: task?.tags || [],
    dependencies: task?.dependencies || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }
    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.startDate) > new Date(formData.dueDate)) {
        newErrors.dueDate = 'Due date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (mode === 'create') {
        response = await schedulingService.createTask(formData);
      } else {
        response = await schedulingService.updateTask(task!.id, formData);
      }

      if (response.success && response.data) {
        showToast(
          mode === 'create' ? 'Task created successfully' : 'Task updated successfully',
          'success'
        );
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          router.push(`/projects/${response.data.projectId}/tasks`);
        }
      } else {
        showToast('Failed to save task', 'error');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      showToast('An error occurred while saving', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Task Details</h2>

          <div className="space-y-4">
            <Input
              label="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              placeholder="Enter task title"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe the task..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                fullWidth
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </Select>

              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
                fullWidth
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                fullWidth
              />

              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                error={errors.dueDate}
                fullWidth
              />
            </div>

            <Input
              label="Estimated Hours"
              type="number"
              value={formData.estimatedHours}
              onChange={(e) =>
                setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })
              }
              min="0"
              step="0.5"
              fullWidth
            />
          </div>
        </Card>

        {/* Assignment */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assignment</h2>

          <Input
            label="Assigned To"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            placeholder="Enter crew member name"
            fullWidth
          />
        </Card>

        {/* Tags */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                fullWidth
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                Add
              </Button>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Form Actions */}
        <Card>
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel || (() => router.back())}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
