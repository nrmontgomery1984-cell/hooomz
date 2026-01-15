'use client';

/**
 * Customers List Page
 *
 * View all customers with search and filtering.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { CustomerList } from '@/components/features/customers';

export default function CustomersPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer contacts</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/customers/new')}>
          New Customer
        </Button>
      </div>

      {/* Customer List */}
      <CustomerList onSelectCustomer={(customer) => router.push(`/customers/${customer.id}`)} />
    </div>
  );
}
