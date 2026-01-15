'use client';

/**
 * Edit Customer Page
 *
 * Edit existing customer information.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer } from '@hooomz/shared-contracts';
import { useCustomerService } from '@/lib/services/ServicesContext';
import { Button, LoadingSpinner, Card } from '@/components/ui';
import { CustomerForm } from '@/components/features/customers';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerService = useCustomerService();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const customerId = params.id as string;

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerService.get(customerId);
      if (response.success && response.data) {
        setCustomer(response.data);
      } else {
        setError('Customer not found');
      }
    } catch (err) {
      console.error('Failed to load customer:', err);
      setError('Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="lg" text="Loading customer..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Customer Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              The customer you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="primary" onClick={() => router.push('/customers')}>
              Back to Customers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/customers/${customerId}`)}
        className="mb-4"
      >
        ← Back to Customer
      </Button>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Customer
        </h1>
        <p className="text-gray-600 mt-1">
          Update customer information
        </p>
      </div>

      {/* Customer Form */}
      <CustomerForm mode="edit" customer={customer} />
    </div>
  );
}
