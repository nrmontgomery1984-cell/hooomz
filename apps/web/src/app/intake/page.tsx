'use client';

/**
 * Intake Page - Entry point for project intake flows
 *
 * Presents two options:
 * 1. Homeowner Intake - 4-step wizard (client, bundle, rooms, notes)
 * 2. Contractor Intake - 4-step efficient wizard (trade-organized)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { IntakeWizard } from '@/components/intake/IntakeWizard';
import { ContractorIntakeWizard } from '@/components/intake/ContractorIntakeWizard';
import type { HomeownerIntakeData, ContractorIntakeData } from '@/lib/types/intake.types';
import { useServicesContext } from '@/lib/services/ServicesContext';
import { createIntakeService } from '@/lib/services/intake.service';

type IntakeMode = 'select' | 'homeowner' | 'contractor';

export default function IntakePage() {
  const router = useRouter();
  const { services, isLoading } = useServicesContext();
  const [mode, setMode] = useState<IntakeMode>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleHomeownerComplete = async (data: HomeownerIntakeData) => {
    if (!services) {
      setError('Services not initialized');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const intakeService = createIntakeService(services);
      const result = await intakeService.processHomeownerIntake(data);

      console.log('Homeowner intake complete:', result);

      // Redirect to the newly created project
      router.push(`/projects/${result.project_id}`);
    } catch (err) {
      console.error('Error processing homeowner intake:', err);
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleContractorComplete = async (data: ContractorIntakeData) => {
    if (!services) {
      setError('Services not initialized');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const intakeService = createIntakeService(services);
      const result = await intakeService.processContractorIntake(data);

      console.log('Contractor intake complete:', result);

      // Redirect to the newly created project
      router.push(`/projects/${result.project_id}`);
    } catch (err) {
      console.error('Error processing contractor intake:', err);
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mode !== 'select') {
      setMode('select');
    } else {
      router.back();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p style={{ color: '#6B7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F3F4F6' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#E5E7EB', borderTopColor: '#0F766E' }} />
          <p style={{ color: '#6B7280' }}>Creating your project...</p>
        </div>
      </div>
    );
  }

  // Show the appropriate wizard based on mode
  if (mode === 'homeowner') {
    return <IntakeWizard onComplete={handleHomeownerComplete} onCancel={handleCancel} />;
  }

  if (mode === 'contractor') {
    return <ContractorIntakeWizard onComplete={handleContractorComplete} onCancel={handleCancel} />;
  }

  // Selection screen
  return (
    <PageErrorBoundary>
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center text-sm font-medium"
            style={{ color: '#6B7280' }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="rounded-xl p-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Start a New Project</h1>
          <p style={{ color: '#6B7280' }}>Choose how you&apos;d like to get started</p>
        </div>

        <div className="space-y-4">
          {/* Homeowner Option */}
          <button
            onClick={() => setMode('homeowner')}
            disabled={!services}
            className="w-full p-6 rounded-2xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#F0FDFA', color: '#0F766E' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#111827' }}>I&apos;m a Homeowner</h2>
                <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                  Choose your bundle, pick your rooms, and we&apos;ll set everything up.
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                  <span className="px-2 py-0.5 rounded" style={{ background: '#F3F4F6' }}>4 steps</span>
                  <span>·</span>
                  <span>Bundle-based</span>
                </div>
              </div>
            </div>
          </button>

          {/* Contractor Option */}
          <button
            onClick={() => setMode('contractor')}
            disabled={!services}
            className="w-full p-6 rounded-2xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1" style={{ color: '#111827' }}>I&apos;m a Contractor</h2>
                <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                  Set up a project with trade-organized scope. Perfect for estimates and scheduling.
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                  <span className="px-2 py-0.5 rounded" style={{ background: '#F3F4F6' }}>4 steps</span>
                  <span>·</span>
                  <span>Trade-organized</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 rounded-xl p-4" style={{ background: '#F0FDFA' }}>
          <p className="text-sm" style={{ color: '#0F766E' }}>
            <strong>Tip:</strong> Both flows create the same project structure. Choose the one that
            matches how you prefer to work. You can always add details later.
          </p>
        </div>
      </div>
    </div>
    </PageErrorBoundary>
  );
}
