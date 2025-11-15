import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import AppSwitcher from './AppSwitcher'
import {
  Settings,
  LogOut,
  User,
  ChevronDown,
  Home,
  Hammer,
  Users
} from 'lucide-react'
import { colors } from '../../styles/design-tokens'

/**
 * ModernLayout Component
 * Clean, modern layout with unified navigation
 */
const ModernLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isBuildz = location.pathname.startsWith('/projects')

  // Navigation items based on current app
  const hooomzNav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contractor Input', path: '/contractor' },
    { label: 'Realtor Intake', path: '/realtor' },
    { label: 'Contacts', path: '/contacts' },
  ]

  const buildzNav = [
    { label: 'Projects', path: '/projects' },
    { label: 'Contacts', path: '/contacts' },
  ]

  const navItems = isBuildz ? buildzNav : hooomzNav

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav
        className="bg-white border-b sticky top-0 z-50"
        style={{ borderColor: colors.border.light }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: App Switcher + Nav Links */}
            <div className="flex items-center gap-8">
              <AppSwitcher />

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                                  (item.path !== '/' && location.pathname.startsWith(item.path))

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? colors.gray[100] : 'transparent',
                        color: isActive ? colors.gray[900] : colors.gray[600],
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: isBuildz ? colors.secondary[600] : colors.primary[600] }}
                >
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border overflow-hidden z-20"
                    style={{ borderColor: colors.border.light }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: colors.border.light }}>
                      <div className="text-sm font-medium text-gray-900">
                        {user?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}

export default ModernLayout
