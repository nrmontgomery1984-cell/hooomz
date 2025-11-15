import { useState, useEffect } from 'react'
import { FileText, Plus, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '../../UI/Button'
import ModernCard from '../../UI/ModernCard'
import * as projectsApi from '../../../services/projectsApi'
import { colors } from '../../../styles/design-tokens'

/**
 * ChangeOrdersModule
 * Manages change orders and uncaptured labour tracking
 */
const ChangeOrdersModule = ({ projectId }) => {
  const [changeOrders, setChangeOrders] = useState([])
  const [uncapturedLabour, setUncapturedLabour] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('change-orders') // 'change-orders' | 'uncaptured-labour'
  const [expandedCO, setExpandedCO] = useState(null)

  useEffect(() => {
    loadData()
  }, [projectId, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)

      if (activeTab === 'change-orders') {
        const [cosResult, summaryData] = await Promise.all([
          projectsApi.getChangeOrders(projectId, {}),
          projectsApi.getChangeOrderSummary(projectId)
        ])
        setChangeOrders(cosResult.data || [])
        setSummary(summaryData)
      } else {
        const [labourResult, labourSummary] = await Promise.all([
          projectsApi.getUncapturedLabour(projectId, {}),
          projectsApi.getUncapturedLabourSummary(projectId)
        ])
        setUncapturedLabour(labourResult.data || [])
        setSummary(labourSummary)
      }

      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveChangeOrder = async (coId) => {
    const notes = prompt('Approval notes (optional):')
    if (notes === null) return

    try {
      await projectsApi.approveChangeOrder(coId, notes || undefined)
      await loadData()
    } catch (err) {
      alert(`Error approving change order: ${err.message}`)
    }
  }

  const handleRejectChangeOrder = async (coId) => {
    const reason = prompt('Rejection reason:')
    if (!reason) {
      alert('Rejection reason is required')
      return
    }

    try {
      await projectsApi.rejectChangeOrder(coId, reason)
      await loadData()
    } catch (err) {
      alert(`Error rejecting change order: ${err.message}`)
    }
  }

  const handleConvertToChangeOrder = async (logId) => {
    if (!confirm('Convert this uncaptured labour to a change order?')) return

    try {
      await projectsApi.convertUncapturedLabourToCO(logId)
      await loadData()
      alert('Successfully converted to change order')
    } catch (err) {
      alert(`Error converting: ${err.message}`)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return colors.status.success
      case 'rejected': return colors.status.error
      case 'pending': return colors.status.warning
      case 'converted_to_co': return colors.status.info
      default: return colors.text.secondary
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'pending': return <Clock size={16} />
      default: return <AlertTriangle size={16} />
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return `$${parseFloat(amount).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <ModernCard>
        <div style={{ padding: '24px', textAlign: 'center', color: colors.text.secondary }}>
          Loading...
        </div>
      </ModernCard>
    )
  }

  if (error) {
    return (
      <ModernCard>
        <div style={{ padding: '24px' }}>
          <div style={{ color: colors.status.error, marginBottom: '12px' }}>
            Error loading data: {error}
          </div>
          <Button onClick={loadData}>Retry</Button>
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
            <FileText size={24} color={colors.primary.main} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Change Management</h2>
              <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                Track scope changes and uncaptured work
              </p>
            </div>
          </div>

          <Button onClick={loadData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: `1px solid ${colors.border.light}` }}>
          <button
            onClick={() => setActiveTab('change-orders')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'change-orders' ? `2px solid ${colors.primary.main}` : 'none',
              color: activeTab === 'change-orders' ? colors.primary.main : colors.text.secondary,
              fontWeight: activeTab === 'change-orders' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Change Orders
          </button>
          <button
            onClick={() => setActiveTab('uncaptured-labour')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'uncaptured-labour' ? `2px solid ${colors.primary.main}` : 'none',
              color: activeTab === 'uncaptured-labour' ? colors.primary.main : colors.text.secondary,
              fontWeight: activeTab === 'uncaptured-labour' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Uncaptured Labour
          </button>
        </div>
      </ModernCard>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <ModernCard>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '4px' }}>
                {activeTab === 'change-orders' ? 'Total COs' : 'Total Entries'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>
                {activeTab === 'change-orders' ? summary.total_cos : summary.total_entries}
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '4px' }}>
                Pending
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: colors.status.warning }}>
                {summary.pending}
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '4px' }}>
                Cost Impact
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: summary.total_cost_impact >= 0 ? colors.status.success : colors.status.error }}>
                {formatCurrency(summary.total_cost_impact)}
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '4px' }}>
                Labour Impact
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600 }}>
                {summary.total_labor_impact || 0}h
              </div>
            </div>
          </ModernCard>
        </div>
      )}

      {/* Change Orders Tab */}
      {activeTab === 'change-orders' && (
        <>
          {changeOrders.length === 0 ? (
            <ModernCard>
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <FileText size={48} color={colors.text.tertiary} style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Change Orders</h3>
                <p style={{ color: colors.text.secondary }}>
                  Change orders will appear here when scope changes occur
                </p>
              </div>
            </ModernCard>
          ) : (
            changeOrders.map(co => {
              const isExpanded = expandedCO === co.id

              return (
                <ModernCard key={co.id}>
                  <div style={{ padding: '16px' }}>
                    {/* CO Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                            {co.co_number}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(co.status) }}>
                            {getStatusIcon(co.status)}
                            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                              {co.status}
                            </span>
                          </div>
                        </div>
                        {co.reason && (
                          <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                            {co.reason}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: co.total_cost_delta >= 0 ? colors.status.success : colors.status.error }}>
                          {co.total_cost_delta >= 0 ? '+' : ''}{formatCurrency(co.total_cost_delta)}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text.secondary }}>
                          {co.labor_hours_delta}h labour
                        </div>
                      </div>
                    </div>

                    {/* CO Details */}
                    <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '12px' }}>
                      <span>Created: {formatDate(co.created_at)}</span>
                      {co.source && <span style={{ marginLeft: '12px' }}>Source: {co.source}</span>}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        backgroundColor: colors.background.secondary,
                        borderRadius: '8px'
                      }}>
                        {co.description && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Description:</strong>
                            <div style={{ marginTop: '4px' }}>{co.description}</div>
                          </div>
                        )}
                        {co.material_cost_delta && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Material Impact:</strong> {formatCurrency(co.material_cost_delta)}
                          </div>
                        )}
                        {co.approved_at && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Approved:</strong> {formatDate(co.approved_at)}
                          </div>
                        )}
                        {co.approval_notes && (
                          <div>
                            <strong>Notes:</strong>
                            <div style={{ marginTop: '4px' }}>{co.approval_notes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {co.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApproveChangeOrder(co.id)}
                            size="sm"
                            variant="outline"
                            style={{ color: colors.status.success }}
                          >
                            <CheckCircle size={14} style={{ marginRight: '6px' }} />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectChangeOrder(co.id)}
                            size="sm"
                            variant="outline"
                            style={{ color: colors.status.error }}
                          >
                            <XCircle size={14} style={{ marginRight: '6px' }} />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => setExpandedCO(isExpanded ? null : co.id)}
                        size="sm"
                        variant="ghost"
                        style={{ marginLeft: 'auto' }}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              )
            })
          )}
        </>
      )}

      {/* Uncaptured Labour Tab */}
      {activeTab === 'uncaptured-labour' && (
        <>
          {uncapturedLabour.length === 0 ? (
            <ModernCard>
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <AlertTriangle size={48} color={colors.text.tertiary} style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Uncaptured Labour</h3>
                <p style={{ color: colors.text.secondary }}>
                  Track work that wasn't in the original estimate
                </p>
              </div>
            </ModernCard>
          ) : (
            uncapturedLabour.map(log => (
              <ModernCard key={log.id}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                          Uncaptured Work
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(log.status) }}>
                          {getStatusIcon(log.status)}
                          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                            {log.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {log.reason && (
                        <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>
                          {log.reason}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: colors.status.warning }}>
                        {formatCurrency(log.total_cost_delta)}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.text.secondary }}>
                        {log.labor_hours_delta}h labour
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: colors.text.secondary, marginBottom: '12px' }}>
                    Logged: {formatDate(log.created_at)}
                  </div>

                  {log.status === 'pending' && (
                    <Button
                      onClick={() => handleConvertToChangeOrder(log.id)}
                      size="sm"
                      variant="primary"
                    >
                      <FileText size={14} style={{ marginRight: '6px' }} />
                      Convert to Change Order
                    </Button>
                  )}
                </div>
              </ModernCard>
            ))
          )}
        </>
      )}
    </div>
  )
}

export default ChangeOrdersModule
