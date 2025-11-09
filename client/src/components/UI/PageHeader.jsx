import { useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { Home, ArrowLeft, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const PageHeader = ({
  title,
  subtitle,
  showBackButton = false,
  backTo = '/dashboard',
  actions = null
}) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {showBackButton ? (
              <Button
                variant="ghost"
                onClick={() => navigate(backTo)}
                className="mr-2"
              >
                <ArrowLeft size={20} />
              </Button>
            ) : (
              <Home
                size={32}
                className="text-primary-600 cursor-pointer hover:text-primary-700"
                onClick={() => navigate('/dashboard')}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {actions}
            {!showBackButton && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={20} className="mr-2" />
                  Settings
                </Button>
                <Button variant="secondary" onClick={handleLogout}>
                  <LogOut size={20} className="mr-2" />
                  Logout
                </Button>
              </>
            )}
            {showBackButton && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                <Home size={20} className="mr-2" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
