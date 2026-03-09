/**
 * Production Score Service
 *
 * Pure function: computeProductionScore → { score, color, hex, statusLine, stageProgress[] }
 *
 * Score weights:
 *   Stage health    40pts
 *   Punch items     20pts
 *   Pending decisions 15pts
 *   Last update age 15pts
 *   Stage completion 10pts
 */

import type { ThreeDotColor } from '../constants/threeDot';
import { scoreToThreeDot, THREE_DOT_HEX } from '../constants/threeDot';
import type { JobStage } from '@hooomz/shared-contracts';
import { SCRIPT_STAGES } from '@hooomz/shared-contracts';

export interface StageProgressEntry {
  stage: string;
  label: string;
  status: 'done' | 'active' | 'upcoming';
}

export interface ProductionScoreResult {
  score: number;
  color: ThreeDotColor;
  hex: string;
  statusLine: string;
  stageProgress: StageProgressEntry[];
}

interface ProductionScoreInput {
  completedTasks: number;
  totalTasks: number;
  openPunchCount: number;
  lastActivityAgeHours: number;
  pendingDecisionCount: number;
  currentStage: JobStage | undefined;
  stageHealthScore: number; // 0-100 from jobHealth
}

export function computeProductionScore(input: ProductionScoreInput): ProductionScoreResult {
  const {
    completedTasks, totalTasks,
    openPunchCount, lastActivityAgeHours,
    pendingDecisionCount, currentStage, stageHealthScore,
  } = input;

  // Stage health (40 pts)
  const stageHealth = Math.round(stageHealthScore * 0.4);

  // Punch items (20 pts) — 0 open = full, each open deducts 5 (capped)
  const punchDeduction = Math.min(openPunchCount * 5, 20);
  const punchScore = 20 - punchDeduction;

  // Pending decisions (15 pts) — 0 pending = full, each deducts 5
  const decisionDeduction = Math.min(pendingDecisionCount * 5, 15);
  const decisionScore = 15 - decisionDeduction;

  // Last update age (15 pts) — < 24h = full, > 72h = 0
  let ageScore = 15;
  if (lastActivityAgeHours > 72) ageScore = 0;
  else if (lastActivityAgeHours > 48) ageScore = 5;
  else if (lastActivityAgeHours > 24) ageScore = 10;

  // Stage completion (10 pts) — task completion %
  const completionPct = totalTasks > 0 ? completedTasks / totalTasks : 1;
  const completionScore = Math.round(completionPct * 10);

  const score = Math.min(100, Math.max(0,
    stageHealth + punchScore + decisionScore + ageScore + completionScore
  ));

  const color = scoreToThreeDot(score);

  // Status line
  let statusLine: string;
  if (score >= 80) statusLine = 'Your project is on track';
  else if (score >= 60) statusLine = 'Good progress — a few items need attention';
  else if (score >= 40) statusLine = 'Some items require attention';
  else statusLine = 'Your project needs attention';

  // SCRIPT stage progress
  const stageProgress: StageProgressEntry[] = SCRIPT_STAGES.map((s) => {
    const stageIndex = currentStage ? SCRIPT_STAGES.indexOf(currentStage as typeof SCRIPT_STAGES[number]) : -1;
    const thisIndex = SCRIPT_STAGES.indexOf(s);
    let status: 'done' | 'active' | 'upcoming';
    if (thisIndex < stageIndex) status = 'done';
    else if (thisIndex === stageIndex) status = 'active';
    else status = 'upcoming';
    return { stage: s, label: s.charAt(0).toUpperCase() + s.slice(1), status };
  });

  return {
    score,
    color,
    hex: THREE_DOT_HEX[color],
    statusLine,
    stageProgress,
  };
}
