import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/homes/:homeId/realtor-intake
router.get('/homes/:homeId/realtor-intake', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .eq('owner_id', req.user.id)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('realtor_intake')
      .select('*')
      .eq('home_id', req.params.homeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/homes/:homeId/realtor-intake
router.post('/homes/:homeId/realtor-intake', async (req, res, next) => {
  try {
    const { data: home } = await supabase
      .from('homes')
      .select('id')
      .eq('id', req.params.homeId)
      .single()

    if (!home) return res.status(404).json({ error: 'Home not found' })

    const { data, error } = await supabase
      .from('realtor_intake')
      .insert({
        ...req.body,
        home_id: req.params.homeId,
        realtor_id: req.user.id
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// PUT /api/realtor-intake/:intakeId
router.put('/:intakeId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('realtor_intake')
      .update(req.body)
      .eq('id', req.params.intakeId)
      .eq('realtor_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Intake record not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/realtor-intake/:intakeId
router.delete('/:intakeId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('realtor_intake')
      .delete()
      .eq('id', req.params.intakeId)
      .eq('realtor_id', req.user.id)

    if (error) throw error
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
