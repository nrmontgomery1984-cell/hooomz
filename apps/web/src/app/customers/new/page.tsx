'use client';

/**
 * New Customer Page
 *
 * Create a new customer with duplicate detection.
 */

import React from 'react';
import { CustomerForm } from '@/components/features/customers';

export default function NewCustomerPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Customer</h1>
        <p className="text-gray-600 mt-1">
          Enter customer details to get started
        </p>
      </div>

      {/* Customer Form */}
      <CustomerForm mode="create" />
    </div>
  );
}
