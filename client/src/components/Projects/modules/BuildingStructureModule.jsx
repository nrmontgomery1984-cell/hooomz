import { useState, useEffect } from 'react'
import { Building2, Plus, Edit2, Trash2, ChevronDown, ChevronRight, MapPin } from 'lucide-react'
import { Button } from '../../UI/Button'
import ModernCard from '../../UI/ModernCard'
import * as projectsApi from '../../../services/projectsApi'
import { colors } from '../../../styles/design-tokens'

/**
 * BuildingStructureModule
 * Manages nested loop architecture: Buildings > Floors > Rooms > Zones
 */
const BuildingStructureModule = ({ projectId }) => {
  const [structure, setStructure] = useState([])
  const [contexts, setContexts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [editingNode, setEditingNode] = useState(null)
  const [addingTo, setAddingTo] = useState(null)

  // Load building structure on mount
  useEffect(() => {
    loadStructure()
  }, [projectId])

  const loadStructure = async () => {
    try {
      setLoading(true)
      const [structureData, contextsData] = await Promise.all([
        projectsApi.getBuildingStructure(projectId),
        projectsApi.getLoopContexts(projectId)
      ])
      setStructure(structureData)
      setContexts(contextsData)
      setError(null)
    } catch (err) {
      console.error('Error loading building structure:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleAddIteration = async (contextId, parentIterationId = null) => {
    const name = prompt('Enter name (e.g., "1st Floor", "Living Room"):')
    if (!name) return

    try {
      await projectsApi.createLoopIteration(contextId, {
        name,
        parent_iteration_id: parentIterationId
      })
      await loadStructure()
    } catch (err) {
      alert(`Error creating iteration: ${err.message}`)
    }
  }

  const handleUpdateIteration = async (iterationId, currentName) => {
    const newName = prompt('Enter new name:', currentName)
    if (!newName || newName === currentName) return

    try {
      await projectsApi.updateLoopIteration(iterationId, { name: newName })
      await loadStructure()
    } catch (err) {
      alert(`Error updating iteration: ${err.message}`)
    }
  }

  const handleAddContext = async () => {
    const name = prompt('Enter context name (e.g., "Buildings", "Floors"):')
    if (!name) return

    try {
      await projectsApi.createLoopContext(projectId, { name })
      await loadStructure()
    } catch (err) {
      alert(`Error creating context: ${err.message}`)
    }
  }

  // Render a single iteration node with children
  const renderIteration = (iteration, depth = 0) => {
    const isExpanded = expandedNodes.has(iteration.id)
    const hasChildren = iteration.children && iteration.children.length > 0
    const indent = depth * 24

    return (
      <div key={iteration.id} style={{ marginLeft: `${indent}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '4px',
            backgroundColor: colors.background.secondary,
            cursor: hasChildren ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.tertiary}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary}
        >
          {hasChildren ? (
            <div
              onClick={() => toggleNode(iteration.id)}
              style={{ cursor: 'pointer', marginRight: '8px', display: 'flex' }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div style={{ width: '24px', marginRight: '8px' }} />
          )}

          <MapPin size={16} style={{ marginRight: '8px', color: colors.primary.main }} />

          <span style={{ flex: 1, fontWeight: 500 }}>{iteration.name}</span>

          <span
            style={{
              fontSize: '12px',
              color: colors.text.secondary,
              marginRight: '12px',
            }}
          >
            {iteration.instance_count || 0} tasks
          </span>

          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUpdateIteration(iteration.id, iteration.name)}
              style={{ padding: '4px' }}
            >
              <Edit2 size={14} />
            </Button>

            {iteration.context_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAddIteration(iteration.context_id, iteration.id)}
                style={{ padding: '4px' }}
              >
                <Plus size={14} />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {iteration.children.map(child => renderIteration(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <ModernCard>
        <div style={{ padding: '24px', textAlign: 'center', color: colors.text.secondary }}>
          Loading building structure...
        </div>
      </ModernCard>
    )
  }

  if (error) {
    return (
      <ModernCard>
        <div style={{ padding: '24px' }}>
          <div style={{ color: colors.status.error, marginBottom: '12px' }}>
            Error loading structure: {error}
          </div>
          <Button onClick={loadStructure}>Retry</Button>
        </div>
      </ModernCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <ModernCard>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color={colors.primary.main} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Building Structure</h2>
              <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                Manage locations and deploy tasks
              </p>
            </div>
          </div>

          <Button onClick={handleAddContext} variant="primary">
            <Plus size={16} style={{ marginRight: '8px' }} />
            Add Context
          </Button>
        </div>
      </ModernCard>

      {/* Context Sections */}
      {contexts.length === 0 ? (
        <ModernCard>
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Building2 size={48} color={colors.text.tertiary} style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Loop Contexts</h3>
            <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>
              Create loop contexts (Buildings, Floors, Rooms, etc.) to organize your project
            </p>
            <Button onClick={handleAddContext} variant="primary">
              <Plus size={16} style={{ marginRight: '8px' }} />
              Create First Context
            </Button>
          </div>
        </ModernCard>
      ) : (
        contexts.map(context => {
          const contextIterations = structure.filter(iter => iter.context_id === context.id && !iter.parent_iteration_id)

          return (
            <ModernCard key={context.id}>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                    {context.name}
                  </h3>
                  <Button
                    onClick={() => handleAddIteration(context.id, null)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus size={14} style={{ marginRight: '6px' }} />
                    Add {context.name.replace(/s$/, '')}
                  </Button>
                </div>

                {contextIterations.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: colors.background.secondary,
                      borderRadius: '8px',
                      color: colors.text.secondary
                    }}
                  >
                    No {context.name.toLowerCase()} created yet
                  </div>
                ) : (
                  <div>
                    {contextIterations.map(iteration => renderIteration(iteration, 0))}
                  </div>
                )}
              </div>
            </ModernCard>
          )
        })
      )}
    </div>
  )
}

export default BuildingStructureModule
