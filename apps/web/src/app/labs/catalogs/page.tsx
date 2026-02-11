'use client';

/**
 * Labs Catalogs Page — products, techniques, tool methods
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLabsActiveProducts, useLabsActiveTechniques, useLabsToolMethods } from '@/lib/hooks/useLabsData';

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
    <div className="min-h-screen pb-24" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/labs" className="text-sm text-teal-700 hover:underline">Labs</Link>
            <span className="text-xs text-gray-400">/</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Catalogs</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Products, techniques, and tools tracked by Labs</p>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-0">
          <div className="flex border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-teal-700 text-teal-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label} <span className="text-xs text-gray-400 ml-1">({t.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
            <p className="text-sm text-gray-400">Loading catalog...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tab === 'products' && products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-500">{p.category}{p.brand ? ` · ${p.brand}` : ''}</p>
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex gap-1">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {tab === 'techniques' && techniques.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500">{t.category}</p>
                {t.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                )}
              </div>
            ))}

            {tab === 'tools' && toolMethods.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500">{t.toolType}{t.brand ? ` · ${t.brand}` : ''}</p>
                {t.specification && (
                  <p className="text-xs text-gray-400 mt-1">{t.specification}</p>
                )}
              </div>
            ))}

            {/* Empty states */}
            {tab === 'products' && products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No products in catalog</p>
              </div>
            )}
            {tab === 'techniques' && techniques.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No techniques in catalog</p>
              </div>
            )}
            {tab === 'tools' && toolMethods.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No tools in catalog</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
