/**
 * Punch List Service
 *
 * Wraps repository + activity logging for create/resolve/verify/reopen.
 */

import type { ActivityService } from '../repositories/activity.repository';
import type { PunchListRepository } from '../repositories/punchList.repository';
import type { PunchListItem, CreatePunchListItem, PunchListStatus } from '../types/punchList.types';

export class PunchListService {
  constructor(
    private repo: PunchListRepository,
    private activity: ActivityService,
  ) {}

  async create(data: CreatePunchListItem): Promise<PunchListItem> {
    const item = await this.repo.create(data);
    await this.activity.create({
      event_type: 'punch_list.created',
      entity_type: 'punch_list_item',
      entity_id: item.id,
      project_id: data.projectId,
      summary: `Punch list item created: ${data.description}`,
      event_data: { priority: data.priority, location: data.location },
    });
    return item;
  }

  async resolve(id: string): Promise<PunchListItem> {
    const item = await this.repo.update(id, { status: 'resolved' });
    await this.activity.create({
      event_type: 'punch_list.resolved',
      entity_type: 'punch_list_item',
      entity_id: id,
      project_id: item.projectId,
      summary: `Punch list item resolved: ${item.description}`,
    });
    return item;
  }

  async verify(id: string): Promise<PunchListItem> {
    const item = await this.repo.update(id, { status: 'verified' });
    await this.activity.create({
      event_type: 'punch_list.verified',
      entity_type: 'punch_list_item',
      entity_id: id,
      project_id: item.projectId,
      summary: `Punch list item verified: ${item.description}`,
    });
    return item;
  }

  async reopen(id: string): Promise<PunchListItem> {
    const item = await this.repo.update(id, { status: 'open' });
    await this.activity.create({
      event_type: 'punch_list.reopened',
      entity_type: 'punch_list_item',
      entity_id: id,
      project_id: item.projectId,
      summary: `Punch list item reopened: ${item.description}`,
    });
    return item;
  }

  async updateStatus(id: string, status: PunchListStatus): Promise<PunchListItem> {
    return this.repo.update(id, { status });
  }

  async findByProject(projectId: string): Promise<PunchListItem[]> {
    return this.repo.findByProject(projectId);
  }

  async findOpenByProject(projectId: string): Promise<PunchListItem[]> {
    return this.repo.findOpenByProject(projectId);
  }

  async countOpenByProject(projectId: string): Promise<number> {
    return this.repo.countOpenByProject(projectId);
  }

  async delete(id: string): Promise<void> {
    const item = await this.repo.findById(id);
    await this.repo.delete(id);
    if (item) {
      await this.activity.create({
        event_type: 'punch_list.deleted',
        entity_type: 'punch_list_item',
        entity_id: id,
        project_id: item.projectId,
        summary: `Punch list item deleted: ${item.description}`,
      });
    }
  }
}
