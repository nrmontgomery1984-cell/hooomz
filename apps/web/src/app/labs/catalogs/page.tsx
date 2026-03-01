'use client';

/**
 * Labs Catalogs Page — products, techniques, tool methods
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsActiveProducts, useLabsActiveTechniques, useLabsToolMethods } from '@/lib/hooks/useLabsData';
import { SECTION_COLORS } from '@/lib/viewmode';

const LABS_COLOR = SECTION_COLORS.labs;

type CatalogTab = 'products' | 'techniques' | 'tools';

export default function CatalogsPage() {
  const [tab, setTab] = useState<CatalogTab>('products');
  const { data: products = [], isLoading: productsLoading } = useLabsActiveProducts();
  const { data: techniques = [], isLoading: techniquesLoading } = useLabsActiveTechniques();
  const { data: toolMethods = [], isLoading: toolsLoading } = useLabsToolMethods();

  const tabs: { key: CatalogTab; label: string; count: number }[] = [
    { key: 'products', label: 'Products', count: products.length },
    { key: 'techniques', label: 'Techniques', count: techniques.length },
    { key: 'tools', label: 'Tools', count: toolMethods.length },
  ];

  const isLoading = productsLoading || techniquesLoading || toolsLoading;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96, background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm hover:underline" style={{ color: LABS_COLOR }}>Labs</Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Catalogs</h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Products, techniques, and tools tracked by Labs</p>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4" style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', minHeight: 40,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: active ? `2px solid ${LABS_COLOR}` : '2px solid transparent',
                  color: active ? LABS_COLOR : 'var(--text-3)',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'color 150ms',
                }}
              >
                {t.label}
                <span style={{ fontSize: 10, color: active ? LABS_COLOR : 'var(--text-3)', opacity: 0.8 }}>({t.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading catalog...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tab === 'products' && products.map((p) => (
              <div key={p.id} className="p-3" style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.category}{p.brand ? ` · ${p.brand}` : ''}</p>
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex gap-1">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {tab === 'techniques' && techniques.map((t) => (
              <div key={t.id} className="p-3" style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t.category}</p>
                {t.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-3)' }}>{t.description}</p>
                )}
              </div>
            ))}

            {tab === 'tools' && toolMethods.map((t) => (
              <div key={t.id} className="p-3" style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.name}</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t.toolType}{t.brand ? ` · ${t.brand}` : ''}</p>
                {t.specification && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{t.specification}</p>
                )}
              </div>
            ))}

            {/* Empty states */}
            {tab === 'products' && products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No products in catalog</p>
              </div>
            )}
            {tab === 'techniques' && techniques.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No techniques in catalog</p>
              </div>
            )}
            {tab === 'tools' && toolMethods.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>No tools in catalog</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
