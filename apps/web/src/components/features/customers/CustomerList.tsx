'use client';

/**
 * CustomerList Component
 *
 * Display list of customers with search and filtering.
 * Touch-optimized grid layout for field use.
 */

import React, { useEffect, useState } from 'react';
import type { Customer } from '@hooomz/shared-contracts';
import { useCustomerService } from '@/lib/services/ServicesContext';
import { CustomerCard } from './CustomerCard';
import { CustomerSearch } from './CustomerSearch';
import { LoadingSpinner, Select } from '@/components/ui';

interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
}

export function CustomerList({ onSelectCustomer }: CustomerListProps) {
  const customerService = useCustomerService();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [customers, typeFilter, sortBy, sortOrder]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerService.list();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...customers];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'company':
          compareValue = (a.company || '').localeCompare(b.company || '');
          break;
        case 'createdAt':
          compareValue =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredCustomers(filtered);
  };

  const handleSearchSelect = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  const handleCardClick = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Loading customers..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <CustomerSearch
          onSelect={handleSearchSelect}
          placeholder="Search by name, email, phone, or company..."
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <Select
            label="Customer Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            fullWidth
          >
            <option value="all">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </Select>

          {/* Sort By */}
          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'company' | 'createdAt')}
            fullWidth
          >
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="createdAt">Date Added</option>
          </Select>

          {/* Sort Order */}
          <Select
            label="Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            fullWidth
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No customers found</div>
          <p className="text-gray-500">
            {typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first customer to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} onClick={() => handleCardClick(customer)}>
              <CustomerCard customer={customer} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
