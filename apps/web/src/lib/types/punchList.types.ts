/**
 * Punch List Types
 */

export type PunchListPriority = 'critical' | 'major' | 'minor';
export type PunchListStatus = 'open' | 'in_progress' | 'resolved' | 'verified';

export interface PunchListItem {
  id: string;
  projectId: string;
  description: string;
  location: string;
  tradeCode: string;
  priority: PunchListPriority;
  status: PunchListStatus;
  assignedTo: string | null;
  photos: string[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

export interface CreatePunchListItem {
  projectId: string;
  description: string;
  location: string;
  tradeCode: string;
  priority: PunchListPriority;
  assignedTo?: string | null;
  photos?: string[];
}
