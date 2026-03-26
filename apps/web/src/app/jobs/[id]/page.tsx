'use client';

/**
 * Job Detail Page — Interactive floor-plan-centric job view
 *
 * Uses CSS variables from globals.css for theme-aware colors.
 * Status/trade accent colors are hardcoded (same in both themes).
 *
 * Layout: Topbar → Layer Bar → [Floor Plan Canvas | Right Panel]
 * Right Panel: Room header → Tabs (Tasks / Comments / Photos) → Input
 */

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Design Tokens — status & trade colors (theme-independent)
// ---------------------------------------------------------------------------

// Status colors — raw hex needed for SVG fill/stroke
const SCH: Record<string, string> = {
  done: 'var(--green)',
  active: 'var(--blue)',
  blocked: 'var(--red)',
  pending: '#525868',
};

const ZF: Record<string, string> = {
  done: 'rgba(34,197,94,.18)',
  active: 'rgba(26,86,219,.2)',
  blocked: 'rgba(239,68,68,.22)',
  pending: 'rgba(82,88,104,.12)',
};

const TRC: Record<string, { c: string; b: string; bg: string }> = {};

const TGC: Record<string, { c: string; b: string; bg: string }> = {
  note:  { c: '#A3B3FF', b: 'rgba(26,86,219,.25)',  bg: 'rgba(26,86,219,.08)' },
  warn:  { c: 'var(--yellow)', b: 'rgba(245,158,11,.3)',  bg: 'var(--yellow-bg)' },
  block: { c: 'var(--red)', b: 'rgba(239,68,68,.25)',  bg: 'var(--red-bg)' },
  owner: { c: '#FCD34D', b: 'rgba(245,158,11,.25)', bg: 'rgba(245,158,11,.08)' },
};

const TGL: Record<string, string> = { note: 'Note', warn: 'Flag', block: 'Block', owner: 'Owner' };
const TRM: Record<string, string> = { paint: 'Paint', floor: 'Floor', trim: 'Trim', doors: 'Doors' };

// ---------------------------------------------------------------------------
// Seed Data
// ---------------------------------------------------------------------------

interface TaskItem { n: string; tr: string; h: string; s: string }
interface Comment { a: string; av: string; ac: string; tag: string; t: string; b: string; ph?: string }
interface Room {
  name: string; dim: string; st: string; prog: number; tasks: string;
  hrs: string; flags: number; x: number; y: number; w: number; h: number;
  tl: TaskItem[]; cm: Comment[];
}

