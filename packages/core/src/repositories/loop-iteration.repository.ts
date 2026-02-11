import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoopIteration, LoopStatus } from '@hooomz/shared';
import type { CreateLoopIterationInput, UpdateLoopIterationInput } from '../types';

export class LoopIterationRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateLoopIterationInput): Promise<LoopIteration> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .insert({
        context_id: input.context_id,
        project_id: input.project_id,
        name: input.name,
        parent_iteration_id: input.parent_iteration_id || null,
        display_order: input.display_order || 0,
        computed_status: 'not_started',
        child_counts: { total: 0, not_started: 0, in_progress: 0, blocked: 0, complete: 0 },
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<LoopIteration | null> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProject(projectId: string): Promise<LoopIteration[]> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async findByContext(contextId: string): Promise<LoopIteration[]> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .select('*')
      .eq('context_id', contextId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async findChildren(parentId: string): Promise<LoopIteration[]> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .select('*')
      .eq('parent_iteration_id', parentId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async findRootIterations(projectId: string): Promise<LoopIteration[]> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .select('*')
      .eq('project_id', projectId)
      .is('parent_iteration_id', null)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async update(id: string, input: UpdateLoopIterationInput): Promise<LoopIteration> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: LoopStatus): Promise<LoopIteration> {
    return this.update(id, { computed_status: status });
  }

  async updateChildCounts(id: string, counts: LoopIteration['child_counts']): Promise<LoopIteration> {
    const { data, error } = await this.supabase
      .from('loop_iterations')
      .update({ child_counts: counts })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('loop_iterations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
