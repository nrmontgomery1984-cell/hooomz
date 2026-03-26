'use client';

// ============================================================================
// Punch List Panel — items grouped by priority, resolve/verify buttons, add form
// ============================================================================

import { useState } from 'react';
import { PanelSection } from '@/components/ui/PanelSection';
import { Plus, Check, CheckCheck, RotateCcw, Trash2 } from 'lucide-react';
import {
  usePunchListByProject,
  useCreatePunchItem,
  useResolvePunchItem,
  useVerifyPunchItem,
  useReopenPunchItem,
  useDeletePunchItem,
} from '@/lib/hooks/usePunchList';
import type { PunchListItem, PunchListPriority } from '@/lib/types/punchList.types';

const PRIORITY_ORDER: PunchListPriority[] = ['critical', 'major', 'minor'];
const PRIORITY_COLORS: Record<PunchListPriority, string> = {
  critical: 'var(--red)',
  major: 'var(--amber)',
  minor: 'var(--muted)',
};
const PRIORITY_LABELS: Record<PunchListPriority, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
};

interface PunchListPanelProps {
  projectId: string;
}

export function PunchListPanel({ projectId }: PunchListPanelProps) {
  const { data: items = [] } = usePunchListByProject(projectId);
  const createMutation = useCreatePunchItem(projectId);
  const resolveMutation = useResolvePunchItem(projectId);
  const verifyMutation = useVerifyPunchItem(projectId);
  const reopenMutation = useReopenPunchItem(projectId);
  const deleteMutation = useDeletePunchItem(projectId);

  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<PunchListPriority>('major');

  const openCount = items.filter((i) => i.status !== 'resolved' && i.status !== 'verified').length;

  function handleAdd() {
    if (!desc.trim()) return;
    createMutation.mutate({
      projectId,
      description: desc.trim(),
      location: location.trim(),
      tradeCode: '',
      priority,
    });
    setDesc('');
    setLocation('');
    setPriority('major');
    setShowForm(false);
  }

  // Group items by priority
  const grouped = PRIORITY_ORDER.map((p) => ({
    priority: p,
    items: items.filter((i) => i.priority === p),
  })).filter((g) => g.items.length > 0);

  return (
    <PanelSection
      label="Punch List"
      count={items.length}
      countColor={openCount > 0 ? 'var(--amber)' : 'var(--green)'}
      action={
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', display: 'flex', alignItems: 'center', padding: 2 }}
        >
          <Plus size={14} />
        </button>
      }
    >
      {/* Add form */}
      {showForm && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <input
            type="text"
            placeholder="Description…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--charcoal)', background: 'var(--surface)', marginBottom: 6, boxSizing: 'border-box' }}
          />
          <input
            type="text"
            placeholder="Location (e.g. Kitchen, Living Room)…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--charcoal)', background: 'var(--surface)', marginBottom: 6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {PRIORITY_ORDER.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${priority === p ? PRIORITY_COLORS[p] : 'var(--border)'}`,
                  background: priority === p ? `${PRIORITY_COLORS[p]}18` : 'var(--surface)',
                  color: priority === p ? PRIORITY_COLORS[p] : 'var(--muted)',
                }}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleAdd}
              disabled={!desc.trim()}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: desc.trim() ? 'var(--blue)' : 'var(--border)', color: '#fff', border: 'none',
              }}
            >
              Add Item
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ padding: '7px 12px', borderRadius: 'var(--radius)', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items grouped by priority */}
      {items.length === 0 ? (
        <div style={{ padding: '16px 12px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>No punch list items</p>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.priority}>
            <div style={{ padding: '6px 12px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: PRIORITY_COLORS[group.priority] }}>
                {PRIORITY_LABELS[group.priority]} ({group.items.length})
              </span>
            </div>
            {group.items.map((item) => (
              <PunchRow
                key={item.id}
                item={item}
                onResolve={() => resolveMutation.mutate(item.id)}
                onVerify={() => verifyMutation.mutate(item.id)}
                onReopen={() => reopenMutation.mutate(item.id)}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
          </div>
        ))
      )}
    </PanelSection>
  );
}

function PunchRow({ item, onResolve, onVerify, onReopen, onDelete }: {
  item: PunchListItem;
  onResolve: () => void;
  onVerify: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const isDone = item.status === 'resolved' || item.status === 'verified';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        opacity: isDone ? 0.5 : 1,
        minHeight: 40,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, fontWeight: 500, color: 'var(--charcoal)',
          textDecoration: item.status === 'verified' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.description}
        </p>
        {item.location && (
          <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{item.location}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {item.status === 'open' || item.status === 'in_progress' ? (
          <ActionBtn icon={<Check size={12} />} title="Resolve" onClick={onResolve} color="var(--green)" />
        ) : item.status === 'resolved' ? (
          <>
            <ActionBtn icon={<CheckCheck size={12} />} title="Verify" onClick={onVerify} color="var(--blue)" />
            <ActionBtn icon={<RotateCcw size={12} />} title="Reopen" onClick={onReopen} color="var(--amber)" />
          </>
        ) : null}
        <ActionBtn icon={<Trash2 size={11} />} title="Delete" onClick={onDelete} color="var(--red)" />
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, onClick, color }: { icon: React.ReactNode; title: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius)', border: 'none', background: 'none', cursor: 'pointer', color,
      }}
    >
      {icon}
    </button>
  );
}
