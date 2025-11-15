import supabase from '../utils/supabase.js'

/**
 * Change Order Repository
 * Manages change orders and uncaptured labour tracking
 */

// ============================================================================
// CHANGE ORDERS
// ============================================================================

/**
 * Get all change orders for a project with pagination
 */
export const getProjectChangeOrders = async (projectId, filters = {}, pagination = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = pagination

  const offset = (page - 1) * limit

  let query = supabase
    .from('change_orders')
    .select(`
      *,
      created_by_user:created_by(id, email, full_name),
      approved_by_user:approved_by(id, email, full_name),
      task_instance:task_instances(
        id,
        description,
        location_path,
        template:task_templates(id, name)
      )
    `, { count: 'exact' })
    .eq('project_id', projectId)

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.source) {
    query = query.eq('source', filters.source)
  }
  if (filters.instance_id) {
    query = query.eq('instance_id', filters.instance_id)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      hasMore: page * limit < (count || 0)
    }
  }
}

/**
 * Get single change order by ID
 */
export const getChangeOrderById = async (coId) => {
  const { data, error } = await supabase
    .from('change_orders')
    .select(`
      *,
      created_by_user:created_by(id, email, full_name),
      approved_by_user:approved_by(id, email, full_name),
      task_instance:task_instances(
        id,
        description,
        location_path,
        template:task_templates(id, name, category_id)
      )
    `)
    .eq('id', coId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a change order
 * Auto-generates CO number
 */
export const createChangeOrder = async (projectId, coData, userId) => {
  // Get next CO number for project
  const { data: existing, error: countError } = await supabase
    .from('change_orders')
    .select('co_number')
    .eq('project_id', projectId)
    .order('co_number', { ascending: false })
    .limit(1)

  if (countError) throw countError

  const nextNumber = existing && existing.length > 0
    ? parseInt(existing[0].co_number.split('-')[1]) + 1
    : 1

  const coNumber = `CO-${String(nextNumber).padStart(4, '0')}`

  // Create change order
  const { data, error } = await supabase
    .from('change_orders')
    .insert({
      project_id: projectId,
      co_number: coNumber,
      status: 'pending',
      created_by: userId,
      ...coData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a change order
 */
export const updateChangeOrder = async (coId, updates) => {
  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', coId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Approve a change order
 */
export const approveChangeOrder = async (coId, userId, notes = null) => {
  const updates = {
    status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString(),
    approval_notes: notes
  }

  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', coId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reject a change order
 */
export const rejectChangeOrder = async (coId, userId, reason) => {
  const updates = {
    status: 'rejected',
    approved_by: userId,
    approved_at: new Date().toISOString(),
    rejection_reason: reason
  }

  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', coId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a change order (only if pending)
 */
export const deleteChangeOrder = async (coId) => {
  // Check status
  const { data: co, error: getError } = await supabase
    .from('change_orders')
    .select('status')
    .eq('id', coId)
    .single()

  if (getError) throw getError

  if (co.status !== 'pending') {
    throw new Error('Cannot delete approved or rejected change orders')
  }

  const { error } = await supabase
    .from('change_orders')
    .delete()
    .eq('id', coId)

  if (error) throw error
  return { success: true }
}

// ============================================================================
// CHANGE ORDER STATISTICS
// ============================================================================

/**
 * Get change order summary for project
 */
export const getChangeOrderSummary = async (projectId) => {
  const { data, error } = await supabase
    .from('change_orders')
    .select('status, material_cost_delta, labor_hours_delta, total_cost_delta')
    .eq('project_id', projectId)

  if (error) throw error

  const summary = {
    total_cos: data.length,
    pending: data.filter(co => co.status === 'pending').length,
    approved: data.filter(co => co.status === 'approved').length,
    rejected: data.filter(co => co.status === 'rejected').length,
    total_material_impact: 0,
    total_labor_impact: 0,
    total_cost_impact: 0,
    approved_material_impact: 0,
    approved_labor_impact: 0,
    approved_cost_impact: 0
  }

  data.forEach(co => {
    summary.total_material_impact += co.material_cost_delta || 0
    summary.total_labor_impact += co.labor_hours_delta || 0
    summary.total_cost_impact += co.total_cost_delta || 0

    if (co.status === 'approved') {
      summary.approved_material_impact += co.material_cost_delta || 0
      summary.approved_labor_impact += co.labor_hours_delta || 0
      summary.approved_cost_impact += co.total_cost_delta || 0
    }
  })

  return summary
}

// ============================================================================
// UNCAPTURED LABOUR
// ============================================================================

/**
 * Get uncaptured labour log for a project
 */
export const getUncapturedLabour = async (projectId, filters = {}, pagination = {}) => {
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = pagination

  const offset = (page - 1) * limit

  let query = supabase
    .from('uncaptured_labour_log')
    .select(`
      *,
      logged_by_user:logged_by(id, email, full_name),
      task_instance:task_instances(
        id,
        description,
        location_path,
        template:task_templates(id, name)
      )
    `, { count: 'exact' })
    .eq('project_id', projectId)

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.instance_id) {
    query = query.eq('instance_id', filters.instance_id)
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      hasMore: page * limit < (count || 0)
    }
  }
}

/**
 * Log uncaptured labour
 * Used when material cost changes but no CO is created
 */
export const logUncapturedLabour = async (projectId, labourData, userId) => {
  const { data, error } = await supabase
    .from('uncaptured_labour_log')
    .insert({
      project_id: projectId,
      logged_by: userId,
      status: 'pending',
      ...labourData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update uncaptured labour entry
 */
export const updateUncapturedLabour = async (logId, updates) => {
  const { data, error } = await supabase
    .from('uncaptured_labour_log')
    .update(updates)
    .eq('id', logId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Convert uncaptured labour to change order
 */
export const convertUncapturedLabourToCO = async (logId, userId) => {
  // Get labour log entry
  const { data: labour, error: getError } = await supabase
    .from('uncaptured_labour_log')
    .select(`
      *,
      task_instance:task_instances(
        id,
        description,
        template:task_templates(project_id)
      )
    `)
    .eq('id', logId)
    .single()

  if (getError) throw getError

  if (labour.status !== 'pending') {
    throw new Error('Only pending uncaptured labour can be converted to CO')
  }

  // Create change order from labour entry
  const co = await createChangeOrder(
    labour.project_id,
    {
      instance_id: labour.instance_id,
      source: 'uncaptured_labour',
      reason: labour.reason,
      material_cost_delta: labour.material_cost_delta || 0,
      labor_hours_delta: labour.labor_hours_delta || 0,
      total_cost_delta: labour.total_cost_delta || 0,
      description: `Converted from uncaptured labour: ${labour.reason}`
    },
    userId
  )

  // Update labour log status
  await updateUncapturedLabour(logId, {
    status: 'converted_to_co',
    converted_co_id: co.id,
    converted_at: new Date().toISOString(),
    converted_by: userId
  })

  return co
}

/**
 * Delete uncaptured labour entry (only if pending)
 */
export const deleteUncapturedLabour = async (logId) => {
  // Check status
  const { data: log, error: getError } = await supabase
    .from('uncaptured_labour_log')
    .select('status')
    .eq('id', logId)
    .single()

  if (getError) throw getError

  if (log.status !== 'pending') {
    throw new Error('Cannot delete converted or resolved uncaptured labour')
  }

  const { error } = await supabase
    .from('uncaptured_labour_log')
    .delete()
    .eq('id', logId)

  if (error) throw error
  return { success: true }
}

/**
 * Get uncaptured labour summary for project
 */
export const getUncapturedLabourSummary = async (projectId) => {
  const { data, error } = await supabase
    .from('uncaptured_labour_log')
    .select('status, material_cost_delta, labor_hours_delta, total_cost_delta')
    .eq('project_id', projectId)

  if (error) throw error

  const summary = {
    total_entries: data.length,
    pending: data.filter(log => log.status === 'pending').length,
    converted_to_co: data.filter(log => log.status === 'converted_to_co').length,
    resolved: data.filter(log => log.status === 'resolved').length,
    total_material_impact: 0,
    total_labor_impact: 0,
    total_cost_impact: 0,
    pending_material_impact: 0,
    pending_labor_impact: 0,
    pending_cost_impact: 0
  }

  data.forEach(log => {
    summary.total_material_impact += log.material_cost_delta || 0
    summary.total_labor_impact += log.labor_hours_delta || 0
    summary.total_cost_impact += log.total_cost_delta || 0

    if (log.status === 'pending') {
      summary.pending_material_impact += log.material_cost_delta || 0
      summary.pending_labor_impact += log.labor_hours_delta || 0
      summary.pending_cost_impact += log.total_cost_delta || 0
    }
  })

  return summary
}

// ============================================================================
// COMBINED FINANCIAL IMPACT
// ============================================================================

/**
 * Get combined financial impact from COs and uncaptured labour
 */
export const getProjectFinancialImpact = async (projectId) => {
  const [coSummary, labourSummary] = await Promise.all([
    getChangeOrderSummary(projectId),
    getUncapturedLabourSummary(projectId)
  ])

  return {
    change_orders: coSummary,
    uncaptured_labour: labourSummary,
    combined_impact: {
      total_material: coSummary.total_material_impact + labourSummary.total_material_impact,
      total_labor: coSummary.total_labor_impact + labourSummary.total_labor_impact,
      total_cost: coSummary.total_cost_impact + labourSummary.total_cost_impact,
      approved_and_pending_material: coSummary.approved_material_impact + labourSummary.pending_material_impact,
      approved_and_pending_labor: coSummary.approved_labor_impact + labourSummary.pending_labor_impact,
      approved_and_pending_cost: coSummary.approved_cost_impact + labourSummary.pending_cost_impact
    }
  }
}

// Export as default object
export default {
  getProjectChangeOrders,
  getChangeOrderById,
  createChangeOrder,
  updateChangeOrder,
  approveChangeOrder,
  rejectChangeOrder,
  deleteChangeOrder,
  getChangeOrderSummary,
  getUncapturedLabour,
  logUncapturedLabour,
  updateUncapturedLabour,
  convertUncapturedLabourToCO,
  deleteUncapturedLabour,
  getUncapturedLabourSummary,
  getProjectFinancialImpact
}
