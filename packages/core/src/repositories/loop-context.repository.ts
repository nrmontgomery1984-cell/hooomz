import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoopContext } from '@hooomz/shared';
import type { CreateLoopContextInput } from '../types';

export class LoopContextRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(input: CreateLoopContextInput): Promise<LoopContext> {
    const { data, error } = await this.supabase
      .from('loop_contexts')
      .insert({
        project_id: input.project_id,
        name: input.name,
        parent_context_id: input.parent_context_id || null,
        loop_type: input.loop_type,
        binding_key: input.binding_key || null,
        display_order: input.display_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<LoopContext | null> {
    const { data, error } = await this.supabase
      .from('loop_contexts')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProject(projectId: string): Promise<LoopContext[]> {
    const { data, error } = await this.supabase
      .from('loop_contexts')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async update(id: string, input: Partial<CreateLoopContextInput>): Promise<LoopContext> {
    const { data, error } = await this.supabase
      .from('loop_contexts')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('loop_contexts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
