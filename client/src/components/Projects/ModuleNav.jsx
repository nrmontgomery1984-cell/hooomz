import {
  Clock,
  CheckSquare,
  DollarSign,
  FileText,
  ClipboardList,
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Receipt,
  UserCheck,
  Building2,
  Zap,
  List,
  FileEdit
} from 'lucide-react'

/**
 * Module Navigation for Hooomz Buildz Projects
 * Organized tabs for different project management modules
 */
const ModuleNav = ({ activeModule, onModuleChange, projectId }) => {
  const modules = [
    {
      id: 'estimates',
      label: 'Estimates',
      icon: Receipt,
      description: 'Quotes and estimates'
    },
    {
      id: 'building',
      label: 'Building',
      icon: Building2,
      description: 'Locations and structure'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: List,
      description: 'Task templates'
    },
    {
      id: 'instances',
      label: 'Instances',
      icon: CheckSquare,
      description: 'Deployed tasks'
    },
    {
      id: 'change-orders',
      label: 'Change Orders',
      icon: FileEdit,
      description: 'Scope changes'
    },
    {
      id: 'time',
      label: 'Time',
      icon: Clock,
      description: 'Time tracking'
    }
  ]

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Desktop Navigation - Horizontal Tabs */}
      <div className="hidden lg:block">
        <div className="flex items-center overflow-x-auto">
          {modules.map((module) => {
            const Icon = module.icon
            const isActive = activeModule === module.id

            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                title={module.description}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{module.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Navigation - Dropdown */}
      <div className="lg:hidden p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Module
        </label>
        <select
          value={activeModule}
          onChange={(e) => onModuleChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ModuleNav
