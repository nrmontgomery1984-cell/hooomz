import express from 'express'
import supabase from '../utils/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply authentication to all routes
router.use(authMiddleware)

/**
 * GET /api/contacts
 * Get all contacts for the authenticated user
 * Query params:
 *   - type: filter by contact_type (contractor|vendor)
 *   - trade: filter by trade_specialty
 *   - favorite: filter favorites only (true/false)
 *   - project: filter by project_id (contacts who worked on this project)
 */
router.get('/', async (req, res) => {
  try {
    const { type, trade, favorite, project } = req.query

    // If filtering by project, use a different query
    if (project) {
      const { data, error } = await supabase
        .from('project_contacts')
        .select(`
          contact_id,
          role,
          contacts (
            id,
            name,
            company,
            phone,
            email,
            address,
            trade_specialty,
            contact_type,
            notes,
            is_favorite,
            created_at,
            updated_at
          )
        `)
        .eq('project_id', project)

      if (error) throw error

      // Flatten the response and add role info
      const contacts = data.map(pc => ({
        ...pc.contacts,
        project_role: pc.role
      }))

      return res.json(contacts)
    }

    // Standard contact query
    let query = supabase
      .from('contacts')
      .select('*')
      .or(`created_by.eq.${req.user.id},created_by.is.null`) // User's contacts + system contacts
      .is('deleted_at', null)
      .order('name')

    // Apply filters
    if (type) {
      query = query.eq('contact_type', type)
    }
    if (trade) {
      query = query.eq('trade_specialty', trade)
    }
    if (favorite === 'true') {
      query = query.eq('is_favorite', true)
    }

    const { data, error } = await query

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/contacts/:id
 * Get a single contact by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    if (!data) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching contact:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post('/', async (req, res) => {
  try {
    const { name, company, phone, email, trade_specialty, contact_type, notes, is_favorite } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        created_by: req.user.id,
        name,
        company,
        phone,
        email,
        trade_specialty,
        contact_type: contact_type || 'contractor',
        notes,
        is_favorite: is_favorite || false
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating contact:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, company, phone, email, trade_specialty, contact_type, notes, is_favorite } = req.body

    // Check ownership (only creator can update, unless it's a system contact they favorited)
    const { data: existing, error: fetchError } = await supabase
      .from('contacts')
      .select('created_by')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (fetchError) throw fetchError
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    // System contacts (created_by = null) can only have is_favorite updated
    if (existing.created_by === null) {
      if (is_favorite !== undefined) {
        const { data, error } = await supabase
          .from('contacts')
          .update({ is_favorite })
          .eq('id', req.params.id)
          .select()
          .single()

        if (error) throw error
        return res.json(data)
      } else {
        return res.status(403).json({ error: 'Cannot modify system contacts' })
      }
    }

    // User can only update their own contacts
    if (existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this contact' })
    }

    const { data, error } = await supabase
      .from('contacts')
      .update({
        name,
        company,
        phone,
        email,
        trade_specialty,
        contact_type,
        notes,
        is_favorite
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('Error updating contact:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/contacts/:id
 * Soft delete a contact (only user-created contacts can be deleted)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('contacts')
      .select('created_by')
      .eq('id', req.params.id)
      .is('deleted_at', null)
      .single()

    if (fetchError) throw fetchError
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    // System contacts cannot be deleted
    if (existing.created_by === null) {
      return res.status(403).json({ error: 'Cannot delete system contacts' })
    }

    // User can only delete their own contacts
    if (existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this contact' })
    }

    // Soft delete
    const { error } = await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/contacts/trades/list
 * Get unique list of trade specialties (for dropdown/filter)
 */
router.get('/trades/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('trade_specialty')
      .or(`created_by.eq.${req.user.id},created_by.is.null`)
      .is('deleted_at', null)
      .not('trade_specialty', 'is', null)

    if (error) throw error

    // Get unique trades
    const uniqueTrades = [...new Set(data.map(c => c.trade_specialty))].sort()
    res.json(uniqueTrades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/contacts/:id/projects
 * Get all projects this contact has worked on
 */
router.get('/:id/projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('project_contacts')
      .select(`
        role,
        added_at,
        projects (
          id,
          name,
          address,
          status,
          client_name,
          start_date,
          target_completion_date
        )
      `)
      .eq('contact_id', req.params.id)
      .order('added_at', { ascending: false })

    if (error) throw error

    const projects = data.map(pc => ({
      ...pc.projects,
      role: pc.role,
      added_at: pc.added_at
    }))

    res.json(projects)
  } catch (error) {
    console.error('Error fetching contact projects:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/contacts/:contactId/projects/:projectId
 * Link a contact to a project
 */
router.post('/:contactId/projects/:projectId', async (req, res) => {
  try {
    const { contactId, projectId } = req.params
    const { role } = req.body

    const { data, error } = await supabase
      .from('project_contacts')
      .insert({
        project_id: projectId,
        contact_id: contactId,
        role: role || null,
        added_by: req.user.id
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate entry
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Contact already linked to this project' })
      }
      throw error
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('Error linking contact to project:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/contacts/:contactId/projects/:projectId
 * Unlink a contact from a project
 */
router.delete('/:contactId/projects/:projectId', async (req, res) => {
  try {
    const { contactId, projectId } = req.params

    const { error } = await supabase
      .from('project_contacts')
      .delete()
      .eq('project_id', projectId)
      .eq('contact_id', contactId)

    if (error) throw error

    res.json({ message: 'Contact unlinked from project successfully' })
  } catch (error) {
    console.error('Error unlinking contact from project:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
