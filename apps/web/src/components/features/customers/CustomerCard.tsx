'use client';

/**
 * CustomerCard Component
 *
 * Summary card for a customer with contact information.
 * Touch-optimized for field use.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@hooomz/shared-contracts';
import { Card, Badge } from '@/components/ui';

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const router = useRouter();

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

  const formatPhoneNumber = (phone: string) => {
    // Format as (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Card
      interactive
      onClick={() => router.push(`/customers/${customer.id}`)}
      className="hover:border-primary-300 transition-colors"
    >
      <div className="flex flex-col gap-3">
        {/* Header with name and type */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h3>
            {customer.company && (
              <p className="text-sm text-gray-600 mt-1">{customer.company}</p>
            )}
          </div>
          <Badge variant={getCustomerTypeVariant(customer.type)}>
            {customer.type}
          </Badge>
        </div>

        {/* Contact information */}
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
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
            <span className="break-all">{customer.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
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
            <span>{formatPhoneNumber(customer.phone)}</span>
          </div>

          {customer.address && (
            <div className="flex items-start gap-2">
              <svg
                className="h-4 w-4 flex-shrink-0 mt-0.5"
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
              <span>
                {customer.address.city}, {customer.address.province}
              </span>
            </div>
          )}
        </div>

        {/* Tags if available */}
        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="neutral" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
