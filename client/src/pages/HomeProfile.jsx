import { useParams, Link } from 'react-router-dom'
import { Card } from '../components/UI/Card'
import { PageHeader } from '../components/UI/PageHeader'
import {
  Home,
  DoorOpen,
  Package,
  Settings as SettingsIcon,
  FileText,
  Wrench
} from 'lucide-react'

export default function HomeProfile() {
  const { homeId } = useParams()

  const sections = [
    { name: 'Rooms', icon: DoorOpen, path: `/home/${homeId}/rooms`, color: 'text-blue-600' },
    { name: 'Materials', icon: Package, path: `/home/${homeId}/materials`, color: 'text-green-600' },
    { name: 'Systems', icon: SettingsIcon, path: `/home/${homeId}/systems`, color: 'text-purple-600' },
    { name: 'Documents', icon: FileText, path: `/home/${homeId}/documents`, color: 'text-yellow-600' },
    { name: 'Maintenance', icon: Wrench, path: `/home/${homeId}/maintenance`, color: 'text-red-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Home Profile"
        subtitle="Manage all aspects of your property"
        showBackButton={true}
        backTo="/dashboard"
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link key={section.name} to={section.path}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <section.icon size={32} className={`${section.color} mb-4`} />
                <h3 className="text-xl font-semibold">{section.name}</h3>
                <p className="text-gray-600 text-sm mt-2">
                  Manage your home's {section.name.toLowerCase()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
