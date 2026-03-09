'use client';

/**
 * IAQ Report — Data Ingestion Page
 *
 * Upload AirGradient CSV exports, enter project metadata,
 * compute IAQ metrics, and generate a branded report.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorBoundary } from '@/components/ui/PageErrorBoundary';
import { useToast } from '@/components/ui/Toast';
import { useSaveIAQReport } from '@/lib/hooks/useIAQReports';
import {
  parseAirGradientCSV,
  computeDailySummaries,
  computeMetrics,
  computeHealthScore,
  deriveRating,
  derivePhases,
} from '@/lib/types/iaqReport.types';
import type { IAQReport, CSVParseResult } from '@/lib/types/iaqReport.types';

// ============================================================================
// Page
// ============================================================================

export default function IAQNewReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const saveMutation = useSaveIAQReport();

  // Form state
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [monitoringStart, setMonitoringStart] = useState('');
  const [monitoringEnd, setMonitoringEnd] = useState('');
  const [indoorSerial, setIndoorSerial] = useState('');
  const [outdoorSerial, setOutdoorSerial] = useState('');
  const [twoUnit, setTwoUnit] = useState(false);

  // CSV state
  const [indoorCSV, setIndoorCSV] = useState<CSVParseResult | null>(null);
  const [indoorFileName, setIndoorFileName] = useState('');
  const [outdoorCSV, setOutdoorCSV] = useState<CSVParseResult | null>(null);
  const [outdoorFileName, setOutdoorFileName] = useState('');
  const [csvError, setCsvError] = useState('');
  const [outdoorCsvError, setOutdoorCsvError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const isValid = useMemo(() => {
    return (
      clientName.trim() !== '' &&
      address.trim() !== '' &&
      projectName.trim() !== '' &&
      monitoringStart !== '' &&
      monitoringEnd !== '' &&
      indoorCSV !== null &&
      indoorCSV.rows.length > 0 &&
      !indoorCSV.error
    );
  }, [clientName, address, projectName, monitoringStart, monitoringEnd, indoorCSV]);

  // Handlers
  function handleIndoorCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    setIndoorFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseAirGradientCSV(text);
      if (result.error) {
        setCsvError(result.error);
        setIndoorCSV(null);
      } else {
        setIndoorCSV(result);
      }
    };
    reader.readAsText(file);
  }

  function handleOutdoorCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOutdoorCsvError('');
    setOutdoorFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseAirGradientCSV(text);
      if (result.error) {
        setOutdoorCsvError(result.error);
        setOutdoorCSV(null);
      } else {
        setOutdoorCSV(result);
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!isValid || !indoorCSV) return;
    setSubmitting(true);

    try {
      const dailySummaries = computeDailySummaries(indoorCSV.rows);
      const metrics = computeMetrics(indoorCSV.rows);
      const phases = derivePhases(monitoringStart, monitoringEnd);

      const partialReport = {
        co2: metrics.co2,
        pm25: metrics.pm25,
        voc: metrics.voc,
        humidity: metrics.humidity,
        nox: metrics.nox,
      };
      const healthScore = computeHealthScore(partialReport);
      const healthRating = deriveRating(healthScore);

      let outdoorDailySummaries;
      if (outdoorCSV && outdoorCSV.rows.length > 0) {
        outdoorDailySummaries = computeDailySummaries(outdoorCSV.rows);
      }

      const report: IAQReport = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        clientName: clientName.trim(),
        address: address.trim(),
        projectName: projectName.trim(),
        monitoringStart,
        monitoringEnd,
        indoorSerial: indoorSerial.trim(),
        outdoorSerial: outdoorSerial.trim() || undefined,
        co2: metrics.co2,
        pm25: metrics.pm25,
        voc: metrics.voc,
        nox: metrics.nox,
        humidity: metrics.humidity,
        temperature: metrics.temperature,
        healthScore,
        healthRating,
        phases,
        dailySummaries,
        outdoorDailySummaries,
      };

      await saveMutation.mutateAsync(report);
      showToast({ message: 'IAQ Report generated', variant: 'success' });
      router.push(`/labs/iaq/${report.id}`);
    } catch (err) {
      showToast({ message: 'Failed to generate report', variant: 'error' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '16px 32px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 4 }}>
              Labs › IAQ Reports › New Report
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-1)', margin: 0 }}>
              Generate IAQ Report
            </h1>
          </div>
        </div>

        {/* Two-pane layout */}
        <div style={{ display: 'flex', gap: 24, padding: '24px 32px' }}>

          {/* Left — Form */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Section 1 — Project Info */}
            <FormSection title="Project Info">
              <FormField label="Client Name" required>
                <TextInput value={clientName} onChange={setClientName} placeholder="e.g. Arsenault" />
              </FormField>
              <FormField label="Address" required>
                <TextInput value={address} onChange={setAddress} placeholder="e.g. 42 Coverdale Rd, Moncton NB" />
              </FormField>
              <FormField label="Project Name" required>
                <TextInput value={projectName} onChange={setProjectName} placeholder="e.g. Main Floor Refresh" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Monitoring Start" required>
                  <DateInput value={monitoringStart} onChange={setMonitoringStart} />
                </FormField>
                <FormField label="Monitoring End" required>
                  <DateInput value={monitoringEnd} onChange={setMonitoringEnd} />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2 — Monitor Setup */}
            <FormSection title="Monitor Setup">
              <FormField label="Indoor Unit Serial">
                <TextInput value={indoorSerial} onChange={setIndoorSerial} placeholder="e.g. I-9PSL-XXXX" />
              </FormField>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <ToggleButton active={!twoUnit} onClick={() => setTwoUnit(false)} label="One unit (indoor only)" />
                <ToggleButton active={twoUnit} onClick={() => setTwoUnit(true)} label="Two units (indoor + outdoor)" />
              </div>
              {twoUnit && (
                <FormField label="Outdoor Unit Serial">
                  <TextInput value={outdoorSerial} onChange={setOutdoorSerial} placeholder="e.g. O-1PST-XXXX" />
                </FormField>
              )}
            </FormSection>

            {/* Section 3 — CSV Upload */}
            <FormSection title="CSV Upload">
              <FormField label="Indoor CSV" required>
                <FileDropZone
                  onFileChange={handleIndoorCSV}
                  fileName={indoorFileName}
                  rowCount={indoorCSV?.rows.length}
                  error={csvError}
                />
              </FormField>
              {twoUnit && (
                <FormField label="Outdoor CSV">
                  <FileDropZone
                    onFileChange={handleOutdoorCSV}
                    fileName={outdoorFileName}
                    rowCount={outdoorCSV?.rows.length}
                    error={outdoorCsvError}
                  />
                </FormField>
              )}
            </FormSection>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              style={{
                padding: '12px 32px',
                borderRadius: 6,
                border: 'none',
                background: isValid && !submitting ? 'var(--clay)' : 'var(--border)',
                color: isValid && !submitting ? '#fff' : 'var(--text-3)',
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
                minHeight: 44,
                marginTop: 8,
              }}
            >
              {submitting ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {/* Right — Preview Card */}
          <div className="hidden md:block" style={{ width: 300, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 24 }}>
              <SectionHeader title="Preview" />
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 16,
              }}>
                <PreviewRow label="Client" value={clientName || '—'} />
                <PreviewRow label="Project" value={projectName || '—'} />
                <PreviewRow label="Address" value={address || '—'} />
                <PreviewRow label="Period" value={monitoringStart && monitoringEnd ? `${monitoringStart} → ${monitoringEnd}` : '—'} />
                <PreviewRow label="Indoor unit" value={indoorSerial || '—'} />
                <PreviewRow label="CSV" value={indoorFileName || 'not loaded'} />
                <PreviewRow label="Rows" value={indoorCSV ? `${indoorCSV.rows.length} readings detected` : '—'} />
                {twoUnit && (
                  <>
                    <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                    <PreviewRow label="Outdoor unit" value={outdoorSerial || '—'} />
                    <PreviewRow label="Outdoor CSV" value={outdoorFileName || 'not loaded'} />
                    <PreviewRow label="Outdoor rows" value={outdoorCSV ? `${outdoorCSV.rows.length} readings` : '—'} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-cond)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        {title}
      </span>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader title={title} />
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 4,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text-1)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        outline: 'none',
        minHeight: 36,
      }}
    />
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 4,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        color: 'var(--text-1)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        outline: 'none',
        minHeight: 36,
      }}
    />
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 4,
        border: `1px solid ${active ? 'var(--clay)' : 'var(--border)'}`,
        background: active ? 'var(--clay)' : 'var(--surface-1)',
        color: active ? '#fff' : 'var(--text-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        minHeight: 32,
      }}
    >
      {label}
    </button>
  );
}

function FileDropZone({ onFileChange, fileName, rowCount, error }: {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileName?: string;
  rowCount?: number;
  error?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px',
          borderRadius: 4,
          border: `2px dashed ${error ? 'var(--red)' : 'var(--border)'}`,
          background: 'var(--bg)',
          cursor: 'pointer',
          textAlign: 'center',
          minHeight: 80,
        }}
      >
        <input type="file" accept=".csv" onChange={onFileChange} style={{ display: 'none' }} />
        {fileName ? (
          <>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-1)', fontWeight: 500 }}>{fileName}</span>
            {rowCount !== undefined && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>{rowCount} readings detected</span>
            )}
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-3)' }}>
            Drop AirGradient CSV export here or click to browse
          </span>
        )}
      </label>
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-1)', marginTop: 1 }}>{value}</div>
    </div>
  );
}
