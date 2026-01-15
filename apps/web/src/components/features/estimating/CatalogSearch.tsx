'use client';

/**
 * CatalogSearch Component
 *
 * Search materials and labor rates from catalog to quickly add to estimate.
 * Includes debounced search and category filtering.
 */

import React, { useState, useEffect } from 'react';
import type { CatalogItem } from '@hooomz/shared-contracts';
import { useEstimatingService } from '@/lib/services/ServicesContext';
import { Input, Card, Badge, LoadingSpinner, Select } from '@/components/ui';

interface CatalogSearchProps {
  onSelect: (item: CatalogItem) => void;
  placeholder?: string;
  className?: string;
}

export function CatalogSearch({
  onSelect,
  placeholder = 'Search catalog...',
  className = '',
}: CatalogSearchProps) {
  const estimatingService = useEstimatingService();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [results, setResults] = useState<CatalogItem[]>([]);
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
  }, [query, categoryFilter]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await estimatingService.searchCatalog(searchQuery, {
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      if (response.success && response.data) {
        setResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Catalog search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: CatalogItem) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect(item);
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'materials':
        return 'primary' as const;
      case 'labor':
        return 'warning' as const;
      case 'subcontractors':
        return 'info' as const;
      case 'equipment':
        return 'neutral' as const;
      default:
        return 'neutral' as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
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
        </div>

        {/* Category Filter */}
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          fullWidth
        >
          <option value="all">All Categories</option>
          <option value="materials">Materials</option>
          <option value="labor">Labor</option>
          <option value="subcontractors">Subcontractors</option>
          <option value="equipment">Equipment</option>
        </Select>
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card
          className="absolute top-full mt-2 w-full z-10 max-h-96 overflow-y-auto"
          shadow="lg"
        >
          <div className="divide-y divide-gray-200">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getCategoryVariant(item.category)} size="sm">
                        {item.category}
                      </Badge>
                      <span className="font-semibold text-gray-900">
                        {item.name}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>Default: {item.defaultQuantity} {item.unit}</span>
                      {item.supplier && <span>Supplier: {item.supplier}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </div>
                    <div className="text-xs text-gray-500">per {item.unit}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* No Results */}
      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <Card
          className="absolute top-full mt-2 w-full z-10"
          shadow="lg"
        >
          <div className="px-4 py-6 text-center text-gray-500">
            No catalog items found
            {categoryFilter !== 'all' && (
              <span> in {categoryFilter}</span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
