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

// GET /api/homes/:homeId/documents
router.get('/homes/:homeId/documents', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/documents
router.post('/homes/:homeId/documents', validate(schemas.createDocument), async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('documents')
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

// DELETE /api/documents/:documentId
router.delete('/:documentId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.documentId)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
