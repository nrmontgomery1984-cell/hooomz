'use client';

/**
 * Vendor Management — /admin/vendors
 * CRUD on vendors, view type, merge duplicates (future).
 */

import { useState } from 'react';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { Plus, X, Pencil, Trash2, Search } from 'lucide-react';
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '@/lib/hooks/useExpenseTracker';
import type { Vendor } from '@/lib/hooks/useExpenseTracker';

const TYPE_OPTIONS: { value: Vendor['type']; label: string }[] = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  supplier: { bg: 'rgba(74,127,165,0.1)', text: 'var(--blue)' },
  retailer: { bg: 'rgba(22,163,74,0.1)', text: 'var(--green)' },
  subcontractor: { bg: 'rgba(217,119,6,0.1)', text: 'var(--amber)' },
  other: { bg: 'var(--bg)', text: 'var(--muted)' },
};

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Vendor['type']>('retailer');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = search
    ? vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()))
    : vendors;

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  function openAdd() {
    setFormName('');
    setFormType('retailer');
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(v: Vendor) {
    setFormName(v.name);
    setFormType(v.type);
    setEditingId(v.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    if (editingId) {
      await updateVendor.mutateAsync({ id: editingId, data: { name: formName.trim(), type: formType } });
    } else {
      await createVendor.mutateAsync({ name: formName.trim(), type: formType, createdBy: 'nathan' });
    }
    setShowForm(false);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deleteVendor.mutateAsync(id);
    setConfirmDelete(null);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
  };

  return (
    <PageErrorBoundary>
      <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>Vendors</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} — suppliers, retailers, and subcontractors
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 mt-4 space-y-3">
          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendors..."
                className="w-full h-10 pl-9 pr-3 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>
            <button
              onClick={openAdd}
              className="h-10 px-4 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.04em] text-white"
              style={{ fontFamily: 'var(--font-mono)', background: 'var(--charcoal)', border: 'none' }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Inline Form */}
          {showForm && (
            <div className="p-4" style={{ background: 'var(--surface)', border: '2px solid var(--charcoal)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
                  {editingId ? 'Edit Vendor' : 'Add Vendor'}
                </span>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} style={{ color: 'var(--muted)' }} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Kent Building Supplies"
                    className="w-full h-10 px-3 text-sm mt-1"
                    style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--charcoal)', outline: 'none' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <div className="flex gap-2 mt-1">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormType(opt.value)}
                        className="flex-1 h-10 text-[10px] font-medium tracking-[0.04em] uppercase"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          background: formType === opt.value ? 'var(--charcoal)' : 'var(--surface)',
                          color: formType === opt.value ? '#fff' : 'var(--muted)',
                          border: `1px solid ${formType === opt.value ? 'var(--charcoal)' : 'var(--border)'}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 h-10 text-[11px] font-medium"
                    style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formName.trim() || createVendor.isPending || updateVendor.isPending}
                    className="flex-1 h-10 text-[11px] font-medium text-white"
                    style={{ fontFamily: 'var(--font-mono)', background: 'var(--green)', border: 'none', opacity: formName.trim() ? 1 : 0.5 }}
                  >
                    {createVendor.isPending || updateVendor.isPending ? 'Saving...' : editingId ? 'Update' : 'Add Vendor'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading vendors...</p>
            </div>
          )}

          {/* Vendor List */}
          {!isLoading && sorted.length === 0 && (
            <div className="text-center py-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {search ? 'No vendors match your search' : 'No vendors yet — add your first one'}
              </p>
            </div>
          )}

          {sorted.map((v) => {
            const tc = TYPE_COLORS[v.type] || TYPE_COLORS.other;
            return (
              <div
                key={v.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>{v.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-medium uppercase tracking-[0.06em] px-1.5 py-0.5"
                      style={{ fontFamily: 'var(--font-mono)', background: tc.bg, color: tc.text, border: `1px solid ${tc.text}20` }}
                    >
                      {v.type}
                    </span>
                    <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                      {v.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(v)}
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                {confirmDelete === v.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="h-8 px-2 text-[9px] font-medium uppercase text-white"
                      style={{ fontFamily: 'var(--font-mono)', background: 'var(--red)', border: 'none' }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="h-8 px-2 text-[9px] font-medium"
                      style={{ fontFamily: 'var(--font-mono)', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(v.id)}
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
