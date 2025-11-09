import supabase from '../utils/supabase.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Upload Service - Server Side
 * Handles file uploads to Supabase Storage with server-side validation
 */

// Storage buckets
export const BUCKETS = {
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  MATERIALS: 'materials',
  AVATARS: 'avatars'
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024 // 50MB
}

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  VIDEO: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ]
}

/**
 * Validate file metadata
 */
const validateFile = (fileMetadata, options = {}) => {
  const {
    maxSize = FILE_SIZE_LIMITS.DOCUMENT,
    allowedTypes = [...ALLOWED_MIME_TYPES.IMAGE, ...ALLOWED_MIME_TYPES.DOCUMENT]
  } = options

  // Validate size
  if (fileMetadata.size > maxSize) {
    throw new Error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`)
  }

  // Validate MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(fileMetadata.mimetype)) {
    throw new Error(`File type ${fileMetadata.mimetype} is not allowed`)
  }

  return true
}

/**
 * Sanitize file name
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .replace(/_+/g, '_')
    .toLowerCase()
}

/**
 * Generate unique file path
 */
const generateFilePath = (originalName, folder = '') => {
  const uuid = uuidv4()
  const timestamp = Date.now()
  const sanitized = sanitizeFileName(originalName)
  const fileName = `${timestamp}-${uuid}-${sanitized}`

  return folder ? `${folder}/${fileName}` : fileName
}

/**
 * Upload Service
 */
export const uploadService = {
  /**
   * Upload file to Supabase Storage
   * @param {Buffer|Stream} fileData - File data buffer or stream
   * @param {Object} metadata - File metadata (name, mimetype, size)
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadFile(fileData, metadata, options = {}) {
    const {
      bucket = BUCKETS.DOCUMENTS,
      folder = '',
      userId = null,
      maxSize = FILE_SIZE_LIMITS.DOCUMENT,
      allowedTypes = [...ALLOWED_MIME_TYPES.IMAGE, ...ALLOWED_MIME_TYPES.DOCUMENT],
      upsert = false
    } = options

    try {
      // Validate file
      validateFile(metadata, { maxSize, allowedTypes })

      // Generate unique file path
      const userFolder = userId ? `${folder}/${userId}` : folder
      const filePath = generateFilePath(metadata.name, userFolder)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileData, {
          contentType: metadata.mimetype,
          cacheControl: '3600',
          upsert
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(error.message || 'Failed to upload file to storage')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        bucket,
        size: metadata.size,
        type: metadata.mimetype,
        originalName: metadata.name
      }
    } catch (error) {
      console.error('Upload service error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Upload multiple files
   * @param {Array} files - Array of file objects with data and metadata
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadMultiple(files, options = {}) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        throw new Error('No files provided')
      }

      const uploadPromises = files.map(file =>
        this.uploadFile(file.data, file.metadata, options)
      )

      const results = await Promise.allSettled(uploadPromises)

      const successful = []
      const failed = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(result.value)
        } else {
          failed.push({
            file: files[index].metadata.name,
            error: result.value?.error || result.reason?.message || 'Upload failed'
          })
        }
      })

      return {
        success: true,
        successful,
        failed,
        total: files.length
      }
    } catch (error) {
      console.error('Multiple upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Upload image file
   * @param {Buffer|Stream} fileData - Image data
   * @param {Object} metadata - File metadata
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadImage(fileData, metadata, options = {}) {
    return this.uploadFile(fileData, metadata, {
      ...options,
      bucket: options.bucket || BUCKETS.PHOTOS,
      maxSize: options.maxSize || FILE_SIZE_LIMITS.IMAGE,
      allowedTypes: ALLOWED_MIME_TYPES.IMAGE
    })
  },

  /**
   * Upload document file
   * @param {Buffer|Stream} fileData - Document data
   * @param {Object} metadata - File metadata
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadDocument(fileData, metadata, options = {}) {
    return this.uploadFile(fileData, metadata, {
      ...options,
      bucket: options.bucket || BUCKETS.DOCUMENTS,
      maxSize: options.maxSize || FILE_SIZE_LIMITS.DOCUMENT,
      allowedTypes: ALLOWED_MIME_TYPES.DOCUMENT
    })
  },

  /**
   * Delete file from storage
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Bucket name
   * @returns {Promise<Object>}
   */
  async deleteFile(filePath, bucket = BUCKETS.DOCUMENTS) {
    try {
      if (!filePath) {
        throw new Error('File path is required')
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        throw new Error(error.message || 'Failed to delete file')
      }

      return {
        success: true,
        message: 'File deleted successfully'
      }
    } catch (error) {
      console.error('Delete file error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Delete multiple files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {string} bucket - Bucket name
   * @returns {Promise<Object>}
   */
  async deleteMultiple(filePaths, bucket = BUCKETS.DOCUMENTS) {
    try {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        throw new Error('File paths array is required')
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove(filePaths)

      if (error) {
        console.error('Delete multiple error:', error)
        throw new Error(error.message || 'Failed to delete files')
      }

      return {
        success: true,
        message: `${filePaths.length} file(s) deleted successfully`,
        count: filePaths.length
      }
    } catch (error) {
      console.error('Delete multiple files error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Get public URL for a file
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Bucket name
   * @returns {string}
   */
  getPublicUrl(filePath, bucket = BUCKETS.DOCUMENTS) {
    try {
      if (!filePath) {
        throw new Error('File path is required')
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Get public URL error:', error)
      throw error
    }
  },

  /**
   * Get signed URL (private access)
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Bucket name
   * @param {number} expiresIn - Expiration time in seconds (default 3600)
   * @returns {Promise<Object>}
   */
  async getSignedUrl(filePath, bucket = BUCKETS.DOCUMENTS, expiresIn = 3600) {
    try {
      if (!filePath) {
        throw new Error('File path is required')
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        throw new Error(error.message || 'Failed to create signed URL')
      }

      return {
        success: true,
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      }
    } catch (error) {
      console.error('Get signed URL error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * List files in a folder
   * @param {string} folder - Folder path
   * @param {string} bucket - Bucket name
   * @returns {Promise<Object>}
   */
  async listFiles(folder = '', bucket = BUCKETS.DOCUMENTS) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        throw new Error(error.message || 'Failed to list files')
      }

      return {
        success: true,
        files: data,
        count: data.length
      }
    } catch (error) {
      console.error('List files error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Move/rename file
   * @param {string} fromPath - Current file path
   * @param {string} toPath - New file path
   * @param {string} bucket - Bucket name
   * @returns {Promise<Object>}
   */
  async moveFile(fromPath, toPath, bucket = BUCKETS.DOCUMENTS) {
    try {
      if (!fromPath || !toPath) {
        throw new Error('Both fromPath and toPath are required')
      }

      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath)

      if (error) {
        throw new Error(error.message || 'Failed to move file')
      }

      return {
        success: true,
        message: 'File moved successfully',
        newPath: toPath
      }
    } catch (error) {
      console.error('Move file error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default uploadService
