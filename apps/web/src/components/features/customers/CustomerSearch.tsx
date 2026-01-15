'use client';

/**
 * CustomerSearch Component
 *
 * Search input with live results.
 * Searches by name, email, phone, company.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@hooomz/shared-contracts';
import { useCustomerService } from '@/lib/services/ServicesContext';
import { Input, Card, LoadingSpinner } from '@/components/ui';

interface CustomerSearchProps {
  onSelect?: (customer: Customer) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSearch({
  onSelect,
  placeholder = 'Search customers...',
  className = '',
}: CustomerSearchProps) {
  const customerService = useCustomerService();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await customerService.search(searchQuery);
      if (response.success && response.data) {
        setResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (customer: Customer) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect?.(customer);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        fullWidth
      />

      {isSearching && (
        <div className="absolute right-3 top-3">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {showResults && results.length > 0 && (
        <Card
          className="absolute top-full mt-2 w-full z-10 max-h-96 overflow-y-auto"
          shadow="lg"
        >
          <div className="divide-y divide-gray-200">
            {results.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
              >
                <div className="font-semibold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </div>
                {customer.company && (
                  <div className="text-sm text-gray-600">{customer.company}</div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {customer.email} • {customer.phone}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <Card
          className="absolute top-full mt-2 w-full z-10"
          shadow="lg"
        >
          <div className="px-4 py-6 text-center text-gray-500">
            No customers found
          </div>
        </Card>
      )}
    </div>
  );
}
