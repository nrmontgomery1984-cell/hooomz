/**
 * IAQ (Indoor Air Quality) Report Types
 *
 * Used by Hooomz Labs for AirGradient sensor data analysis.
 * Two AirGradient ONE monitors deployed at renovation sites —
 * one indoor, one outdoor. CSV export from app.airgradient.com
 * is parsed client-side and stored in IndexedDB.
 */

// ============================================================================
// Metric Types
// ============================================================================

export type MetricStatus = 'good' | 'warn' | 'poor';

export interface IAQMetric {
  baseline: number;
  peak: number;
  peakDay: string;
  current: number;
  clearancePct: number;
  status: MetricStatus;
}

// ============================================================================
// Phase
// ============================================================================

export type IAQPhaseLabel = 'Baseline' | 'Installation' | 'Settlement' | 'Clearance';

export interface IAQPhase {
  label: IAQPhaseLabel;
  startDate: string;
  endDate: string;
}

// ============================================================================
// Daily Summary
// ============================================================================

export interface IAQDailySummary {
  date: string;
  co2Avg: number;
  pm25Avg: number;
  vocAvg: number;
  noxAvg: number;
  humidityAvg: number;
  tempAvg: number;
}

// ============================================================================
// Report
// ============================================================================

export type IAQHealthRating = 'Excellent' | 'Good' | 'Fair' | 'Action Needed';

export interface IAQReport {
  id: string;
  createdAt: string;
  clientName: string;
  address: string;
  projectName: string;
  monitoringStart: string;
  monitoringEnd: string;
  indoorSerial: string;
  outdoorSerial?: string;
  co2: IAQMetric;
  pm25: IAQMetric;
  voc: IAQMetric;
  nox: IAQMetric;
  humidity: IAQMetric;
  temperature: IAQMetric;
  healthScore: number;
  healthRating: IAQHealthRating;
  phases: IAQPhase[];
  dailySummaries: IAQDailySummary[];
  outdoorDailySummaries?: IAQDailySummary[];
}

// ============================================================================
// Health Canada Thresholds
// ============================================================================

export function deriveStatus(metric: string, value: number): MetricStatus {
  switch (metric) {
    case 'co2':
      return value < 800 ? 'good' : value <= 1200 ? 'warn' : 'poor';
    case 'pm25':
      return value < 12 ? 'good' : value <= 35 ? 'warn' : 'poor';
    case 'voc':
      return value < 150 ? 'good' : value <= 300 ? 'warn' : 'poor';
    case 'nox':
      return value < 20 ? 'good' : value <= 100 ? 'warn' : 'poor';
    case 'humidity':
      if (value >= 40 && value <= 60) return 'good';
      if ((value >= 30 && value < 40) || (value > 60 && value <= 70)) return 'warn';
      return 'poor';
    default:
      return 'good';
  }
}

// ============================================================================
// Health Score Weighting
// ============================================================================

const WEIGHTS: Record<string, number> = {
  pm25: 0.30,
  voc: 0.25,
  co2: 0.20,
  humidity: 0.15,
  nox: 0.10,
};

export function computeHealthScore(report: Pick<IAQReport, 'pm25' | 'voc' | 'co2' | 'humidity' | 'nox'>): number {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const metric = report[key as keyof typeof report] as IAQMetric;
    const clamped = Math.max(0, Math.min(metric.clearancePct, 100));
    score += weight * clamped;
  }
  return Math.round(score);
}

export function deriveRating(score: number): IAQHealthRating {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Action Needed';
}

// ============================================================================
// Phase Derivation
// ============================================================================

export function derivePhases(start: string, end: string): IAQPhase[] {
  const s = new Date(start);
  const e = new Date(end);
  const totalDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (86400000)));

  function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
  function fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  if (totalDays < 8) {
    const q = Math.max(1, Math.floor(totalDays / 4));
    const baseEnd = addDays(s, q - 1);
    const installEnd = addDays(baseEnd, q);
    const settleEnd = addDays(installEnd, q);
    return [
      { label: 'Baseline', startDate: fmt(s), endDate: fmt(baseEnd) },
      { label: 'Installation', startDate: fmt(addDays(baseEnd, 1)), endDate: fmt(installEnd) },
      { label: 'Settlement', startDate: fmt(addDays(installEnd, 1)), endDate: fmt(settleEnd) },
      { label: 'Clearance', startDate: fmt(addDays(settleEnd, 1)), endDate: fmt(e) },
    ];
  }

  const baseEnd = addDays(s, 3);
  const half = Math.floor(totalDays / 2);
  const installDays = Math.min(6, half);
  const installEnd = addDays(s, 4 + installDays - 1);
  const settleEnd = addDays(installEnd, 4);

  return [
    { label: 'Baseline', startDate: fmt(s), endDate: fmt(baseEnd) },
    { label: 'Installation', startDate: fmt(addDays(baseEnd, 1)), endDate: fmt(installEnd) },
    { label: 'Settlement', startDate: fmt(addDays(installEnd, 1)), endDate: fmt(settleEnd) },
    { label: 'Clearance', startDate: fmt(addDays(settleEnd, 1)), endDate: fmt(e) },
  ];
}

// ============================================================================
// CSV Parsing
// ============================================================================

