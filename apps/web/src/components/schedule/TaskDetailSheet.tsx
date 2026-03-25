'use client';

/**
 * TaskDetailSheet — Bottom sheet for viewing scheduled task detail + scoped manager notes
 */

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { CrewScheduleBlock, CrewMember, NoteAudience, ScheduleNote } from '@hooomz/shared-contracts';
import { useActiveCrew } from '@/lib/crew/ActiveCrewContext';
import { useNotesForBlock, useAddScheduleNote, useDeleteScheduleNote } from '@/lib/hooks/useScheduleNotes';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'var(--muted)' },
  in_progress: { label: 'In Progress', color: 'var(--blue)' },
  completed: { label: 'Done', color: 'var(--green)' },
  skipped: { label: 'Skipped', color: 'var(--muted)' },
};

const AUDIENCE_OPTIONS: { value: NoteAudience; label: string; desc: string }[] = [
  { value: 'crew_all', label: 'All Crew', desc: 'Everyone on the team' },
  { value: 'site_all', label: 'This Site', desc: 'Everyone here today' },
  { value: 'task_crew', label: 'This Task', desc: 'Assigned crew only' },
  { value: 'person', label: 'Person', desc: 'One specific person' },
];

interface TaskDetailSheetProps {
  block: CrewScheduleBlock;
  crewMembers: CrewMember[];
  crewMap: Record<string, string>;
  onClose: () => void;
}

export function TaskDetailSheet({ block, crewMembers, crewMap, onClose }: TaskDetailSheetProps) {
  const { crewMemberId: authorId, crewMemberName: authorName } = useActiveCrew();
  const { data: notes = [], isLoading: notesLoading } = useNotesForBlock(block.id);
  const addNote = useAddScheduleNote();
  const deleteNote = useDeleteScheduleNote();

  const [isComposing, setIsComposing] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [audience, setAudience] = useState<NoteAudience>('task_crew');
  const [targetCrewId, setTargetCrewId] = useState('');

  const status = STATUS_LABELS[block.status] || STATUS_LABELS.scheduled;
  const assignedName = crewMap[block.crewMemberId] || block.crewMemberId;

  const canSubmit = noteBody.trim().length > 0 &&
    (audience !== 'person' || targetCrewId !== '') &&
    !addNote.isPending;

  const handleSubmitNote = () => {
    if (!canSubmit || !authorId || !authorName) return;

    const targetMember = audience === 'person'
      ? crewMembers.find(m => m.id === targetCrewId)
      : null;

    addNote.mutate({
      blockId: block.id,
      projectId: block.projectId,
      date: block.date,
      authorId,
      authorName,
      audience,
      targetCrewMemberId: targetMember?.id,
      targetCrewMemberName: targetMember?.name,
      body: noteBody.trim(),
    }, {
      onSuccess: () => {
        setNoteBody('');
        setIsComposing(false);
        setAudience('task_crew');
        setTargetCrewId('');
      },
    });
  };

  const handleDeleteNote = (note: ScheduleNote) => {
    if (!authorName) return;
    deleteNote.mutate({
      noteId: note.id,
      deletedByName: authorName,
      blockId: note.blockId,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Sheet */}
      <div
        className="relative rounded-t-2xl w-full max-w-lg shadow-xl flex flex-col"
        style={{ maxHeight: '85vh', background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--charcoal)' }}>{block.title}</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{format(parseISO(block.date), 'EEE, MMM d')}</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-xl flex-shrink-0"
            style={{ color: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pb-8">
          {/* Block detail */}
          <div className="mx-4 mt-3 p-3 rounded-lg space-y-2" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--mid)' }}>{assignedName}</span>
              </div>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: status.color }}
              >
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
              {block.startTime && (
                <span>{block.startTime}{block.endTime ? ` – ${block.endTime}` : ''}</span>
              )}
              {block.estimatedHours > 0 && <span>{block.estimatedHours}h est</span>}
              {block.actualHours > 0 && (
                <span className="font-medium" style={{ color: 'var(--accent)' }}>{block.actualHours}h actual</span>
              )}
            </div>

            {block.sopCode && (
              <span className="inline-block text-[10px] font-mono" style={{ color: 'var(--muted)' }}>{block.sopCode}</span>
            )}
          </div>

          {/* Notes section */}
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--mid)' }}>
                Notes
                {notes.length > 0 && (
                  <span className="font-normal ml-1" style={{ color: 'var(--muted)' }}>({notes.length})</span>
                )}
              </span>
              {authorId && (
                <button
                  onClick={() => setIsComposing(!isComposing)}
                  className="text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: isComposing ? 'var(--muted)' : 'var(--accent)', minHeight: '36px' }}
                >
                  {isComposing ? 'Cancel' : '+ Add Note'}
                </button>
              )}
            </div>

            {/* Note composer */}
            {isComposing && (
              <div className="border rounded-lg p-3 mb-3 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder='e.g. "Check subfloor for squeaks before starting"'
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  rows={3}
                  style={{ minHeight: '44px', borderColor: 'var(--border)' }}
                />

                {/* Audience selector — 2x2 grid */}
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAudience(opt.value)}
                      className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                        audience === opt.value
                          ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                          : ''
                      }`}
                      style={{
                        minHeight: '44px',
                        ...(audience !== opt.value ? { borderColor: 'var(--border)', background: 'var(--surface)' } : {}),
                      }}
                    >
                      <span
                        className={`text-xs font-medium block ${audience === opt.value ? 'text-[var(--accent)]' : ''}`}
                        style={audience !== opt.value ? { color: 'var(--mid)' } : undefined}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Person selector */}
                {audience === 'person' && (
                  <select
                    value={targetCrewId}
                    onChange={(e) => setTargetCrewId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ minHeight: '44px', borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <option value="">Select person...</option>
                    {crewMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleSubmitNote}
                  disabled={!canSubmit}
                  className="w-full py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: 'var(--accent)', minHeight: '44px' }}
                >
                  {addNote.isPending ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            )}

            {/* Notes list */}
            {notesLoading ? (
              <div className="text-center py-6 text-xs" style={{ color: 'var(--muted)' }}>Loading notes...</div>
            ) : notes.length === 0 && !isComposing ? (
              <div className="text-center py-6 text-xs border border-dashed rounded-lg" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                No notes yet
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    canDelete={note.authorId === authorId}
                    onDelete={() => handleDeleteNote(note)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NoteCard — Single note display
// ============================================================================

function NoteCard({ note, canDelete, onDelete }: { note: ScheduleNote; canDelete: boolean; onDelete: () => void }) {
  const audienceLabel: Record<NoteAudience, string> = {
    crew_all: 'All Crew',
    site_all: 'Everyone On Site',
    task_crew: 'Task Crew',
    person: note.targetCrewMemberName ?? 'Person',
  };

  return (
    <div className="border rounded-lg p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>{note.authorName}</span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
          {format(parseISO(note.createdAt), 'MMM d, h:mmaaa')}
        </span>
      </div>
      <p className="text-sm leading-snug whitespace-pre-wrap" style={{ color: 'var(--mid)' }}>{note.body}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: 'var(--muted)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {note.audience === 'person' ? `To: ${audienceLabel[note.audience]}` : audienceLabel[note.audience]}
        </span>
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-[10px] text-red-400 hover:text-red-600 px-2 py-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
