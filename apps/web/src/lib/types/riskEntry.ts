export interface RiskEntry {
  id: string;
  title: string;
  description: string;
  trade: 'flooring' | 'paint' | 'trim' | 'tile' | 'drywall' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'quality' | 'safety' | 'schedule' | 'material' | 'customer' | 'estimation';
  status: 'open' | 'monitoring' | 'resolved' | 'escalated';
  linkedSopId?: string;
  linkedJobId?: string;
  linkedChangeOrderId?: string;
  linkedLabsObservationId?: string;
  source: 'manual' | 'change_order' | 'checklist_failure' | 'labs_observation';
  triggerCount: number;
  sopFlaggedForReview: boolean;
  sopFlagResolvedAt?: string;
  sopFlagResolvedBy?: string;
  sopUpdateDecision?: 'updated' | 'no_action' | 'deferred';
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  jobsAffected: string[];
  metadata: { createdAt: string; updatedAt: string; version: number };
}

export type RiskTrade = RiskEntry['trade'];
export type RiskSeverity = RiskEntry['severity'];
export type RiskCategory = RiskEntry['category'];
export type RiskStatus = RiskEntry['status'];
export type RiskSource = RiskEntry['source'];

export const RISK_SEVERITY_COLORS: Record<RiskSeverity, string> = {
  low: 'var(--muted)',
  medium: 'var(--blue)',
  high: 'var(--amber)',
  critical: 'var(--red)',
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: 'Open',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  escalated: 'Escalated',
};
