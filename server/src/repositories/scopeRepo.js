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
