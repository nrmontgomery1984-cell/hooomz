'use client';

/**
 * CustomerForm Component
 *
 * Form for creating and editing customers.
 * Includes duplicate detection when creating new customers.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, CreateCustomerInput } from '@hooomz/shared-contracts';
import { useCustomerService } from '@/lib/services/ServicesContext';
import { Button, Input, Select, Card, Modal, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface CustomerFormProps {
  mode: 'create' | 'edit';
  customer?: Customer;
}

const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'YT', label: 'Yukon' },
];

export function CustomerForm({ mode, customer }: CustomerFormProps) {
  const router = useRouter();
  const customerService = useCustomerService();
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CreateCustomerInput>({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    type: customer?.type || 'residential',
    company: customer?.company || '',
    address: customer?.address || {
      street: '',
      city: '',
      province: 'ON',
      postalCode: '',
      country: 'Canada',
    },
    tags: customer?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Duplicate detection state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [similarCustomers, setSimilarCustomers] = useState<Customer[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    setCheckingDuplicates(true);
    try {
      const response = await customerService.findSimilar({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      if (response.success && response.data && response.data.length > 0) {
        // Filter out the current customer when editing
        const similar = mode === 'edit'
          ? response.data.filter((c) => c.id !== customer?.id)
          : response.data;

        if (similar.length > 0) {
          setSimilarCustomers(similar);
          setShowDuplicateWarning(true);
          return false; // Stop submission
        }
      }
      return true; // No duplicates, proceed
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return true; // Proceed on error
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    // Check for duplicates only when creating
    if (mode === 'create') {
      const canProceed = await checkForDuplicates();
      if (!canProceed) {
        return; // Duplicate warning shown
      }
    }

    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      let response;
      if (mode === 'create') {
        response = await customerService.create(formData);
      } else {
        response = await customerService.update(customer!.id, formData);
      }

      if (response.success && response.data) {
        showToast(
          mode === 'create' ? 'Customer created successfully' : 'Customer updated successfully',
          'success'
        );
        router.push(`/customers/${response.data.id}`);
      } else {
        showToast('Failed to save customer', 'error');
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
      showToast('An error occurred while saving', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedDespiteDuplicate = () => {
    setShowDuplicateWarning(false);
    submitForm();
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
    <>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.firstName}
                required
                fullWidth
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={errors.lastName}
                required
                fullWidth
              />
            </div>

            <div className="mt-4">
              <Select
                label="Customer Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'residential' | 'commercial' })}
                fullWidth
                required
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </Select>
            </div>

            {formData.type === 'commercial' && (
              <div className="mt-4">
                <Input
                  label="Company Name"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  fullWidth
                />
              </div>
            )}
          </Card>

          {/* Contact Information */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
                fullWidth
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                helperText="Format: (XXX) XXX-XXXX"
                required
                fullWidth
              />
            </div>
          </Card>

          {/* Address */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
            <div className="space-y-4">
              <Input
                label="Street Address"
                value={formData.address?.street || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, street: e.target.value },
                  })
                }
                fullWidth
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address!, city: e.target.value },
                    })
                  }
                  fullWidth
                />
                <Select
                  label="Province"
                  value={formData.address?.province || 'ON'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address!, province: e.target.value },
                    })
                  }
                  fullWidth
                >
                  {CANADIAN_PROVINCES.map((prov) => (
                    <option key={prov.value} value={prov.value}>
                      {prov.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                label="Postal Code"
                value={formData.address?.postalCode || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address!, postalCode: e.target.value },
                  })
                }
                helperText="Format: A1A 1A1"
                fullWidth
              />
            </div>
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
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting || checkingDuplicates}
              >
                {mode === 'create' ? 'Create Customer' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      </form>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        title="Possible Duplicate Customer"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            We found {similarCustomers.length} similar customer{similarCustomers.length > 1 ? 's' : ''} in the system. Please review to avoid duplicates.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {similarCustomers.map((similar) => (
              <Card key={similar.id} className="bg-gray-50">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-900">
                    {similar.firstName} {similar.lastName}
                  </div>
                  {similar.company && (
                    <div className="text-sm text-gray-600">{similar.company}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {similar.email} • {similar.phone}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDuplicateWarning(false);
                      router.push(`/customers/${similar.id}`);
                    }}
                  >
                    View Customer
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setShowDuplicateWarning(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleProceedDespiteDuplicate}
              fullWidth
            >
              Create Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
