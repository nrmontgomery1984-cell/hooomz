import { colors, borderRadius, shadows, spacing } from '../../styles/design-tokens'

/**
 * ModernCard Component
 * Clean, modern card with consistent styling
 */
const ModernCard = ({
  children,
  className = '',
  padding = 'lg',
  shadow = 'sm',
  hover = false,
  onClick,
  ...props
}) => {
  const paddingMap = {
    none: '0',
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
    xl: spacing['2xl'],
  }

  const shadowMap = {
    none: 'none',
    xs: shadows.xs,
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
  }

  const baseStyles = {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    boxShadow: shadowMap[shadow],
    padding: paddingMap[padding],
    border: `1px solid ${colors.border.light}`,
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const hoverStyles = hover ? {
    cursor: 'pointer',
  } : {}

  const combinedClassName = `${className} ${hover ? 'hover:shadow-md hover:border-gray-300' : ''}`

  return (
    <div
      style={{ ...baseStyles, ...hoverStyles }}
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default ModernCard
