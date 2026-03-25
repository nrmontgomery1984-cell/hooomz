'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

function PageErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--surface-2)' }}>
      <div className="bg-[var(--surface)] rounded-xl p-8 max-w-sm w-full text-center" style={{ border: '1px solid var(--border)' }}>
        <AlertTriangle size={32} className="mx-auto mb-4" style={{ color: 'var(--red)' }} />
        <h1 className="text-lg font-bold mb-1" style={{ color: 'var(--charcoal)' }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          This page encountered an error. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--mid)' }}
          >
            Go Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={<PageErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}
