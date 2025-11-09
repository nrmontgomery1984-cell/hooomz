/**
 * Shared constants for Hooomz Profile
 */

export const APP_NAME = 'Hooomz Profile™'
export const APP_VERSION = '0.1.0'

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  HOMEOWNER_FREE: {
    name: 'Free',
    price: 0,
    limits: {
      homes: 1,
      storage_mb: 100
    }
  },
  HOMEOWNER_PREMIUM: {
    name: 'Premium',
    price: 12,
    limits: {
      homes: 5,
      storage_mb: 5000
    }
  },
  CONTRACTOR_FREE: {
    name: 'Free',
    price: 0,
    limits: {
      projects: 5
    }
  },
  CONTRACTOR_PRO: {
    name: 'Pro',
    price: 79,
    limits: {
      projects: -1, // unlimited
      marketplace: true,
      verified_badge: true
    }
  },
  REALTOR: {
    name: 'Agent',
    price: 40,
    limits: {
      listings: -1 // unlimited
    }
  }
}

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE_MB: 50,
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
}

// API response codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
}
