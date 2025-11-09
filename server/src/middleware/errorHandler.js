export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let status = err.status || 500
  let message = err.message || 'Internal server error'

  // Supabase/Postgres errors
  if (err.code === '23505') {
    status = 409
    message = 'Resource already exists'
  } else if (err.code === '23503') {
    status = 404
    message = 'Referenced resource not found'
  }

  // JWT/Auth errors
  if (err.name === 'JsonWebTokenError') {
    status = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    status = 401
    message = 'Token expired'
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
