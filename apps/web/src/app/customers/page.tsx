'use client';

/**
 * Customer List — /customers
 *
 * Platform-level customer records. All statuses, full filter tabs.
 * Reads from customers_v2 IndexedDB store. Does NOT touch legacy customers store.
 */

import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { CustomerListView } from '@/components/customers/CustomerListView';
import { SECTION_COLORS } from '@/lib/viewmode';

export default function CustomerListPage() {
  return (
    <PageErrorBoundary>
      <CustomerListView
        color={SECTION_COLORS.customers}
        title="Customers"
        subtitle="All customer records"
        showFilterTabs
        showNewButton
      />
    </PageErrorBoundary>
  );
}
