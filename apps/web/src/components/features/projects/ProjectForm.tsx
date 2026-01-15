'use client';

/**
 * ProjectForm Component
 *
 * Create and edit project form with validation.
 * Large touch-friendly inputs for field use.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, CreateProject } from '@hooomz/shared-contracts';
import { useProjectService } from '@/lib/services/ServicesContext';
import { Input, Select, Button, Card } from '@/components/ui';

interface ProjectFormProps {
  project?: Project;
  mode: 'create' | 'edit';
}

export function ProjectForm({ project, mode }: ProjectFormProps) {
  const router = useRouter();
  const projectService = useProjectService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    projectType: project?.projectType || 'residential',
    status: project?.status || 'planning',
    clientId: project?.clientId || '',

    // Address
    street: project?.address.street || '',
    city: project?.address.city || '',
    province: project?.address.province || 'NB',
    postalCode: project?.address.postalCode || '',
    country: project?.address.country || 'Canada',

    // Budget
    estimatedCost: project?.budget.estimatedCost?.toString() || '',
    actualCost: project?.budget.actualCost?.toString() || '0',

    // Dates
    startDate: project?.dates.startDate || '',
    estimatedEndDate: project?.dates.estimatedEndDate || '',
    actualEndDate: project?.dates.actualEndDate || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }

    if (!formData.estimatedCost || parseFloat(formData.estimatedCost) <= 0) {
      newErrors.estimatedCost = 'Estimated cost must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData: CreateProject = {
        name: formData.name,
        description: formData.description || undefined,
        projectType: formData.projectType as any,
        status: formData.status as any,
        clientId: formData.clientId || 'temp-client', // TODO: Implement customer selection
        address: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        budget: {
          estimatedCost: parseFloat(formData.estimatedCost),
          actualCost: parseFloat(formData.actualCost) || 0,
        },
        dates: {
          startDate: formData.startDate || undefined,
          estimatedEndDate: formData.estimatedEndDate || undefined,
          actualEndDate: formData.actualEndDate || undefined,
        },
      };

      if (mode === 'create') {
        const response = await projectService.create(projectData);
        if (response.success && response.data) {
          router.push(`/projects/${response.data.id}`);
        }
      } else if (project) {
        const response = await projectService.update(project.id, projectData);
        if (response.success) {
          router.push(`/projects/${project.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      setErrors({ submit: 'Failed to save project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <Input
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            fullWidth
            placeholder="e.g., Kitchen Renovation"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Project Type"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              required
              fullWidth
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="renovation">Renovation</option>
              <option value="new-construction">New Construction</option>
            </Select>

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              fullWidth
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="Project description..."
            />
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
        <div className="space-y-4">
          <Input
            label="Street Address"
            name="street"
            value={formData.street}
            onChange={handleChange}
            error={errors.street}
            required
            fullWidth
            placeholder="123 Main St"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
              required
              fullWidth
              placeholder="Fredericton"
            />

            <Select
              label="Province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              fullWidth
            >
              <option value="NB">New Brunswick</option>
              <option value="NS">Nova Scotia</option>
              <option value="PE">Prince Edward Island</option>
              <option value="NL">Newfoundland and Labrador</option>
              <option value="QC">Quebec</option>
              <option value="ON">Ontario</option>
              <option value="MB">Manitoba</option>
              <option value="SK">Saskatchewan</option>
              <option value="AB">Alberta</option>
              <option value="BC">British Columbia</option>
              <option value="YT">Yukon</option>
              <option value="NT">Northwest Territories</option>
              <option value="NU">Nunavut</option>
            </Select>

            <Input
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              error={errors.postalCode}
              required
              fullWidth
              placeholder="E3B 1A1"
            />
          </div>
        </div>
      </Card>

      {/* Budget */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Budget</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Estimated Cost"
            name="estimatedCost"
            type="number"
            step="0.01"
            value={formData.estimatedCost}
            onChange={handleChange}
            error={errors.estimatedCost}
            required
            fullWidth
            placeholder="50000.00"
          />

          {mode === 'edit' && (
            <Input
              label="Actual Cost"
              name="actualCost"
              type="number"
              step="0.01"
              value={formData.actualCost}
              onChange={handleChange}
              fullWidth
              placeholder="0.00"
            />
          )}
        </div>
      </Card>

      {/* Dates */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            fullWidth
          />

          <Input
            label="Estimated End Date"
            name="estimatedEndDate"
            type="date"
            value={formData.estimatedEndDate}
            onChange={handleChange}
            fullWidth
          />

          {mode === 'edit' && (
            <Input
              label="Actual End Date"
              name="actualEndDate"
              type="date"
              value={formData.actualEndDate}
              onChange={handleChange}
              fullWidth
            />
          )}
        </div>
      </Card>

      {/* Error message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          fullWidth
        >
          {mode === 'create' ? 'Create Project' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={isSubmitting}
          fullWidth
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
