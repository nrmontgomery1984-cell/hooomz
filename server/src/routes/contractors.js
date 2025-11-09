import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/homes/:homeId/contractor-work
router.get('/homes/:homeId/contractor-work', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('contractor_work')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/contractor-work
router.post('/homes/:homeId/contractor-work', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('contractor_work')
      .insert({
        ...req.body,
        home_id: req.params.homeId,
        contractor_id: req.user.id
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// PUT /api/contractor-work/:workId
router.put('/:workId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('contractor_work')
      .update(req.body)
      .eq('id', req.params.workId)
      .eq('contractor_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Work record not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/contractor-work/:workId
router.delete('/:workId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('contractor_work')
      .delete()
      .eq('id', req.params.workId)
      .eq('contractor_id', req.user.id)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
