'use client';

/**
 * BottomSheet — Slide-up panel for in-context detail views
 *
 * Half-screen sheet that slides up from the bottom. Used for viewing
 * SOP details and lab evidence without navigating away from the project.
 */

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg animate-slide-up"
        style={{
          background: '#FFFFFF',
          borderRadius: '16px 16px 0 0',
          maxHeight: '85vh',
          minHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{ width: 36, height: 4, background: '#D1D5DB' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          {title && (
            <h2 className="text-sm font-semibold" style={{ color: '#111827' }}>
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
            aria-label="Close"
          >
            <X size={20} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#E5E7EB' }} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>

      {/* Slide-up animation */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 250ms ease-out;
        }
      `}</style>
    </div>
  );
}
