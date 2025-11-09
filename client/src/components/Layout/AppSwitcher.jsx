import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Hammer, ChevronDown } from 'lucide-react'
import { colors } from '../../styles/design-tokens'

/**
 * AppSwitcher Component
 * Allows users to switch between Hooomz (home management) and Hooomz Buildz (construction)
 */
const AppSwitcher = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  // Determine current app based on route
  const isBuildz = location.pathname.startsWith('/projects')
  const currentApp = isBuildz ? 'buildz' : 'hooomz'

  const apps = [
    {
      id: 'hooomz',
      name: 'Hooomz',
      description: 'Home Management',
      icon: Home,
      color: colors.primary[600],
      bgColor: colors.primary[50],
      path: '/dashboard',
    },
    {
      id: 'buildz',
      name: 'Hooomz Buildz',
      description: 'Construction Projects',
      icon: Hammer,
      color: colors.secondary[600],
      bgColor: colors.secondary[50],
      path: '/projects',
    },
  ]

  const activeApp = apps.find(app => app.id === currentApp)

  const handleSwitch = (app) => {
    navigate(app.path)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Active App Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200"
        style={{
          backgroundColor: isOpen ? colors.gray[50] : 'transparent',
        }}
      >
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: activeApp.bgColor,
            color: activeApp.color,
          }}
        >
          <activeApp.icon size={20} />
        </div>
        <div className="text-left">
          <div className="font-semibold text-sm text-gray-900">{activeApp.name}</div>
          <div className="text-xs text-gray-500">{activeApp.description}</div>
        </div>
        <ChevronDown
          size={16}
          className="text-gray-400 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20"
          >
            {apps.map((app) => {
              const isActive = app.id === currentApp
              return (
                <button
                  key={app.id}
                  onClick={() => handleSwitch(app)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                  style={{
                    backgroundColor: isActive ? colors.gray[50] : 'transparent',
                  }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: app.bgColor,
                      color: app.color,
                    }}
                  >
                    <app.icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-gray-900">{app.name}</div>
                    <div className="text-xs text-gray-500">{app.description}</div>
                  </div>
                  {isActive && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: app.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default AppSwitcher
