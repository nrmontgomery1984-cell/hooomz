'use client';

/**
 * CustomerDetail Component
 *
 * Full customer details with project history.
 * Shows all projects associated with this customer.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, Project } from '@hooomz/shared-contracts';
import { useProjectService } from '@/lib/services/ServicesContext';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui';

interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const router = useRouter();
  const projectService = useProjectService();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [customer.id]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await projectService.listByCustomer(customer.id);
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const getCustomerTypeVariant = (type: string) => {
    switch (type) {
      case 'residential':
        return 'primary' as const;
      case 'commercial':
        return 'info' as const;
      default:
        return 'neutral' as const;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'planning':
        return 'info' as const;
      case 'in-progress':
        return 'warning' as const;
      case 'on-hold':
        return 'neutral' as const;
      case 'completed':
        return 'success' as const;
      case 'cancelled':
        return 'error' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge variant={getCustomerTypeVariant(customer.type)}>
                {customer.type}
              </Badge>
            </div>
            {customer.company && (
              <p className="text-lg text-gray-600">{customer.company}</p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/customers/${customer.id}/edit`)}
          >
            Edit Customer
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500">Email</div>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-gray-900 hover:text-primary-600"
                >
                  {customer.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500">Phone</div>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-gray-900 hover:text-primary-600"
                >
                  {formatPhoneNumber(customer.phone)}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* Address */}
        {customer.address && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="text-gray-900">
                {customer.address.street && (
                  <div>{customer.address.street}</div>
                )}
                <div>
                  {customer.address.city}, {customer.address.province}{' '}
                  {customer.address.postalCode}
                </div>
                <div>{customer.address.country}</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tags */}
      {customer.tags && customer.tags.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Project History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Project History</h2>
          <Button
            variant="primary"
            onClick={() => router.push(`/projects/new?customerId=${customer.id}`)}
          >
            New Project
          </Button>
        </div>

        {isLoadingProjects ? (
          <div className="py-8">
            <LoadingSpinner size="md" text="Loading projects..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Button
              variant="secondary"
              onClick={() => router.push(`/projects/new?customerId=${customer.id}`)}
            >
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                interactive
                onClick={() => router.push(`/projects/${project.id}`)}
                className="hover:border-primary-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <Badge variant={getStatusVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {project.startDate && (
                        <div>Start: {formatDate(project.startDate)}</div>
                      )}
                      {project.estimatedCost && (
                        <div>Budget: {formatCurrency(project.estimatedCost)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Customer ID:</span>
            <div className="text-gray-900 font-mono text-xs mt-1">{customer.id}</div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Created:</span>
            <div className="text-gray-900 mt-1">{formatDate(customer.createdAt)}</div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Last Updated:</span>
            <div className="text-gray-900 mt-1">{formatDate(customer.updatedAt)}</div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Total Projects:</span>
            <div className="text-gray-900 mt-1">{projects.length}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
