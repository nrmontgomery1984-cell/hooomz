'use client';

import type { ReactNode } from 'react';

const NAVY = '#1B2A4A';

interface ToolResearchCardProps {
  title?: string;
  accent?: string;
  color?: string;
  children: ReactNode;
}

export function ToolResearchCard({
  title,
  accent,
  color = NAVY,
  children,
}: ToolResearchCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {title && (
        <div
          style={{
            padding: '10px 16px',
            background: color,
            color: 'white',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {title}
          {accent && <span style={{ fontSize: 11, opacity: 0.8 }}>{accent}</span>}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
