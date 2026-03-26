import { NavLink, useLocation } from 'react-router-dom';
import { colors, typography, fontSizes } from '../constants/designSystem';


// ============================================================================
// NAV STRUCTURE
// ============================================================================

interface NavItem {
  label: string;
  to: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const DESIGN_GROUP: NavGroup = {
  label: 'DESIGN',
  items: [
    { label: 'Dashboard', to: '/design' },
    { label: 'Discover', to: '/design/discover' },
    { label: 'Estimate', to: '/design/estimate' },
    { label: 'Survey', to: '/design/survey' },
    { label: 'Iterations', to: '/design/iterations' },
    { label: 'Go-Ahead', to: '/design/go-ahead' },
    { label: 'Notify', to: '/design/notify' },
  ],
};

const SCRIPT_GROUP: NavGroup = {
  label: 'SCRIPT',
  items: [
    { label: 'Dashboard', to: '/script' },
    { label: 'Shield', to: '/script/shield' },
    { label: 'Clear', to: '/script/clear' },
    { label: 'Ready', to: '/script/ready' },
    { label: 'Install', to: '/script/install' },
    { label: 'Punch', to: '/script/punch' },
    { label: 'Turnover', to: '/script/turnover' },
  ],
};

const FLAT_ITEMS: NavItem[] = [
  { label: 'Finance', to: '/finance' },
  { label: 'Standards', to: '/standards' },
  { label: 'Labs', to: '/labs' },
  { label: 'Admin', to: '/admin' },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const location = useLocation();

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav
      className="flex flex-col flex-shrink-0 h-screen"
      style={{
        width: 220,
        background: colors.sidebarBg,
      }}
    >
      {/* Logo */}
      <div
        className="px-4 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${colors.sidebarDivider}` }}
      >
        <div
          className="text-xl font-bold tracking-wider"
          style={{ fontFamily: typography.primary, color: colors.sidebarNavActive }}
        >
          HOOOMZ
        </div>
        <div
          style={{
            fontFamily: typography.mono,
            fontSize: fontSizes.monoBase,
            color: colors.sidebarUserText,
            letterSpacing: '0.12em',
            marginTop: 2,
          }}
        >
          INTERIORS OS
        </div>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto">
        {/* DESIGN group */}
        <NavGroupSection group={DESIGN_GROUP} isActive={isActive} />

        {/* Divider */}
        <div
          className="mx-3 my-1.5"
          style={{ height: 1, background: colors.sidebarDivider }}
        />

        {/* SCRIPT group */}
        <NavGroupSection group={SCRIPT_GROUP} isActive={isActive} />

        {/* Divider */}
        <div
          className="mx-3 my-1.5"
          style={{ height: 1, background: colors.sidebarDivider }}
        />

        {/* Flat items */}
        <div className="py-3">
          {FLAT_ITEMS.map((item) => (
            <SidebarNavItem key={item.to} item={item} active={isActive(item.to)} indent={false} />
          ))}
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function NavGroupSection({
  group,
  isActive,
}: {
  group: NavGroup;
  isActive: (to: string) => boolean;
}) {
  return (
    <div className="py-3">
      {/* Group label — not clickable */}
      <div
        style={{
          fontFamily: typography.mono,
          fontSize: fontSizes.monoGroupLabel,
          color: colors.sidebarGroupLabel,
          letterSpacing: '0.2em',
          padding: '6px 16px 4px',
          textTransform: 'uppercase' as const,
        }}
      >
        {group.label}
      </div>

      {/* Phase items */}
      {group.items.map((item) => (
        <SidebarNavItem key={item.to} item={item} active={isActive(item.to)} indent />
      ))}
    </div>
  );
}

function SidebarNavItem({
  item,
  active,
  indent,
}: {
  item: NavItem;
  active: boolean;
  indent: boolean;
}) {
  return (
    <NavLink
      to={item.to}
      className="flex items-center gap-2.5 no-underline"
      style={{
        fontFamily: typography.mono,
        fontSize: '11px',
        letterSpacing: '0.04em',
        padding: `7px 16px 7px ${indent ? '24px' : '16px'}`,
        color: active ? colors.sidebarNavActive : colors.sidebarNavDefault,
        background: active ? colors.sidebarActiveBg : 'transparent',
        fontWeight: active ? 500 : 400,
        borderLeft: active ? `2px solid ${colors.sidebarActiveBorder}` : '2px solid transparent',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = colors.sidebarNavHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = colors.sidebarNavDefault;
        }
      }}
    >
      {/* Nav dot */}
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: 5,
          height: 5,
          background: active ? colors.sidebarActiveBorder : 'rgba(255,255,255,0.12)',
        }}
      />
      {item.label}
    </NavLink>
  );
}

export default Sidebar;
