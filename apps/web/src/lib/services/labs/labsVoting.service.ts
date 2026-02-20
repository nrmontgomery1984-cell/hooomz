/**
 * Labs Voting Service
 * Manages weekly partner research voting ballots
 */

import type { LabsVoteBallot, LabsVote, BallotStatus, PartnerTier } from '@hooomz/shared-contracts';
import type { LabsVoteBallotRepository } from '../../repositories/labs/labsVoteBallot.repository';
import type { LabsVoteRepository } from '../../repositories/labs/labsVote.repository';
import type { ActivityService } from '../../repositories/activity.repository';

export interface VoteResult {
  testId: string;
  title: string;
  description: string;
  voteCount: number;
}

export class LabsVotingService {
  constructor(
    private ballotRepo: LabsVoteBallotRepository,
    private voteRepo: LabsVoteRepository,
    private activity: ActivityService
  ) {}

  async createBallot(data: Omit<LabsVoteBallot, 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<LabsVoteBallot> {
    const ballot = await this.ballotRepo.create(data);

    this.activity.logLabsEvent('labs.ballot_created', ballot.id, {
      entity_name: `Week ${ballot.id}`,
      options: ballot.options.map((o) => o.title),
    }).catch((err) => console.error('Failed to log labs.ballot_created:', err));

    return ballot;
  }

  async createBallotWithId(data: LabsVoteBallot): Promise<LabsVoteBallot> {
    return this.ballotRepo.createWithId(data);
  }

  async openBallot(id: string): Promise<LabsVoteBallot | null> {
    const updated = await this.ballotRepo.update(id, { status: 'active' });
    if (!updated) return null;

    this.activity.logLabsEvent('labs.ballot_opened', id, {
      entity_name: `Week ${id}`,
    }).catch((err) => console.error('Failed to log labs.ballot_opened:', err));

    return updated;
  }

  async closeBallot(id: string): Promise<LabsVoteBallot | null> {
    const updated = await this.ballotRepo.update(id, { status: 'closed' });
    if (!updated) return null;

    this.activity.logLabsEvent('labs.ballot_closed', id, {
      entity_name: `Week ${id}`,
      total_votes: updated.totalVotes,
      winner: updated.options.reduce((a, b) => a.voteCount > b.voteCount ? a : b).title,
    }).catch((err) => console.error('Failed to log labs.ballot_closed:', err));

    return updated;
  }

  /** Cast a vote — enforces one vote per partner per ballot */
  async castVote(
    ballotId: string,
    testId: string,
    partnerId: string,
    partnerTier: PartnerTier
  ): Promise<LabsVote | null> {
    // Check for duplicate vote
    const existing = await this.voteRepo.findByBallotAndVoter(ballotId, partnerId);
    if (existing) return null; // Already voted

    // Verify ballot is active
    const ballot = await this.ballotRepo.findById(ballotId);
    if (!ballot || ballot.status !== 'active') return null;

    // Create vote
    const vote = await this.voteRepo.create({
      ballotId,
      testId,
      partnerId,
      partnerTier,
      votedAt: new Date().toISOString(),
    });

    // Update ballot option vote count and total
    const updatedOptions = ballot.options.map((opt) => ({
      ...opt,
      voteCount: opt.testId === testId ? opt.voteCount + 1 : opt.voteCount,
    }));
    await this.ballotRepo.update(ballotId, {
      options: updatedOptions,
      totalVotes: ballot.totalVotes + 1,
    });

    this.activity.logLabsEvent('labs.vote_cast', vote.id, {
      ballot_id: ballotId,
      test_id: testId,
      partner_id: partnerId,
    }).catch((err) => console.error('Failed to log labs.vote_cast:', err));

    return vote;
  }

  async hasVoted(ballotId: string, partnerId: string): Promise<boolean> {
    const existing = await this.voteRepo.findByBallotAndVoter(ballotId, partnerId);
    return existing !== null;
  }

  async getResults(ballotId: string): Promise<VoteResult[]> {
    const ballot = await this.ballotRepo.findById(ballotId);
    if (!ballot) return [];

    return ballot.options.map((opt) => ({
      testId: opt.testId,
      title: opt.title,
      description: opt.description,
      voteCount: opt.voteCount,
    }));
  }

  async findAllBallots(): Promise<LabsVoteBallot[]> {
    return this.ballotRepo.findAll();
  }

  async findBallotById(id: string): Promise<LabsVoteBallot | null> {
    return this.ballotRepo.findById(id);
  }

  async findActiveBallot(): Promise<LabsVoteBallot | null> {
    return this.ballotRepo.findActive();
  }

  async findBallotsByStatus(status: BallotStatus): Promise<LabsVoteBallot[]> {
    return this.ballotRepo.findByStatus(status);
  }

  async findVotesByBallot(ballotId: string): Promise<LabsVote[]> {
    return this.voteRepo.findByBallotId(ballotId);
  }
}
