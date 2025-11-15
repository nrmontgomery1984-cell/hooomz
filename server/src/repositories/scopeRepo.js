import supabase from '../utils/supabase.js'

/**
 * Scope Repository
 * Handles database operations for scope categories, subcategories, and items
 */

// ==================== CATEGORIES ====================

export const createCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from('scope_categories')
    .insert(categoryData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getCategoriesByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('scope_categories')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order')

  if (error) throw error
  return data
}

export const updateCategory = async (categoryId, updates) => {
  const { data, error } = await supabase
    .from('scope_categories')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCategory = async (categoryId) => {
  const { error } = await supabase
    .from('scope_categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
}

// ==================== SUBCATEGORIES ====================

export const createSubcategory = async (subcategoryData) => {
  const { data, error } = await supabase
    .from('scope_subcategories')
    .insert(subcategoryData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getSubcategoriesByCategory = async (categoryId) => {
  const { data, error } = await supabase
    .from('scope_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order')

  if (error) throw error
  return data
}

export const updateSubcategory = async (subcategoryId, updates) => {
  const { data, error } = await supabase
    .from('scope_subcategories')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', subcategoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteSubcategory = async (subcategoryId) => {
  const { error } = await supabase
    .from('scope_subcategories')
    .delete()
    .eq('id', subcategoryId)

  if (error) throw error
}

// ==================== SCOPE ITEMS ====================

export const createScopeItem = async (itemData) => {
  const { data, error } = await supabase
    .from('scope_items')
    .insert(itemData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getScopeItemsBySubcategory = async (subcategoryId) => {
  const { data, error } = await supabase
    .from('scope_items')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .order('display_order')

  if (error) throw error
  return data
}

export const getScopeItemById = async (itemId) => {
  const { data, error } = await supabase
    .from('scope_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) throw error
  return data
}

export const updateScopeItem = async (itemId, updates) => {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  }

  // Convert empty string to null for UUID fields
  if (updateData.assignee_id === '') {
    updateData.assignee_id = null
  }

  // If status is being set to completed, add completed_at timestamp
  if (updates.status === 'completed' && !updates.completed_at) {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('scope_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteScopeItem = async (itemId) => {
  const { error } = await supabase
    .from('scope_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

/**
 * Get all scope items for a project (across all categories/subcategories)
 * Used for time tracker dropdown
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of scope items with category/subcategory info
 */
export const getAllScopeItemsByProject = async (projectId) => {
  // First get all categories for this project
  const { data: categories, error: catError } = await supabase
    .from('scope_categories')
    .select('id')
    .eq('project_id', projectId)

  if (catError) throw catError

  if (!categories || categories.length === 0) {
    return []
  }

  const categoryIds = categories.map(c => c.id)

  // Then get all subcategories for these categories
  const { data: subcategories, error: subError } = await supabase
    .from('scope_subcategories')
    .select('id')
    .in('category_id', categoryIds)

  if (subError) throw subError

  if (!subcategories || subcategories.length === 0) {
    return []
  }

  const subcategoryIds = subcategories.map(s => s.id)

  // Finally get all scope items with full nested data
  const { data, error } = await supabase
    .from('scope_items')
    .select(`
      *,
      subcategory:scope_subcategories (
        id,
        name,
        category:scope_categories (
          id,
          name,
          project_id
        )
      )
    `)
    .in('subcategory_id', subcategoryIds)
    .order('display_order')

  if (error) throw error
  return data || []
}

// ==================== SCOPE ITEM DETAILS (Tools, Materials, Checklist, Photos) ====================

/**
 * Get full details for a scope item (tools, materials, checklist, photos)
 * @param {string} itemId - Scope item ID
 * @returns {Promise<Object>} Object with materials, tools, checklist, and photos arrays
 */
export const getScopeItemDetails = async (itemId) => {
  console.log('[getScopeItemDetails] START - itemId:', itemId)

  // Get the scope item with its subcategory and category info
  const { data: itemData, error: itemError } = await supabase
    .from('scope_items')
    .select(`
      *,
      subcategory:scope_subcategories!inner(
        id,
        name,
        category:scope_categories!inner(
          id,
          name,
          project_id
        )
      )
    `)
    .eq('id', itemId)
    .single()

  if (itemError) {
    console.error('[getScopeItemDetails] Error fetching item:', itemError)
    throw itemError
  }

  // Get project members for assignee dropdown
  const projectId = itemData?.subcategory?.category?.project_id
  console.log('[getScopeItemDetails] Extracted projectId:', projectId)

  let projectMembers = []

  if (projectId) {
    console.log('[getScopeItemDetails] Fetching project members for project:', projectId)

    // Get project members
    const { data: membersData, error: membersError } = await supabase
      .from('project_members')
      .select('id, user_id, role')
      .eq('project_id', projectId)
      .order('created_at')

    console.log('[getScopeItemDetails] Project members query result:', {
      error: membersError,
      dataLength: membersData?.length || 0,
      data: membersData
    })

    if (!membersError && membersData && membersData.length > 0) {
      console.log('[getScopeItemDetails] Fetching all users from auth.users...')

      // Get user details from auth.users for all members
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

      console.log('[getScopeItemDetails] Users query result:', {
        error: usersError,
        usersCount: users?.length || 0
      })

      if (!usersError && users) {
        // Map members to include user email and name
        projectMembers = membersData.map(member => {
          const user = users.find(u => u.id === member.user_id)
          console.log('[getScopeItemDetails] Mapping member:', {
            member_user_id: member.user_id,
            found_user: !!user,
            user_email: user?.email
          })

          return {
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            email: user?.email || 'Unknown',
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Team Member'
          }
        })

        console.log('[getScopeItemDetails] FINAL project members:', JSON.stringify({
          projectId,
          membersCount: projectMembers.length,
          members: projectMembers
        }))
      } else if (usersError) {
        console.error('[getScopeItemDetails] Error fetching users:', usersError)
      }
    } else if (membersError) {
      console.error('[getScopeItemDetails] Error fetching members:', membersError)
    } else {
      console.log('[getScopeItemDetails] No project members found for project:', projectId)
    }
  } else {
    console.log('[getScopeItemDetails] No projectId found in itemData')
  }

  const [materials, tools, checklist, photos] = await Promise.all([
    getScopeItemMaterials(itemId),
    getScopeItemTools(itemId),
    getScopeItemChecklist(itemId),
    getScopeItemPhotos(itemId)
  ])

  return {
    materials,
    tools,
    checklist,
    photos,
    projectMembers,
    category: itemData?.subcategory?.category?.name || null,
    subcategory: itemData?.subcategory?.name || null,
    categoryId: itemData?.subcategory?.category?.id || null,
    subcategoryId: itemData?.subcategory?.id || null
  }
}

// Materials
export const getScopeItemMaterials = async (itemId) => {
  const { data, error } = await supabase
    .from('scope_item_materials')
    .select('*')
    .eq('scope_item_id', itemId)
    .order('display_order')

  if (error) throw error
  return data || []
}

export const updateScopeItemMaterials = async (itemId, materials) => {
  // Delete existing materials
  await supabase
    .from('scope_item_materials')
    .delete()
    .eq('scope_item_id', itemId)

  // Insert new materials
  if (materials && materials.length > 0) {
    const materialsWithItemId = materials.map((m, index) => ({
      ...m,
      scope_item_id: itemId,
      display_order: m.display_order || index
    }))

    const { data, error } = await supabase
      .from('scope_item_materials')
      .insert(materialsWithItemId)
      .select()

    if (error) throw error
    return data
  }

  return []
}

// Tools
export const getScopeItemTools = async (itemId) => {
  const { data, error } = await supabase
    .from('scope_item_tools')
    .select('*')
    .eq('scope_item_id', itemId)
    .order('display_order')

  if (error) throw error
  return data || []
}

export const updateScopeItemTools = async (itemId, tools) => {
  // Delete existing tools
  await supabase
    .from('scope_item_tools')
    .delete()
    .eq('scope_item_id', itemId)

  // Insert new tools
  if (tools && tools.length > 0) {
    const toolsWithItemId = tools.map((t, index) => ({
      ...t,
      scope_item_id: itemId,
      display_order: t.display_order || index
    }))

    const { data, error} = await supabase
      .from('scope_item_tools')
      .insert(toolsWithItemId)
      .select()

    if (error) throw error
    return data
  }

  return []
}

// Checklist
export const getScopeItemChecklist = async (itemId) => {
  const { data, error } = await supabase
    .from('scope_item_checklist')
    .select('*')
    .eq('scope_item_id', itemId)
    .order('display_order')

  if (error) throw error
  return data || []
}

export const updateScopeItemChecklist = async (itemId, checklist) => {
  // Delete existing checklist items
  await supabase
    .from('scope_item_checklist')
    .delete()
    .eq('scope_item_id', itemId)

  // Insert new checklist items
  if (checklist && checklist.length > 0) {
    const checklistWithItemId = checklist.map((c, index) => ({
      ...c,
      scope_item_id: itemId,
      display_order: c.display_order || index
    }))

    const { data, error } = await supabase
      .from('scope_item_checklist')
      .insert(checklistWithItemId)
      .select()

    if (error) throw error
    return data
  }

  return []
}

export const toggleChecklistItem = async (checklistItemId, isCompleted) => {
  const updateData = {
    is_completed: isCompleted
  }

  if (isCompleted) {
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_at = null
  }

  const { data, error } = await supabase
    .from('scope_item_checklist')
    .update(updateData)
    .eq('id', checklistItemId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Photos
export const getScopeItemPhotos = async (itemId) => {
  const { data, error } = await supabase
    .from('scope_item_photos')
    .select('*')
    .eq('scope_item_id', itemId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const addScopeItemPhoto = async (photoData) => {
  const { data, error } = await supabase
    .from('scope_item_photos')
    .insert(photoData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteScopeItemPhoto = async (photoId) => {
  const { error } = await supabase
    .from('scope_item_photos')
    .delete()
    .eq('id', photoId)

  if (error) throw error
}
