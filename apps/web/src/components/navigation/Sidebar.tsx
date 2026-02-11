'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Calculator,
  FlaskConical,
  User,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navItems: SidebarItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/activity', icon: Activity, label: 'Activity' },
  { href: '/estimates', icon: Calculator, label: 'Estimates' },
  { href: '/labs', icon: FlaskConical, label: 'Labs' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const hiddenPaths = ['/intake', '/portal'];

export function Sidebar() {
  const pathname = usePathname();

  if (hiddenPaths.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[240px] flex-shrink-0 border-r h-screen sticky top-0"
      style={{
        background: '#FFFFFF',
        borderColor: '#E5E7EB',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5">
        <span className="text-lg font-bold" style={{ color: '#111827' }}>
          Hooomz
        </span>
        <span className="text-xs ml-1.5 font-medium" style={{ color: '#9CA3AF' }}>
          Interiors
        </span>
      </div>

      {/* New Project CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/intake"
          className="flex items-center justify-center gap-2 w-full h-10 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: '#0F766E' }}
        >
          <Plus size={16} strokeWidth={2} />
          New Project
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" style={{ borderColor: '#F3F4F6' }} />

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);

          return (
            <SidebarLink key={item.href} item={item} isActive={!!isActive} />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: '#F3F4F6' }}>
        <p className="text-[10px]" style={{ color: '#D1D5DB' }}>
          Hooomz OS v0.1
        </p>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  isActive,
}: {
  item: SidebarItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: isActive ? '#F0FDFA' : 'transparent',
        color: isActive ? '#0F766E' : '#6B7280',
        borderLeft: isActive ? '3px solid #0F766E' : '3px solid transparent',
      }}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
      {item.label}
    </Link>
  );
}
