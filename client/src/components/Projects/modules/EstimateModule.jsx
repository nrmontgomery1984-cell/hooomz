import { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Download, Send, Copy, Trash2, Edit2, Calculator, DollarSign, X } from 'lucide-react'
import ModernCard from '../../UI/ModernCard'
import { Button } from '../../UI/Button'
import * as projectsApi from '../../../services/projectsApi'

/**
 * Estimate/Quote Module
 * Create detailed estimates and convert them to project scopes
 */
const EstimateModule = ({ projectId }) => {
  const [estimates, setEstimates] = useState([])
  const [selectedEstimate, setSelectedEstimate] = useState(null)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddLineItem, setShowAddLineItem] = useState(false)
  const [editingLineItem, setEditingLineItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectScope, setProjectScope] = useState(null)
  const [newEstimate, setNewEstimate] = useState({
    name: '',
    description: '',
    client_name: '',
    client_email: ''
  })
  const [newLineItem, setNewLineItem] = useState({
    category_id: '',
    subcategory_id: '',
    description: '',
    quantity: 1,
    unit: 'ea',
    unit_price: 0
  })

  // Fetch estimates and project scope on mount
  useEffect(() => {
    if (projectId) {
      fetchEstimates()
      fetchProjectScope()
    }
  }, [projectId])

  const fetchEstimates = async () => {
    try {
      setLoading(true)
      const data = await projectsApi.getEstimates(projectId)
      setEstimates(data || [])
      // Auto-select first estimate if available
      if (data && data.length > 0 && !selectedEstimate) {
        setSelectedEstimate(data[0])
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectScope = async () => {
    try {
      const scope = await projectsApi.getProjectWithScope(projectId)
      setProjectScope(scope)
    } catch (error) {
      console.error('Error fetching project scope:', error)
    }
  }

  // Get categories and subcategories from project scope
  const categories = useMemo(() => {
    return projectScope?.categories || []
  }, [projectScope])

  const subcategories = useMemo(() => {
    if (!newLineItem.category_id) return []
    const category = categories.find(c => c.id === newLineItem.category_id)
    return category?.subcategories || []
  }, [categories, newLineItem.category_id])

  // Get category and subcategory names for display
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || ''
  }

  const getSubcategoryName = (subcategoryId) => {
    const allSubcategories = categories.flatMap(c => c.subcategories || [])
    const subcategory = allSubcategories.find(s => s.id === subcategoryId)
    return subcategory?.name || ''
  }

  const handleCreateEstimate = async () => {
    try {
      const created = await projectsApi.createEstimate(projectId, newEstimate)
      setEstimates([...estimates, created])
      setSelectedEstimate(created)
      setShowCreateDialog(false)
      setNewEstimate({ name: '', description: '', client_name: '', client_email: '' })
    } catch (error) {
      console.error('Error creating estimate:', error)
      alert('Failed to create estimate')
    }
  }

  const handleDeleteEstimate = async (estimateId) => {
    if (!confirm('Delete this estimate? This action cannot be undone.')) return

    try {
      await projectsApi.deleteEstimate(estimateId)
      setEstimates(estimates.filter(e => e.id !== estimateId))
      if (selectedEstimate?.id === estimateId) {
        setSelectedEstimate(estimates.find(e => e.id !== estimateId) || null)
      }
    } catch (error) {
      console.error('Error deleting estimate:', error)
      alert('Failed to delete estimate')
    }
  }

  const handleAddLineItem = async () => {
    if (!selectedEstimate) return

    try {
      // Add category names to the line item data
      const { category_id, subcategory_id, ...lineItemFields } = newLineItem
      const lineItemData = {
        ...lineItemFields,
        category: getCategoryName(category_id) + ' › ' + getSubcategoryName(subcategory_id)
      }

      const created = await projectsApi.createLineItem(selectedEstimate.id, lineItemData)
      // Refresh the selected estimate to include new line item
      const updatedEstimate = await projectsApi.getEstimate(selectedEstimate.id)
      setSelectedEstimate(updatedEstimate)
      // Update in estimates list
      setEstimates(estimates.map(e => e.id === updatedEstimate.id ? updatedEstimate : e))
      setShowAddLineItem(false)
      setNewLineItem({ category_id: '', subcategory_id: '', description: '', quantity: 1, unit: 'ea', unit_price: 0 })
    } catch (error) {
      console.error('Error adding line item:', error)
      alert('Failed to add line item')
    }
  }

  const handleDeleteLineItem = async (lineItemId) => {
    if (!confirm('Delete this line item?')) return

    try {
      await projectsApi.deleteLineItem(lineItemId)
      // Refresh the selected estimate
      const updatedEstimate = await projectsApi.getEstimate(selectedEstimate.id)
      setSelectedEstimate(updatedEstimate)
      setEstimates(estimates.map(e => e.id === updatedEstimate.id ? updatedEstimate : e))
    } catch (error) {
      console.error('Error deleting line item:', error)
      alert('Failed to delete line item')
    }
  }

  const handleConvertToScope = async () => {
    if (!selectedEstimate || !selectedEstimate.line_items || selectedEstimate.line_items.length === 0) {
      alert('This estimate has no line items to convert')
      return
    }

    if (!confirm(`Convert "${selectedEstimate.name}" to project scope?\n\nThis will create ${selectedEstimate.line_items.length} new tasks in your project based on the estimate line items.`)) {
      return
    }

    try {
      // Group line items by category
      const itemsByCategory = {}
      for (const item of selectedEstimate.line_items) {
        const [categoryName, subcategoryName] = item.category ? item.category.split(' › ') : ['Uncategorized', 'General']
        const categoryKey = categoryName || 'Uncategorized'

        if (!itemsByCategory[categoryKey]) {
          itemsByCategory[categoryKey] = {}
        }

        const subcategoryKey = subcategoryName || 'General'
        if (!itemsByCategory[categoryKey][subcategoryKey]) {
          itemsByCategory[categoryKey][subcategoryKey] = []
        }

        itemsByCategory[categoryKey][subcategoryKey].push(item)
      }

      // Find or create categories and subcategories, then create scope items
      let createdCount = 0
      const scope = await projectsApi.getProjectWithScope(projectId)

      for (const [categoryName, subcategories] of Object.entries(itemsByCategory)) {
        // Find or create category
        let category = scope.categories?.find(c => c.name === categoryName)
        if (!category) {
          category = await projectsApi.createCategory(projectId, { name: categoryName })
        }

        for (const [subcategoryName, items] of Object.entries(subcategories)) {
          // Find or create subcategory
          let subcategory = category.subcategories?.find(s => s.name === subcategoryName)
          if (!subcategory) {
            subcategory = await projectsApi.createSubcategory(category.id, { name: subcategoryName })
          }

          // Create scope items for each line item
          for (const item of items) {
            await projectsApi.createScopeItem(subcategory.id, {
              description: item.description,
              notes: `From estimate: ${selectedEstimate.name}\nQuantity: ${item.quantity} ${item.unit}\nUnit Price: $${item.unit_price}\nTotal: $${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}`,
              estimated_hours: item.labor_hours || null,
              status: 'pending'
            })
            createdCount++
          }
        }
      }

      // Update estimate status to converted
      await projectsApi.updateEstimate(selectedEstimate.id, { status: 'converted' })

      // Refresh estimates
      await fetchEstimates()

      alert(`Successfully converted ${createdCount} line items to project scope!\n\nYou can now view them in the Task Tracker module.`)
    } catch (error) {
      console.error('Error converting to scope:', error)
      alert('Failed to convert estimate to scope: ' + (error.message || 'Unknown error'))
    }
  }

  // Sample template categories for construction
  const templateCategories = [
    {
      id: 'framing',
      name: 'Framing',
      icon: '🔨',
      templates: [
        { id: 'wall-framing', name: 'Wall Framing', items: [] },
        { id: 'roof-framing', name: 'Roof Framing', items: [] },
      ]
    },
    {
      id: 'electrical',
      name: 'Electrical',
      icon: '⚡',
      templates: [
        { id: 'rough-electrical', name: 'Rough-In Electrical', items: [] },
        { id: 'finish-electrical', name: 'Finish Electrical', items: [] },
      ]
    },
    {
      id: 'plumbing',
      name: 'Plumbing',
      icon: '🚰',
      templates: [
        { id: 'rough-plumbing', name: 'Rough-In Plumbing', items: [] },
        { id: 'finish-plumbing', name: 'Finish Plumbing', items: [] },
      ]
    },
    {
      id: 'finishes',
      name: 'Finishes',
      icon: '🎨',
      templates: [
        { id: 'drywall', name: 'Drywall & Paint', items: [] },
        { id: 'flooring', name: 'Flooring', items: [] },
        { id: 'trim', name: 'Trim & Molding', items: [] },
      ]
    },
  ]

  const calculateTotal = (lineItems) => {
    return lineItems.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unit_price || 0)
      return sum + itemTotal
    }, 0)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estimates & Quotes</h2>
          <p className="text-sm text-gray-600 mt-0.5">Create detailed estimates and convert to scope of work</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTemplateLibrary(true)}
            variant="outline"
            className="flex items-center gap-1.5 text-sm"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Template Library</span>
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Estimate</span>
          </Button>
        </div>
      </div>

      {/* Estimates List or Empty State */}
      {estimates.length === 0 ? (
        <ModernCard className="p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Estimates Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first estimate using our template library or start from scratch.
              Once approved, convert it to a project scope with one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => setShowTemplateLibrary(true)}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                Browse Templates
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Start from Scratch
              </Button>
            </div>
          </div>
        </ModernCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Estimates Sidebar */}
          <div className="lg:col-span-1">
            <ModernCard className="p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Your Estimates</h3>
              <div className="space-y-2">
                {estimates.map((estimate) => (
                  <div
                    key={estimate.id}
                    onClick={() => setSelectedEstimate(estimate)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEstimate?.id === estimate.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {estimate.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {estimate.line_items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-sm font-semibold text-gray-900">
                          ${calculateTotal(estimate.line_items || []).toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          estimate.status === 'approved' ? 'bg-green-100 text-green-700' :
                          estimate.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {estimate.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ModernCard>
          </div>

          {/* Estimate Details */}
          <div className="lg:col-span-2">
            {selectedEstimate ? (
              <ModernCard className="p-4 sm:p-6">
                {/* Estimate Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      {selectedEstimate.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created {new Date(selectedEstimate.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" title="Duplicate">
                      <Copy size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEstimate(selectedEstimate.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900">Line Items</h4>
                    <Button
                      size="sm"
                      className="flex items-center gap-1.5"
                      onClick={() => setShowAddLineItem(true)}
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Add Item</span>
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Unit</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Price</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Total</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedEstimate.line_items?.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 text-sm text-gray-900">{item.description}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                              <td className="px-3 py-3 text-sm text-gray-500 text-right">{item.unit}</td>
                              <td className="px-3 py-3 text-sm text-gray-900 text-right">
                                ${item.unit_price?.toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" title="Edit">
                                    <Edit2 size={14} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLineItem(item.id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={20} />
                      {calculateTotal(selectedEstimate.line_items || []).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Download size={18} />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Send size={18} />
                    Send to Client
                  </Button>
                  <Button
                    onClick={handleConvertToScope}
                    className="flex items-center justify-center gap-2"
                    disabled={!selectedEstimate?.line_items || selectedEstimate.line_items.length === 0}
                  >
                    <FileText size={18} />
                    Convert to Scope
                  </Button>
                </div>
              </ModernCard>
            ) : (
              <ModernCard className="p-12 text-center">
                <p className="text-gray-500">Select an estimate to view details</p>
              </ModernCard>
            )}
          </div>
        </div>
      )}

      {/* Create Estimate Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ModernCard className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Create New Estimate</h3>
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimate Name *
                </label>
                <input
                  type="text"
                  value={newEstimate.name}
                  onChange={(e) => setNewEstimate({ ...newEstimate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Kitchen Renovation Quote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEstimate.description}
                  onChange={(e) => setNewEstimate({ ...newEstimate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Brief description of the work"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newEstimate.client_name}
                  onChange={(e) => setNewEstimate({ ...newEstimate, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Client or company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email
                </label>
                <input
                  type="email"
                  value={newEstimate.client_email}
                  onChange={(e) => setNewEstimate({ ...newEstimate, client_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="client@example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEstimate}
                  className="flex-1"
                  disabled={!newEstimate.name}
                >
                  Create Estimate
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}

      {/* Add Line Item Dialog */}
      {showAddLineItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ModernCard className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add Line Item</h3>
              <Button variant="ghost" onClick={() => setShowAddLineItem(false)}>
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newLineItem.category_id}
                  onChange={(e) => setNewLineItem({ ...newLineItem, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory *
                </label>
                <select
                  value={newLineItem.subcategory_id}
                  onChange={(e) => setNewLineItem({ ...newLineItem, subcategory_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!newLineItem.category_id}
                >
                  <option value="">Select a subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={newLineItem.description}
                  onChange={(e) => setNewLineItem({ ...newLineItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Install 2x4 wall studs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={newLineItem.quantity}
                    onChange={(e) => setNewLineItem({ ...newLineItem, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newLineItem.unit}
                    onChange={(e) => setNewLineItem({ ...newLineItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ea, ft, hr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newLineItem.unit_price}
                    onChange={(e) => setNewLineItem({ ...newLineItem, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Line Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${((newLineItem.quantity || 0) * (newLineItem.unit_price || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddLineItem(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLineItem}
                  className="flex-1"
                  disabled={!newLineItem.description}
                >
                  Add Item
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      )}

      {/* Template Library Modal - TODO */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ModernCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Template Library</h3>
              <Button variant="ghost" onClick={() => setShowTemplateLibrary(false)}>
                <X size={20} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateCategories.map((category) => (
                <ModernCard key={category.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">{category.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.templates.length} templates
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Browse
                  </Button>
                </ModernCard>
              ))}
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  )
}

export default EstimateModule
