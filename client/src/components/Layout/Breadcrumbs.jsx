import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { colors } from '../../styles/design-tokens'

/**
 * Breadcrumbs Component
 * Modern breadcrumb navigation for better context
 */
const Breadcrumbs = ({ items = [] }) => {
  if (items.length === 0) return null

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      {/* Home Icon */}
      <Link
        to="/dashboard"
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home size={16} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight size={16} className="text-gray-400" />

            {isLast ? (
              <span
                className="font-medium"
                style={{ color: colors.text.primary }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-gray-500 hover:text-gray-700 transition-colors hover:underline"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
