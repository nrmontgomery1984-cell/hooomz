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

// GET /api/homes/:homeId/rooms - Get all rooms for a home
router.get('/homes/:homeId/rooms', async (req, res, next) => {
  try {
    // Verify home ownership
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/rooms - Create room
router.post('/homes/:homeId/rooms', validate(schemas.createRoom), async (req, res, next) => {
  try {
    // Verify home ownership
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('rooms')
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

// PUT /api/rooms/:roomId - Update room
router.put('/:roomId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update(req.body)
      .eq('id', req.params.roomId)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Room not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/rooms/:roomId - Delete room
router.delete('/:roomId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', req.params.roomId)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
