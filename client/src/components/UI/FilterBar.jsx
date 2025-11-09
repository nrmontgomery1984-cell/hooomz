import { Search, X, Filter } from 'lucide-react'
import { colors, borderRadius, spacing } from '../../styles/design-tokens'
import { useState } from 'react'

/**
 * FilterBar Component
 * Modern filtering component with search and multi-select filters
 */
const FilterBar = ({
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  placeholder = 'Search...',
}) => {
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== 'all').length

  return (
    <div className="space-y-3">
      {/* Search and Filter Toggle */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            style={{
              fontSize: '0.875rem',
            }}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            style={{
              backgroundColor: showFilters ? colors.gray[50] : 'transparent',
            }}
          >
            <Filter size={18} />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-semibold text-white rounded-full"
                style={{
                  backgroundColor: colors.primary[500],
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div
          className="p-4 border border-gray-200 rounded-xl bg-gray-50"
          style={{
            borderRadius: borderRadius.xl,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || 'all'}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="all">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  filters.forEach(filter => {
                    onFilterChange(filter.key, 'all')
                  })
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <X size={14} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterBar
