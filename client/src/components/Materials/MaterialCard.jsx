import { useState } from 'react'
import { Package, Edit, Trash2, Image as ImageIcon, FileText, ExternalLink } from 'lucide-react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'

/**
 * MaterialCard Component
 * Displays a single material with edit/delete actions
 */
export const MaterialCard = ({ material, onEdit, onDelete, onClick }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getDisplayImage = () => {
    // Prefer uploaded photo, then product image URL, then default icon
    if (material.photos && material.photos.length > 0) {
      return { type: 'image', src: material.photos[0] }
    }
    if (material.product_image_url) {
      return { type: 'image', src: material.product_image_url }
    }
    return { type: 'icon' }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(material.id)
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const formatCurrency = (amount) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card
      className="hover:shadow-lg transition-shadow relative cursor-pointer hover:border-primary-500"
      onClick={onClick}
    >
      {/* Material Icon/Photo */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getDisplayImage().type === 'image' ? (
            <img
              src={getDisplayImage().src}
              alt={material.category}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package size={32} className="text-primary-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {material.category}
            </h3>
            {material.room_id && (
              <span className="text-xs text-gray-500">Room specific</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(material)
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
          >
            <Trash2 size={16} className="text-red-600" />
          </Button>
        </div>
      </div>

      {/* Material Details */}
      <div className="space-y-2 text-sm">
        {material.brand && (
          <div className="flex justify-between">
            <span className="text-gray-600">Brand:</span>
            <span className="font-medium text-gray-900">{material.brand}</span>
          </div>
        )}

        {material.model && (
          <div className="flex justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="font-medium text-gray-900">{material.model}</span>
          </div>
        )}

        {material.color && (
          <div className="flex justify-between">
            <span className="text-gray-600">Color:</span>
            <span className="font-medium text-gray-900">{material.color}</span>
          </div>
        )}

        {material.supplier && (
          <div className="flex justify-between">
            <span className="text-gray-600">Supplier:</span>
            <span className="font-medium text-gray-900">{material.supplier}</span>
          </div>
        )}

        {material.purchase_price && (
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium text-green-700">
              {formatCurrency(material.purchase_price)}
            </span>
          </div>
        )}

        {material.purchase_date && (
          <div className="flex justify-between">
            <span className="text-gray-600">Purchased:</span>
            <span className="font-medium text-gray-900">
              {formatDate(material.purchase_date)}
            </span>
          </div>
        )}
      </div>

      {/* Owner's Manual Link */}
      {material.manual_url && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href={material.manual_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 hover:text-primary-700 transition-colors group cursor-pointer"
          >
            <FileText size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">View Owner's Manual</span>
            <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      )}

      {/* Notes */}
      {material.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{material.notes}</p>
        </div>
      )}

      {/* Click for details hint */}
      <p className="text-xs text-primary-600 mt-3">Click for details →</p>

      {/* Photo Count */}
      {material.photos && material.photos.length > 1 && (
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <ImageIcon size={14} className="mr-1" />
          {material.photos.length} photos
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-900 font-medium mb-4">
              Delete this material?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default MaterialCard