export interface ParsedCSVRow {
  timestamp: Date;
  rco2: number;
  pm02: number;
  tvoc_raw: number;
  nox_index: number;
  atmp: number;
  rhum: number;
}

export interface CSVParseResult {
  rows: ParsedCSVRow[];
  error?: string;
}

export function parseAirGradientCSV(csvText: string): CSVParseResult {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { rows: [], error: 'CSV file is empty or has no data rows.' };

  const header = lines[0].toLowerCase().replace(/\r/g, '');
  const cols = header.split(',').map(c => c.trim());

  const required = ['timestamp', 'rco2', 'pm02', 'tvoc_raw', 'nox_index', 'atmp', 'rhum'];
  const missing = required.filter(r => !cols.includes(r));
  if (missing.length > 0) {
    return { rows: [], error: `CSV format not recognised — expected AirGradient export with columns: ${required.join(', ')}` };
  }

  const idx = Object.fromEntries(required.map(r => [r, cols.indexOf(r)]));

  const rows: ParsedCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].replace(/\r/g, '').split(',');
    if (fields.length < cols.length) continue;

    const ts = new Date(fields[idx.timestamp].trim());
    if (isNaN(ts.getTime())) continue;

    const rco2 = parseFloat(fields[idx.rco2]);
    const pm02 = parseFloat(fields[idx.pm02]);
    const tvoc_raw = parseFloat(fields[idx.tvoc_raw]);
    const nox_index = parseFloat(fields[idx.nox_index]);
    const atmp = parseFloat(fields[idx.atmp]);
    const rhum = parseFloat(fields[idx.rhum]);

    if ([rco2, pm02, tvoc_raw, nox_index, atmp, rhum].every(v => v === 0)) continue;

    rows.push({ timestamp: ts, rco2, pm02, tvoc_raw, nox_index, atmp, rhum });
  }

  rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return { rows };
}

// ============================================================================
// Metric Computation from Parsed Rows
// ============================================================================

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function maxVal(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

export function computeDailySummaries(rows: ParsedCSVRow[]): IAQDailySummary[] {
  const byDay = new Map<string, ParsedCSVRow[]>();
  for (const r of rows) {
    const day = r.timestamp.toISOString().split('T')[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(r);
  }

  const summaries: IAQDailySummary[] = [];
  for (const [date, dayRows] of byDay) {
    summaries.push({
      date,
      co2Avg: Math.round(mean(dayRows.map(r => r.rco2))),
      pm25Avg: Math.round(mean(dayRows.map(r => r.pm02)) * 10) / 10,
      vocAvg: Math.round(mean(dayRows.map(r => r.tvoc_raw))),
      noxAvg: Math.round(mean(dayRows.map(r => r.nox_index))),
      humidityAvg: Math.round(mean(dayRows.map(r => r.rhum)) * 10) / 10,
      tempAvg: Math.round(mean(dayRows.map(r => r.atmp)) * 10) / 10,
    });
  }

  summaries.sort((a, b) => a.date.localeCompare(b.date));
  return summaries;
}

interface MetricExtractor {
  key: string;
  extract: (r: ParsedCSVRow) => number;
}

const METRIC_EXTRACTORS: MetricExtractor[] = [
  { key: 'co2', extract: r => r.rco2 },
  { key: 'pm25', extract: r => r.pm02 },
  { key: 'voc', extract: r => r.tvoc_raw },
  { key: 'nox', extract: r => r.nox_index },
  { key: 'humidity', extract: r => r.rhum },
  { key: 'temperature', extract: r => r.atmp },
];

export function computeMetrics(rows: ParsedCSVRow[]): Record<string, IAQMetric> {
  if (rows.length === 0) {
    const empty: IAQMetric = { baseline: 0, peak: 0, peakDay: '', current: 0, clearancePct: 0, status: 'good' };
    return Object.fromEntries(METRIC_EXTRACTORS.map(m => [m.key, { ...empty }]));
  }

  const firstDay = rows[0].timestamp;
  const baselineCutoff = new Date(firstDay);
  baselineCutoff.setDate(baselineCutoff.getDate() + 4);

  const lastRow = rows[rows.length - 1].timestamp;
  const last24h = new Date(lastRow);
  last24h.setHours(last24h.getHours() - 24);

  const result: Record<string, IAQMetric> = {};

  for (const { key, extract } of METRIC_EXTRACTORS) {
    const values = rows.map(extract);
    const baselineValues = rows.filter(r => r.timestamp < baselineCutoff).map(extract);
    const currentValues = rows.filter(r => r.timestamp >= last24h).map(extract);

    const baseline = mean(baselineValues.length > 0 ? baselineValues : values);
    const peak = maxVal(values);
    const peakIdx = values.indexOf(peak);
    const peakDay = rows[peakIdx].timestamp.toISOString().split('T')[0];
    const current = mean(currentValues.length > 0 ? currentValues : values.slice(-10));

    const clearancePct = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;

    result[key] = {
      baseline: Math.round(baseline * 10) / 10,
      peak: Math.round(peak * 10) / 10,
      peakDay,
      current: Math.round(current * 10) / 10,
      clearancePct: Math.round(clearancePct * 10) / 10,
      status: deriveStatus(key, current),
    };
  }

  return result;
}
