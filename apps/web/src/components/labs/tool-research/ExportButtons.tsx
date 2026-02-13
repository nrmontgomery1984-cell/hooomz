'use client';

const NAVY = '#1B2A4A';

interface ExportButtonsProps {
  data: readonly object[];
  columns: { key: string; label: string }[];
  filename?: string;
}

export function ExportButtons({ data, columns, filename = 'tool-research' }: ExportButtonsProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleCSV = () => {
    const header = columns.map((c) => c.label).join(',');
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const val = (row as Record<string, unknown>)[c.key];
          const str = val == null ? '' : String(val);
          // Escape commas and quotes in CSV
          return str.includes(',') || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={handlePrint}
        style={{
          padding: '6px 12px',
          border: `1px solid ${NAVY}`,
          borderRadius: 6,
          background: 'white',
          color: NAVY,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </button>
      <button
        onClick={handleCSV}
        style={{
          padding: '6px 12px',
          border: `1px solid ${NAVY}`,
          borderRadius: 6,
          background: 'white',
          color: NAVY,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV
      </button>
    </div>
  );
}
