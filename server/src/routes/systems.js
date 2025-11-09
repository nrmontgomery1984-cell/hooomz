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

// GET /api/homes/:homeId/systems
router.get('/homes/:homeId/systems', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('systems')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/systems
router.post('/homes/:homeId/systems', validate(schemas.createSystem), async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('systems')
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

// PUT /api/systems/:systemId
router.put('/:systemId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('systems')
      .update(req.body)
      .eq('id', req.params.systemId)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'System not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/systems/:systemId
router.delete('/:systemId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('systems')
      .delete()
      .eq('id', req.params.systemId)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
