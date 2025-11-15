import { useState, useEffect } from 'react'
import { useContacts } from '../hooks/useContacts'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { Modal } from '../components/UI/Modal'
import { PageHeader } from '../components/UI/PageHeader'
import { Plus, Phone, Mail, Star, User, Building, MapPin, Briefcase, X, FolderOpen } from 'lucide-react'
import api from '../services/api'

export default function Contacts() {
  const [filterType, setFilterType] = useState('') // 'contractor' | 'vendor' | ''
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [trades, setTrades] = useState([])
  const [projects, setProjects] = useState([])
  const [contactProjects, setContactProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  const { contacts, loading, error, toggleFavorite } = useContacts({
    type: filterType,
    favorite: showFavoritesOnly ? 'true' : '',
    trade: selectedTrade,
    project: selectedProject
  })

  // Fetch unique trades for filter dropdown
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await api.get('/contacts/trades/list')
        setTrades(response.data)
      } catch (err) {
        console.error('Error fetching trades:', err)
      }
    }
    fetchTrades()
  }, [])

  // Fetch projects for filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects')
        // Projects API returns { data: projects }
        setProjects(response.data.data || response.data)
      } catch (err) {
        console.error('Error fetching projects:', err)
      }
    }
    fetchProjects()
  }, [])

  // Fetch contact's project history when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      const fetchContactProjects = async () => {
        setLoadingProjects(true)
        try {
          const response = await api.get(`/contacts/${selectedContact.id}/projects`)
          setContactProjects(response.data)
        } catch (err) {
          console.error('Error fetching contact projects:', err)
          setContactProjects([])
        } finally {
          setLoadingProjects(false)
        }
      }
      fetchContactProjects()
    } else {
      setContactProjects([])
    }
  }, [selectedContact])

  // Group contacts by type
  const contractors = contacts.filter(c => c.contact_type === 'contractor')
  const vendors = contacts.filter(c => c.contact_type === 'vendor')

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleEmail = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  const ContactCard = ({ contact }) => (
    <Card
      className="hover:shadow-lg transition-shadow p-4 cursor-pointer"
      onClick={() => setSelectedContact(contact)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{contact.name}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(contact.id, contact.is_favorite)
              }}
              className="text-yellow-500 hover:text-yellow-600"
            >
              <Star size={18} fill={contact.is_favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {contact.company && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Building size={14} />
              {contact.company}
            </p>
          )}
          {contact.trade_specialty && (
            <p className="text-xs text-gray-500 mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
              {contact.trade_specialty}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {contact.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCall(contact.phone)
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Phone size={14} />
            Call
          </Button>
        )}
        {contact.email && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEmail(contact.email)
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Mail size={14} />
            Email
          </Button>
        )}
      </div>
    </Card>
  )

  const ContactDetailModal = ({ contact, onClose }) => {
    if (!contact) return null

    return (
      <Modal isOpen={!!contact} onClose={onClose} title={contact.name} size="lg">
        <div>
          {/* Company and Favorite */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {contact.company && (
                <p className="text-lg text-gray-600 flex items-center gap-2">
                  <Building size={20} />
                  {contact.company}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(contact.id, contact.is_favorite)
              }}
              className="text-yellow-500 hover:text-yellow-600"
            >
              <Star size={24} fill={contact.is_favorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Trade Specialty */}
            {contact.trade_specialty && (
              <div className="flex items-start gap-3">
                <Briefcase size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Trade</p>
                  <p className="text-base font-medium">{contact.trade_specialty}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-base font-medium text-blue-600 hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
            )}

            {/* Address */}
            {contact.address && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-base font-medium">{contact.address}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-base text-gray-700">{contact.notes}</p>
              </div>
            )}

            {/* Project History */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen size={20} className="text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Project History</p>
              </div>
              {loadingProjects ? (
                <p className="text-sm text-gray-500">Loading projects...</p>
              ) : contactProjects.length === 0 ? (
                <p className="text-sm text-gray-500">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {contactProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{project.name}</p>
                          {project.address && (
                            <p className="text-xs text-gray-600 mt-0.5">{project.address}</p>
                          )}
                          {project.role && (
                            <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                              {project.role}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          project.status === 'planning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {contact.phone && (
              <Button
                onClick={() => handleCall(contact.phone)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                Call
              </Button>
            )}
            {contact.email && (
              <Button
                onClick={() => handleEmail(contact.email)}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                Email
              </Button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  if (loading) return <div className="p-8">Loading contacts...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Contacts"
        subtitle="Your contractors and vendors"
        actions={
          <Button>
            <Plus size={20} className="mr-2" />
            Add Contact
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Type Filters */}
          <div className="flex gap-4 flex-wrap">
            <Button
              variant={filterType === '' ? 'primary' : 'outline'}
              onClick={() => setFilterType('')}
            >
              All ({contacts.length})
            </Button>
            <Button
              variant={filterType === 'contractor' ? 'primary' : 'outline'}
              onClick={() => setFilterType('contractor')}
            >
              Contractors ({contractors.length})
            </Button>
            <Button
              variant={filterType === 'vendor' ? 'primary' : 'outline'}
              onClick={() => setFilterType('vendor')}
            >
              Vendors ({vendors.length})
            </Button>
            <Button
              variant={showFavoritesOnly ? 'primary' : 'outline'}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star size={16} className="mr-1" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              Favorites
            </Button>
          </div>

          {/* Trade Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by Trade:</label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Trades</option>
              {trades.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
            {selectedTrade && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrade('')}
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedProject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProject('')}
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {contacts.length === 0 ? (
          <Card className="text-center py-12">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No contacts found</h3>
            <p className="text-gray-600 mb-6">
              {showFavoritesOnly
                ? 'You haven\'t favorited any contacts yet'
                : selectedProject
                ? 'No contacts found for this project'
                : selectedTrade
                ? `No contacts found for ${selectedTrade}`
                : 'Start building your contact list'}
            </p>
            <Button>Add Your First Contact</Button>
          </Card>
        ) : (
          <div>
            {/* Show contractors if not filtering by vendor */}
            {filterType !== 'vendor' && contractors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <User size={24} />
                  Contractors ({contractors.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractors.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}

            {/* Show vendors if not filtering by contractor */}
            {filterType !== 'contractor' && vendors.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Building size={24} />
                  Vendors & Suppliers ({vendors.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />
    </div>
  )
}