const SEED_ROOMS: Record<string, Room> = {
  living: {
    name: 'Living Room', dim: "14\u2032\u00d712\u2032\u00b7168 sq ft", st: 'done', prog: 100, tasks: '3/3', hrs: '6h/6h', flags: 0,
    x: 30, y: 30, w: 220, h: 180,
    tl: [
      { n: 'Paint ceilings', tr: 'paint', h: '2h', s: 'done' },
      { n: 'Paint walls', tr: 'paint', h: '3h', s: 'done' },
      { n: 'Baseboard', tr: 'trim', h: '1h', s: 'done' },
    ],
    cm: [{ a: 'Nishant', av: 'N', ac: 'var(--accent)', tag: 'note', t: 'Feb 10\u00b72pm', b: 'Ceilings and walls done. Two coats. Looks great.' }],
  },
  kitchen: {
    name: 'Kitchen', dim: "11.5\u2032\u00d79\u2032\u00b7103 sq ft", st: 'active', prog: 50, tasks: '1/2', hrs: '1.5h/5h', flags: 2,
    x: 250, y: 30, w: 175, h: 130,
    tl: [
      { n: 'Paint walls', tr: 'paint', h: '1.5h/2h', s: 'active' },
      { n: 'Tile backsplash', tr: 'trim', h: '0h/3h', s: 'pending' },
    ],
    cm: [
      { a: 'Nathan', av: 'NM', ac: 'var(--blue)', tag: 'warn', t: 'Feb 11\u00b78:30am', b: 'Check grout color in daylight \u2014 looked different under artificial light.' },
      { a: 'Homeowner', av: 'HO', ac: 'var(--yellow)', tag: 'owner', t: 'Feb 11\u00b79:10am', b: 'Lighter grout is fine with me if it looks better!' },
    ],
  },
  bath: {
    name: 'Bathroom', dim: "7.5\u2032\u00d79\u2032\u00b767.5 sq ft", st: 'blocked', prog: 0, tasks: '0/4', hrs: '0h/12h', flags: 1,
    x: 425, y: 30, w: 115, h: 130,
    tl: [
      { n: 'Tile floor', tr: 'floor', h: '0h/4h', s: 'blocked' },
      { n: 'Tile walls', tr: 'trim', h: '0h/4h', s: 'pending' },
      { n: 'Paint ceiling', tr: 'paint', h: '0h/1h', s: 'pending' },
      { n: 'Install vanity', tr: 'trim', h: '0h/3h', s: 'pending' },
    ],
    cm: [{ a: 'Nishant', av: 'N', ac: 'var(--accent)', tag: 'block', t: 'Feb 11\u00b711am', b: 'Tile delivery delayed to Feb 13. All bath tasks blocked.', ph: 'bath-receipt.jpg' }],
  },
  bed1: {
    name: 'Bedroom 1', dim: "12.5\u2032\u00d711\u2032\u00b7137.5 sq ft", st: 'active', prog: 30, tasks: '1/4', hrs: '2h/11h', flags: 1,
    x: 30, y: 210, w: 190, h: 160,
    tl: [
      { n: 'Prime walls', tr: 'paint', h: '2h', s: 'done' },
      { n: 'Remove flooring', tr: 'floor', h: '0h/2h', s: 'active' },
      { n: 'Install LVP', tr: 'floor', h: '0h/6h', s: 'pending' },
      { n: 'Install baseboard', tr: 'trim', h: '0h/3h', s: 'pending' },
    ],
    cm: [
      { a: 'Nishant', av: 'N', ac: 'var(--accent)', tag: 'note', t: 'Feb 11\u00b79:42am', b: 'Sub-floor soft near window wall \u2014 checking before LVP.', ph: 'subfloor-bed1.jpg' },
      { a: 'Nathan', av: 'NM', ac: 'var(--blue)', tag: 'warn', t: 'Feb 11\u00b710:15am', b: 'Check moisture before proceeding. Over 12% = pause and raise CO.' },
    ],
  },
  bed2: {
    name: 'Bedroom 2', dim: "13.5\u2032\u00d714\u2032\u00b7189 sq ft", st: 'pending', prog: 0, tasks: '0/4', hrs: '0h/14h', flags: 0,
    x: 220, y: 160, w: 205, h: 210,
    tl: [
      { n: 'Remove flooring', tr: 'floor', h: '0h/2h', s: 'pending' },
      { n: 'Replace subfloor', tr: 'floor', h: '0h/2h', s: 'pending' },
      { n: 'Install LVP', tr: 'floor', h: '0h/8h', s: 'pending' },
      { n: 'Install baseboard', tr: 'trim', h: '0h/3h', s: 'pending' },
    ],
    cm: [],
  },
  hall: {
    name: 'Hallway', dim: "7.5\u2032\u00d76\u2032\u00b745 sq ft", st: 'done', prog: 100, tasks: '2/2', hrs: '1.5h/1.5h', flags: 0,
    x: 425, y: 160, w: 115, h: 95,
    tl: [
      { n: 'Paint ceiling & walls', tr: 'paint', h: '1h', s: 'done' },
      { n: 'Install baseboard', tr: 'trim', h: '0.5h', s: 'done' },
    ],
    cm: [],
  },
  laundry: {
    name: 'Laundry', dim: "7.5\u2032\u00d77.5\u2032\u00b756 sq ft", st: 'pending', prog: 0, tasks: '0/2', hrs: '0h/3h', flags: 0,
    x: 425, y: 255, w: 115, h: 115,
    tl: [
      { n: 'Paint ceiling & walls', tr: 'paint', h: '0h/1h', s: 'pending' },
      { n: 'LVP flooring', tr: 'floor', h: '0h/2h', s: 'pending' },
    ],
    cm: [],
  },
};

const SCRIPT_STAGES: Array<[string, string]> = [
  ['Shield', 'done'], ['Clear', 'done'], ['Ready', 'done'],
  ['Install', 'active'], ['Punch', 'future'], ['T/O', 'future'],
];

const TRADE_FILTERS: Array<[string, string]> = [
  ['All', 'var(--accent)'], ['Paint', 'var(--accent)'], ['Floor', 'var(--accent)'], ['Trim', 'var(--accent)'],
];

const LEGEND: Array<[string, string]> = [
  ['var(--green)', 'Complete'], ['var(--blue)', 'Active'], ['var(--red)', 'Blocked'], ['#525868', 'Pending'],
];

const PINS: Array<[string, number, number, string, string]> = [
  ['living', 64, 52, 'done', '\u2713'],
  ['kitchen', 290, 48, 'warn', '2'],
  ['bath', 446, 48, 'block', '!'],
  ['bed1', 50, 232, 'note', '1'],
  ['hall', 446, 178, 'done', '\u2713'],
];

const FINANCIALS = {
  quoted: 12_480, labourQuoted: 6_400, materialsQuoted: 4_280, overhead: 1_800,
  invoiced: 8_000, paid: 5_500, remaining: 6_980, changeOrders: 1_240,
  budgetedHours: 81, scheduledHours: 34, actualHours: 11,
};

const TEAM = [
  { name: 'Nathan M.', initials: 'NM', color: 'var(--blue)', role: 'Lead / PM', hours: '4h' },
  { name: 'Nishant', initials: 'N', color: 'var(--accent)', role: 'Installer', hours: '7h' },
];

const WALLS: Array<[[number, number], [number, number]]> = [
  [[248, 30], [248, 210]], [[412, 30], [412, 370]], [[30, 210], [412, 210]],
  [[216, 156], [216, 370]], [[248, 156], [536, 156]], [[412, 248], [536, 248]],
];

const WINDOWS: Array<[number, number, number, number]> = [
  [64, 368, 36, 4], [30, 84, 4, 44], [270, 30, 42, 4], [30, 258, 4, 38],
  [254, 368, 50, 4], [348, 368, 38, 4], [530, 52, 4, 30],
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RoomDetail({ room, onClose }: { room: Room; onClose: () => void }) {
  const sw = 246, sh = 190;
  const sc = Math.min((sw - 60) / room.w, (sh - 50) / room.h) * 0.9;
  const rw = room.w * sc, rh = room.h * sc;
  const rx = (sw - rw) / 2, ry = (sh - rh) / 2;
  const wt = 8;
  const stC = SCH[room.st];
  const stO: Record<string, string> = {
    done: 'var(--green-bg)', active: 'rgba(26,86,219,.09)',
    blocked: 'var(--red-bg)', pending: 'rgba(0,0,0,0)',
  };
  const floorLabel = room.st === 'blocked' ? 'Tile \u00b7 Blocked'
    : room.prog === 100 ? 'LVP \u00b7 Complete'
    : room.prog > 0 ? 'LVP \u00b7 Active' : 'Not Started';
  const parts = room.dim.split('\u00b7')[0].trim();
  const latest = room.cm.length > 0 ? room.cm[room.cm.length - 1] : null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 294,
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 25,
      boxShadow: '-18px 0 50px rgba(0,0,0,.4)', animation: 'slideIn .22s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 13px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, letterSpacing: '.06em', lineHeight: 1.1, color: 'var(--charcoal)' }}>{room.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{parts}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, padding: '1px 5px', borderRadius: 2, background: stC + '18', border: `1px solid ${stC}35`, color: stC }}>{floorLabel}</span>
            </div>
          </div>
          <div onClick={onClose} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', flexShrink: 0, marginTop: 1 }}>\u2715</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
          <div style={{ flex: 1, height: 2.5, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: stC, width: `${room.prog}%` }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: stC }}>{room.prog}%</span>
        </div>
      </div>

      {/* Enlarged room SVG */}
      <div style={{ padding: '12px 12px 6px', background: 'var(--bg)', flexShrink: 0 }}>
        <svg viewBox={`0 0 ${sw} ${sh}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect x={rx + wt} y={ry + wt} width={rw - wt * 2} height={rh - wt * 2} fill="#141620" />
          <rect x={rx + wt} y={ry + wt} width={rw - wt * 2} height={rh - wt * 2} fill={stO[room.st]} />
          {Array.from({ length: Math.floor((rh - wt * 2) / 9) }).map((_, i) => (
            <line key={i} x1={rx + wt} y1={ry + wt + i * 9 + 4} x2={rx + rw - wt} y2={ry + wt + i * 9 + 4} stroke="rgba(128,128,128,.06)" strokeWidth={1} />
          ))}
          <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="#c8c4bc" strokeWidth={wt} strokeLinejoin="miter" />
          <rect x={rx + wt * .5} y={ry + wt * .5} width={rw - wt} height={rh - wt} fill="none" stroke="rgba(0,0,0,.3)" strokeWidth={1} />
          <rect x={rx + wt + 2} y={ry + wt + 2} width={rw - wt * 2 - 4} height={rh - wt * 2 - 4} fill="none" stroke={stC} strokeWidth={1.2} strokeDasharray="5 3" opacity={0.3} />
          <circle cx={rx + rw / 2} cy={ry + rh / 2} r={16} fill="rgba(0,0,0,.4)" stroke="rgba(128,128,128,.12)" strokeWidth={2} />
          <circle cx={rx + rw / 2} cy={ry + rh / 2} r={16} fill="none" stroke={stC} strokeWidth={2} strokeLinecap="round"
            strokeDasharray={`${room.prog * .1005} ${10.05 - room.prog * .1005}`} strokeDashoffset={2.5125}
            transform={`rotate(-90 ${rx + rw / 2} ${ry + rh / 2})`} />
          <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={7.5} fill={stC} textAnchor="middle" x={rx + rw / 2} y={ry + rh / 2 + 3}>{room.prog}%</text>
        </svg>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 6 }}>Tasks</div>
        {room.tl.map((t, i) => {
          const done = t.s === 'done', act = t.s === 'active', blk = t.s === 'blocked';
          const tc = TRC[t.tr] ?? { c: 'var(--accent)', b: 'var(--accent-border)', bg: 'var(--accent-bg)' };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 3, opacity: done ? .55 : 1 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px solid ${done ? 'var(--green)' : act ? 'var(--blue)' : 'var(--muted)'}`, background: done ? 'var(--green)' : act ? 'rgba(26,86,219,.15)' : 'var(--surface-3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: done ? '#fff' : '', fontWeight: 700 }}>{done ? '\u2713' : blk ? '!' : ''}</div>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 500, color: done ? 'var(--muted)' : 'var(--charcoal)' }}>{t.n}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '1px 4px', borderRadius: 2, border: `1px solid ${tc.b}`, background: tc.bg, color: tc.c, textTransform: 'uppercase' }}>{TRM[t.tr] ?? t.tr}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{t.h}</span>
              </div>
            </div>
          );
        })}
        {latest && (
          <div style={{ marginTop: 10, padding: '8px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 5 }}>Latest Note</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: latest.ac + '2a', border: `1px solid ${latest.ac}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: latest.ac, flexShrink: 0 }}>{latest.av}</div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--charcoal)' }}>{latest.a}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>{latest.t}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--mid)', lineHeight: 1.5 }}>{latest.b}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressRing({ pct, color, size = 44, stroke = 3 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const [cur, setCur] = useState('bed1');
  const [tab, setTab] = useState('tasks');
  const [rooms, setRooms] = useState(SEED_ROOMS);
  const [note, setNote] = useState('');
  const [res, setRes] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [hpos, setHpos] = useState({ x: 0, y: 0 });
  const [cz, setCz] = useState(1);
  const [detail, setDetail] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'room' | 'budget' | 'team'>('room');

  const r = rooms[cur];
  const groups = useMemo(() => r.tl.reduce<Record<string, TaskItem[]>>((a, t) => { if (!a[t.tr]) a[t.tr] = []; a[t.tr].push(t); return a; }, {}), [r]);

  const totalTasks = useMemo(() => Object.values(rooms).reduce((s, rm) => s + rm.tl.length, 0), [rooms]);
  const doneTasks = useMemo(() => Object.values(rooms).reduce((s, rm) => s + rm.tl.filter(t => t.s === 'done').length, 0), [rooms]);
  const overallProg = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalFlags = useMemo(() => Object.values(rooms).reduce((s, rm) => s + rm.flags, 0), [rooms]);

  function sel(id: string) { setCur(id); setTab('tasks'); setDetail(id); }
  function openPin(id: string) { setCur(id); setTab('comments'); setDetail(id); }
  function closeDetail() { setDetail(null); }

  function post() {
    if (!note.trim()) return;
    setRooms(p => ({ ...p, [cur]: { ...p[cur], cm: [...p[cur].cm, { a: 'Nathan', av: 'NM', ac: 'var(--blue)', tag: 'note', t: 'Just now', b: note.trim() }] } }));
    setNote(''); setTab('comments');
  }

  const planSc = detail ? cz * 0.78 : cz;
  const planTX = detail ? '-8%' : '0%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--charcoal)', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes pulse{0%{opacity:.7}100%{opacity:0}}
      `}</style>

      {/* ================================================================ */}
      {/* TOPBAR                                                           */}
      {/* ================================================================ */}
      <div style={{ height: 44, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 800, letterSpacing: '.08em', color: 'var(--charcoal)' }}>
          HOO<span style={{ color: 'var(--blue)' }}>O</span>MZ
        </div>
        <span style={{ color: 'var(--muted)' }}>\u203a</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)' }}>Bradley Rental Refresh</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>12 Queen St, Moncton \u00b7 Job #2025-014</div>
        </div>

        {/* SCRIPT Pipeline */}
        <div style={{ display: 'flex', gap: 5, padding: '0 10px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          {SCRIPT_STAGES.map(([n, s]) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', border: '1.5px solid',
                borderColor: s === 'done' ? 'var(--green)' : s === 'active' ? 'var(--blue)' : 'var(--muted)',
                background: s === 'done' ? 'var(--green-bg)' : s === 'active' ? 'rgba(26,86,219,.15)' : 'var(--surface-3)',
                boxShadow: s === 'active' ? '0 0 6px rgba(26,86,219,.4)' : 'none',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6, color: 'var(--muted)', textTransform: 'uppercase' }}>{n}</span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 3, border: '1px solid var(--blue-bg)', background: 'var(--blue-bg)', color: 'var(--blue)', textTransform: 'uppercase' }}>Install Phase</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Mar 6 \u00b7 2:14 PM</span>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--blue-bg)', border: '1px solid rgba(26,86,219,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--blue)' }}>NM</div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* LAYER BAR                                                        */}
      {/* ================================================================ */}
      <div style={{ height: 38, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginRight: 4 }}>Trade</span>
        {TRADE_FILTERS.map(([l, c]) => (
          <div key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 3, border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--mid)', background: 'var(--surface-3)', textTransform: 'uppercase', borderLeft: `2px solid ${c}` }}>{l}</div>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

        {/* Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 4 }}>
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <ProgressRing pct={overallProg} color="var(--blue)" size={32} stroke={2.5} />
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--blue)' }}>{overallProg}%</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--mid)' }}>{doneTasks}/{totalTasks} tasks</div>
          {totalFlags > 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, padding: '2px 7px', borderRadius: 3, background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,.25)', color: 'var(--red)' }}>{totalFlags} flags</div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {LEGEND.map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MAIN                                                             */}
      {/* ================================================================ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* FLOOR PLAN CANVAS */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize: '20px 20px', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 36, transform: `translateX(${planTX}) scale(${planSc})`, transformOrigin: 'center left', transition: 'transform .28s ease', zIndex: 1 }}>
            <svg viewBox="0 0 600 420" style={{ width: '100%', maxWidth: 670, height: 'auto', filter: 'drop-shadow(0 16px 48px rgba(0,0,0,.35))' }}>
              {/* Room zones */}
              {Object.entries(rooms).map(([id, rm]) => (
                <g key={id} onClick={() => sel(id)} style={{ cursor: 'pointer' }}
                  onMouseMove={e => { if (!detail) { const svg = e.currentTarget.closest('svg'); if (svg) { const s = svg.getBoundingClientRect(); setHpos({ x: e.clientX - s.left, y: e.clientY - s.top }); setHover(id); } } }}
                  onMouseLeave={() => setHover(null)}>
                  <rect x={rm.x} y={rm.y} width={rm.w} height={rm.h} rx={1} fill={ZF[rm.st]} opacity={hover === id && !detail ? .8 : 1} style={{ transition: 'opacity .15s' }} />
                </g>
              ))}

              {/* Selected glow */}
              {cur && rooms[cur] && (
                <rect x={rooms[cur].x + 1} y={rooms[cur].y + 1} width={rooms[cur].w - 2} height={rooms[cur].h - 2} rx={1}
                  fill="none" stroke={SCH[rooms[cur].st]} strokeWidth={1.5} strokeDasharray="6 3" opacity={.5}
                  style={{ pointerEvents: 'none', transition: 'all .22s' }} />
              )}

              {/* Walls */}
              <rect fill="none" stroke="rgba(128,128,128,.45)" strokeWidth={6} x={30} y={30} width={506} height={346} />
              {WALLS.map(([[x1, y1], [x2, y2]], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(128,128,128,.25)" strokeWidth={3} />
              ))}

              {/* Doors */}
              <line x1={110} y1={370} x2={150} y2={370} stroke="rgba(128,128,128,.6)" strokeWidth={2.5} />
              <path d="M110,370 A40,40 0 0,0 110,330" fill="none" stroke="rgba(128,128,128,.3)" strokeWidth={1.2} strokeDasharray="3 2" />
              <line x1={248} y1={128} x2={248} y2={164} stroke="rgba(128,128,128,.45)" strokeWidth={2} />
              <path d="M248,128 A36,36 0 0,1 212,128" fill="none" stroke="rgba(128,128,128,.3)" strokeWidth={1.2} strokeDasharray="3 2" />
              <line x1={412} y1={86} x2={412} y2={118} stroke="rgba(128,128,128,.45)" strokeWidth={2} />
              <path d="M412,86 A32,32 0 0,0 444,86" fill="none" stroke="rgba(128,128,128,.3)" strokeWidth={1.2} strokeDasharray="3 2" />
              <line x1={216} y1={302} x2={216} y2={336} stroke="rgba(128,128,128,.45)" strokeWidth={2} />
              <path d="M216,336 A34,34 0 0,0 182,336" fill="none" stroke="rgba(128,128,128,.3)" strokeWidth={1.2} strokeDasharray="3 2" />

              {/* Windows */}
              {WINDOWS.map(([x, y, w, h], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx={1} stroke="rgba(100,160,255,.48)" strokeWidth={2} fill="rgba(100,160,255,.07)" />
              ))}

              {/* Room labels */}
              {Object.entries(rooms).map(([id, rm]) => {
                const cx = rm.x + rm.w / 2, cy = rm.y + rm.h / 2, isSel = id === cur;
                return (
                  <g key={`lbl-${id}`} style={{ pointerEvents: 'none' }}>
                    <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={isSel ? 11 : 9} fontWeight={700} fill={isSel ? 'rgba(128,128,128,.9)' : 'rgba(128,128,128,.5)'} textAnchor="middle" letterSpacing=".06em" x={cx} y={cy - 8}>{rm.name.toUpperCase()}</text>
                    <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={6.5} fill={isSel ? 'rgba(128,128,128,.5)' : 'rgba(128,128,128,.25)'} textAnchor="middle" x={cx} y={cy + 3}>{rm.dim.split('\u00b7')[0].trim()}</text>
                    <circle cx={cx - 7} cy={cy + 13} r={2.2} fill={SCH[rm.st]} opacity={.75} />
                    <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={6.5} fill={SCH[rm.st]} fillOpacity={.7} x={cx - 3} y={cy + 16}>{rm.prog}%</text>
                  </g>
                );
              })}

              {/* Overall dimensions */}
              <line x1={30} y1={398} x2={536} y2={398} stroke="rgba(128,128,128,.15)" strokeWidth={.8} />
              <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={7.5} fill="rgba(128,128,128,.35)" textAnchor="middle" x={283} y={408}>38.5\u2032</text>

              {/* Pins */}
              {PINS.map(([id, px, py, type, lbl]) => {
                const fc: Record<string, string> = { done: 'var(--green)', warn: 'var(--amber)', block: 'var(--red)', note: 'var(--blue)' };
                const isPulse = type === 'warn' || type === 'block';
                return (
                  <g key={`${id}-${type}`} onClick={e => { e.stopPropagation(); openPin(id); }} style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.35))' }} transform={`translate(${px},${py})`}>
                    {isPulse && <circle cx={0} cy={0} r={12} fill={fc[type] + '22'} style={{ animation: 'pulse 1.8s ease-out infinite' }} />}
                    <circle cx={0} cy={0} r={9} fill={fc[type]} stroke={fc[type] + '80'} strokeWidth={1.5} />
                    <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={6.5} fill="#fff" textAnchor="middle" y={2.5} fontWeight={700}>{lbl}</text>
                  </g>
                );
              })}

              {/* North */}
              <g transform="translate(555,394)">
                <circle r={10} fill="var(--bg)" stroke="rgba(128,128,128,.2)" strokeWidth={1} />
                <polygon points="0,-7 2,3 0,2 -2,3" fill="rgba(128,128,128,.6)" />
                <text fontFamily="'DM Mono','SF Mono',monospace" fontSize={5} fill="rgba(128,128,128,.4)" textAnchor="middle" y={9}>N</text>
              </g>
            </svg>
          </div>

          {/* Tooltip */}
          {hover && !detail && rooms[hover] && (
            <div style={{ position: 'absolute', left: hpos.x + 16, top: hpos.y - 62, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 11px', boxShadow: 'var(--shadow-panel)', pointerEvents: 'none', zIndex: 15, minWidth: 150 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, marginBottom: 2, color: 'var(--charcoal)' }}>{rooms[hover].name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>{rooms[hover].dim.split('\u00b7')[0].trim()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: SCH[rooms[hover].st] }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: SCH[rooms[hover].st] }}>{rooms[hover].prog}% \u00b7 {rooms[hover].tasks} tasks</span>
              </div>
              <div style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 4 }}>Click to expand \u203a</div>
            </div>
          )}

          {/* Detail callout */}
          {detail && rooms[detail] && <RoomDetail room={rooms[detail]} onClose={closeDetail} />}

          {/* Zoom */}
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden', zIndex: 30 }}>
            {([
              ['\uff0b', () => setCz(z => Math.min(3, z * 1.2))],
              [`${Math.round(cz * 100)}%`, null],
              ['\uff0d', () => setCz(z => Math.max(.35, z * .8))],
              ['\u2299', () => setCz(1)],
            ] as const).map(([l, fn], i) => (
              <div key={i} onClick={fn || undefined} style={{ fontFamily: 'var(--font-mono)', fontSize: i === 1 ? 9 : 11, padding: i === 1 ? '5px 10px' : '5px 13px', cursor: fn ? 'pointer' : 'default', color: 'var(--muted)', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>{l}</div>
            ))}
          </div>

          {/* Floor selector */}
          <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, overflow: 'hidden', zIndex: 30 }}>
            {['Main Floor', 'Basement'].map((f, i) => (
              <div key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '5px 11px', cursor: 'pointer', color: i === 0 ? 'var(--blue)' : 'var(--muted)', textTransform: 'uppercase', borderBottom: i === 0 ? '1px solid var(--border)' : 'none', background: i === 0 ? 'var(--blue-bg)' : 'transparent' }}>{f}</div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL                                                     */}
        {/* ============================================================== */}
        <div style={{ width: 306, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {/* Panel mode selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            {(['room', 'budget', 'team'] as const).map(t => (
              <div key={t} onClick={() => setRightTab(t)} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', padding: '7px 0', textAlign: 'center', cursor: 'pointer', color: rightTab === t ? 'var(--charcoal)' : 'var(--muted)', borderBottom: rightTab === t ? '2px solid var(--blue)' : '2px solid transparent', position: 'relative', top: 1, transition: 'color .15s' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
            ))}
          </div>

          {/* ---- ROOM TAB ---- */}
          {rightTab === 'room' && (<>
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, letterSpacing: '.06em', flex: 1, color: 'var(--charcoal)' }}>{r.name}</div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: SCH[r.st], flexShrink: 0 }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>{r.dim}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: SCH[r.st], width: `${r.prog}%`, transition: 'width .4s' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)' }}>{r.prog}%</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {([['Tasks', r.tasks, 'var(--blue)'], ['Hours', r.hrs, 'var(--charcoal)'], ['Flags', String(r.flags), r.flags > 0 ? 'var(--amber)' : 'var(--green)']] as const).map(([l, v, c]) => (
                  <div key={l} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {['tasks', 'comments', 'photos'].map(t => (
                <div key={t} onClick={() => setTab(t)} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', padding: '8px 0', textAlign: 'center', cursor: 'pointer', color: tab === t ? 'var(--charcoal)' : 'var(--muted)', borderBottom: tab === t ? '2px solid var(--blue)' : '2px solid transparent', position: 'relative', top: 1, transition: 'color .15s' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {tab === 'tasks' && (
                <div style={{ padding: '10px 12px' }}>
                  {Object.entries(groups).map(([tr, tasks]) => (
                    <div key={tr}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', padding: '8px 0 4px' }}>{TRM[tr] ?? tr}</div>
                      {tasks.map((t, i) => {
                        const done = t.s === 'done', act = t.s === 'active', blk = t.s === 'blocked';
                        const tc = TRC[t.tr] ?? { c: 'var(--accent)', b: 'var(--accent-border)', bg: 'var(--accent-bg)' };
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, marginBottom: 4, opacity: done ? .6 : 1 }}>
                            <div style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${done ? 'var(--green)' : act ? 'var(--blue)' : 'var(--muted)'}`, background: done ? 'var(--green)' : act ? 'rgba(26,86,219,.15)' : 'var(--surface-3)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: done ? '#fff' : '' }}>{done ? '\u2713' : blk ? '!' : ''}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 2, color: 'var(--charcoal)' }}>{t.n}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '1px 4px', borderRadius: 2, border: `1px solid ${tc.b}`, background: tc.bg, color: tc.c, textTransform: 'uppercase' }}>{TRM[tr] ?? tr}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{t.h}</span>
                              </div>
                            </div>
                            <div style={{
                              fontFamily: 'var(--font-mono)', fontSize: 8, padding: '2px 6px', borderRadius: 3, border: '1px solid', cursor: 'pointer', flexShrink: 0, marginTop: 1,
                              background: done ? 'var(--green-dim)' : act ? 'var(--blue-bg)' : blk ? 'var(--red-dim)' : 'var(--green-dim)',
                              borderColor: done ? 'rgba(34,197,94,.3)' : act ? 'rgba(26,86,219,.3)' : blk ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)',
                              color: done ? 'var(--green)' : act ? 'var(--blue)' : blk ? 'var(--red)' : 'var(--green)',
                              opacity: done || blk ? .6 : 1,
                            }}>{done ? 'Done' : act ? 'Active' : blk ? 'Blocked' : 'Start'}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'comments' && (
                <div style={{ padding: '10px 12px' }}>
                  {r.cm.length === 0 ? (
                    <div style={{ padding: '24px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>No comments yet</div>
                  ) : r.cm.map((c, i) => {
                    const key = `${cur}-${i}`;
                    const tg = TGC[c.tag || 'note'];
                    return (
                      <div key={key} style={{ marginTop: 10, opacity: res[key] ? .4 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, background: c.ac + '2e', color: c.ac, border: `1px solid ${c.ac}50` }}>{c.av}</div>
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--charcoal)' }}>{c.a}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, padding: '1px 4px', borderRadius: 2, border: `1px solid ${tg.b}`, background: tg.bg, color: tg.c, textTransform: 'uppercase' }}>{TGL[c.tag || 'note']}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>{c.t}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mid)', lineHeight: 1.55, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '7px 9px', marginLeft: 26 }}>
                          {c.b}
                          {c.ph && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(26,86,219,.2)', padding: '3px 7px', borderRadius: 3, cursor: 'pointer' }}>{c.ph}</div>}
                        </div>
                        {!res[key] && <div onClick={() => setRes(p => ({ ...p, [key]: true }))} style={{ marginLeft: 26, marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', cursor: 'pointer' }}>\u2713 Mark resolved</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'photos' && (
                <div style={{ padding: '10px 12px' }}>
                  {([['Before', ['Overview', 'Window', 'Sub-floor']], ['During', ['Demo', '+', '+']]] as const).map(([lbl, photos]) => (
                    <div key={lbl}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '10px 0 6px' }}>{lbl}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
                        {photos.map((p, i) => (
                          <div key={i} style={{ aspectRatio: '1', borderRadius: 4, border: `1px ${p === '+' ? 'dashed' : 'solid'} var(--border)`, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: p === '+' ? 18 : 11, cursor: 'pointer', color: 'var(--muted)' }}>
                            {p === '+' ? <span>+</span> : <span>{p}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input area */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {['Note', 'Flag', 'Block'].map(t => (
                  <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, padding: '3px 7px', borderRadius: 3, border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted)', background: 'var(--surface-3)', textTransform: 'uppercase' }}>{t}</div>
                ))}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={`Add a note for ${r.name}\u2026`} rows={2}
                style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 4, padding: '7px 9px', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', fontSize: 11, resize: 'none', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                <div onClick={() => setNote('')} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '5px 11px', borderRadius: 3, background: 'var(--surface-3)', color: 'var(--muted)', cursor: 'pointer', textTransform: 'uppercase' }}>Cancel</div>
                <div onClick={post} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '5px 11px', borderRadius: 3, background: 'var(--blue)', color: '#fff', cursor: 'pointer', textTransform: 'uppercase' }}>Post</div>
              </div>
            </div>
          </>)}

          {/* ---- BUDGET TAB ---- */}
          {rightTab === 'budget' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>Financials</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
                {([['Quoted', `$${FINANCIALS.quoted.toLocaleString()}`, 'var(--blue)'], ['Invoiced', `$${FINANCIALS.invoiced.toLocaleString()}`, 'var(--charcoal)'], ['Paid', `$${FINANCIALS.paid.toLocaleString()}`, 'var(--green)'], ['Remaining', `$${FINANCIALS.remaining.toLocaleString()}`, 'var(--amber)']] as const).map(([l, v, c]) => (
                  <div key={l} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: c }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>Cost Breakdown</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '8px 10px', marginBottom: 12 }}>
                {([['Labour', FINANCIALS.labourQuoted, 'var(--accent)'], ['Materials', FINANCIALS.materialsQuoted, 'var(--violet)'], ['Overhead', FINANCIALS.overhead, 'var(--muted)'], ['Change Orders', FINANCIALS.changeOrders, 'var(--amber)']] as const).map(([l, v, c], i, arr) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)' }}>{l}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--charcoal)' }}>${v.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>Labour Hours</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ position: 'relative', width: 44, height: 44 }}>
                    <ProgressRing pct={Math.round((FINANCIALS.actualHours / FINANCIALS.budgetedHours) * 100)} color="var(--accent)" size={44} stroke={3} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)' }}>{Math.round((FINANCIALS.actualHours / FINANCIALS.budgetedHours) * 100)}%</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--charcoal)' }}>{FINANCIALS.actualHours}h / {FINANCIALS.budgetedHours}h</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{FINANCIALS.budgetedHours - FINANCIALS.actualHours}h remaining</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([['Budgeted', FINANCIALS.budgetedHours, 'var(--muted)'], ['Scheduled', FINANCIALS.scheduledHours, 'var(--blue)'], ['Actual', FINANCIALS.actualHours, 'var(--accent)']] as const).map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, background: 'var(--surface-3)', borderRadius: 3, padding: '4px 6px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 1 }}>{l}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c }}>{v}h</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '100%', background: 'rgba(26,86,219,.3)', borderRadius: 2, width: `${(FINANCIALS.scheduledHours / FINANCIALS.budgetedHours) * 100}%` }} />
                  <div style={{ position: 'absolute', height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${(FINANCIALS.actualHours / FINANCIALS.budgetedHours) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* ---- TEAM TAB ---- */}
          {rightTab === 'team' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>Crew on Site</div>
              {TEAM.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.color + '2a', border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: m.color, flexShrink: 0 }}>{m.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--charcoal)' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{m.role}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)', background: 'var(--surface-3)', padding: '3px 8px', borderRadius: 3 }}>{m.hours}</div>
                </div>
              ))}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginTop: 16, marginBottom: 8 }}>Room Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(rooms).map(([id, rm]) => (
                  <div key={id} onClick={() => { setCur(id); setRightTab('room'); }} style={{ background: 'var(--surface-2)', border: `1px solid ${id === cur ? SCH[rm.st] + '44' : 'var(--border)'}`, borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: SCH[rm.st] }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: 'var(--charcoal)' }}>{rm.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 2, background: 'var(--surface-3)', borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: SCH[rm.st], width: `${rm.prog}%` }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{rm.prog}%</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', marginTop: 2 }}>{rm.tasks} tasks \u00b7 {rm.hrs}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginTop: 16, marginBottom: 8 }}>Quick Actions</div>
              {['Log Time', 'Add Photo', 'Create Change Order', 'Message Homeowner'].map(a => (
                <div key={a} style={{ padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, marginBottom: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mid)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {a}<span style={{ color: 'var(--muted)' }}>\u203a</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
