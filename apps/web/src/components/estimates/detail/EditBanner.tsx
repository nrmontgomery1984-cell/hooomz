'use client';

/**
 * EditBanner — Blue accent bar shown when in edit mode.
 * Matches estimate-detail-v4.html artifact.
 */

interface EditBannerProps {
  docNumber: string;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function EditBanner({ docNumber, onSave, onCancel, isSaving }: EditBannerProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-2.5"
      style={{
        background: 'rgba(74,127,165,0.06)',
        borderBottom: '2px solid var(--blue)',
      }}
    >
      <span
        className="text-[11px] font-medium tracking-[0.04em]"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}
      >
        Editing — {docNumber}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 border"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--surface)',
            color: 'var(--mid)',
            borderColor: 'var(--border)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-[11px] font-medium tracking-[0.04em] px-4 py-2 text-white"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--green)',
            borderColor: 'var(--green)',
            border: '1px solid var(--green)',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
