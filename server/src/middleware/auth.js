import supabase from '../utils/supabase.js'

/**
 * Authentication middleware
 * Extracts JWT from Authorization header, verifies with Supabase,
 * and attaches user to req.user
 */
export const authMiddleware = async (req, res, next) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next()
  }

  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization

    // Check if Authorization header exists and has Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
    }

    // Extract JWT token
    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      })
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    // Return 401 if token is invalid or expired
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }

    // Attach user to request object
    req.user = user

    // Continue to next middleware/route handler
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    })
  }
}

export default authMiddleware
