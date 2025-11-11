import { useState, useEffect } from 'react'
import { X, UserPlus, Users, Shield, Eye, Crown, Trash2 } from 'lucide-react'
import { Button } from '../UI/Button'
import { api } from '../../services/api'

/**
 * Project Members Dialog - Manage team access to projects
 */
const ProjectMembersDialog = ({ projectId, isOpen, onClose }) => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchMembers()
    }
  }, [isOpen, projectId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/projects/${projectId}/members`)
      setMembers(response.data.data)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      alert('Please enter an email address')
      return
    }

    try {
      setAdding(true)
      await api.post(`/projects/${projectId}/members`, {
        email: newMemberEmail.trim(),
        role: newMemberRole
      })

      setNewMemberEmail('')
      setNewMemberRole('member')
      await fetchMembers()
    } catch (error) {
      console.error('Error adding member:', error)
      alert(error.response?.data?.error || 'Failed to add member. Make sure the user has an account.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the project?')) return

    try {
      await api.delete(`/projects/${projectId}/members/${memberId}`)
      await fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await api.patch(`/projects/${projectId}/members/${memberId}`, {
        role: newRole
      })
      await fetchMembers()
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update member role')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-600" />
      case 'admin':
        return <Shield size={16} className="text-blue-600" />
      case 'viewer':
        return <Eye size={16} className="text-gray-600" />
      default:
        return <Users size={16} className="text-green-600" />
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Project Team</h2>
              <p className="text-sm text-gray-500">Manage who has access to this project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Member Form */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Add Team Member</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button
                variant="primary"
                onClick={handleAddMember}
                disabled={adding}
                className="whitespace-nowrap"
              >
                {adding ? 'Adding...' : 'Add'}
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              User must have an account to be added to the project
            </p>
          </div>

          {/* Members List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p>No team members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getRoleIcon(member.role)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {member.user?.raw_user_meta_data?.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-600">{member.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== 'owner' ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value)}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                        Owner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Role Descriptions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Role Permissions</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Owner:</strong> Full control (cannot be changed or removed)</p>
              <p><strong>Admin:</strong> Can manage team members and edit project</p>
              <p><strong>Member:</strong> Can edit project and track time</p>
              <p><strong>Viewer:</strong> Read-only access</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProjectMembersDialog
