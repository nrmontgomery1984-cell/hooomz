import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { validate, schemas } from '../middleware/validation.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * All routes require authentication
 */
router.use(authMiddleware)

// GET /api/homes/:homeId/maintenance
router.get('/homes/:homeId/maintenance', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('next_due', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/maintenance
router.post('/homes/:homeId/maintenance', validate(schemas.createMaintenance), async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('maintenance')
      .insert({
        ...req.body,
        home_id: req.params.homeId
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/maintenance/:taskId/complete - Mark task as complete
router.post('/:taskId/complete', async (req, res, next) => {
  try {
    // TODO: Calculate next due date based on frequency
    const { data, error } = await supabase
      .from('maintenance')
      .update({
        last_completed: new Date().toISOString()
        // next_due: calculated based on frequency
      })
      .eq('id', req.params.taskId)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Task not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// PUT /api/maintenance/:taskId
router.put('/:taskId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .update(req.body)
      .eq('id', req.params.taskId)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Task not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/maintenance/:taskId
router.delete('/:taskId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('maintenance')
      .delete()
      .eq('id', req.params.taskId)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
