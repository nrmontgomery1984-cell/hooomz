import Joi from 'joi'

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      })
    }

    req[property] = value
    next()
  }
}

// Common validation schemas
export const schemas = {
  homeId: Joi.object({
    homeId: Joi.string().uuid().required()
  }),

  createHome: Joi.object({
    address: Joi.string().required(),
    year_built: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    sqft: Joi.number().positive().optional(),
    meta: Joi.object().optional()
  }),

  createRoom: Joi.object({
    name: Joi.string().required(),
    floor: Joi.number().integer().optional(),
    notes: Joi.string().allow('').optional(),
    photos: Joi.array().items(Joi.string().uri()).optional()
  }),

  createMaterial: Joi.object({
    room_id: Joi.string().uuid().optional(),
    category: Joi.string().required(),
    brand: Joi.string().allow('').optional(),
    model: Joi.string().allow('').optional(),
    color: Joi.string().allow('').optional(),
    photos: Joi.array().items(Joi.string().uri()).optional()
  }),

  createSystem: Joi.object({
    type: Joi.string().required(),
    brand: Joi.string().allow('').optional(),
    model: Joi.string().allow('').optional(),
    serial: Joi.string().allow('').optional(),
    install_date: Joi.date().optional()
  }),

  createDocument: Joi.object({
    category: Joi.string().required(),
    file_url: Joi.string().uri().required(),
    file_name: Joi.string().optional(),
    file_size: Joi.number().optional()
  }),

  createMaintenance: Joi.object({
    name: Joi.string().required(),
    frequency: Joi.string().valid('weekly', 'monthly', 'quarterly', 'annually').required(),
    next_due: Joi.date().required(),
    notes: Joi.string().allow('').optional()
  })
}
