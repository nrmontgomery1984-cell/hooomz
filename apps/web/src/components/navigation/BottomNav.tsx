'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity, Calculator, User, Plus } from 'lucide-react';
import { useQuickAdd } from '@/components/activity/QuickAddContext';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/activity', icon: Activity, label: 'Activity' },
  // Center "+" is rendered separately
  { href: '/estimates', icon: Calculator, label: 'Estimates' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const hiddenPaths = ['/intake', '/portal'];

export function BottomNav() {
  const pathname = usePathname();
  const { isOpen, open, close } = useQuickAdd();

  if (hiddenPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t z-40 pb-safe"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto h-16">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}

        {/* Center "+" button */}
        <div className="flex flex-col items-center justify-end pb-1 -mt-4">
          <button
            onClick={() => isOpen ? close() : open()}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200"
            style={{ backgroundColor: 'var(--theme-accent)' }}
            aria-label={isOpen ? 'Close quick add' : 'Quick add'}
            aria-expanded={isOpen}
          >
            <Plus
              size={28}
              color="white"
              strokeWidth={2.5}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
            />
          </button>
        </div>

        {/* Last two nav items */}
        {navItems.slice(2).map((item) => (
          <NavLink key={item.href} item={item} isActive={pathname === item.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center justify-center w-16 h-16 transition-colors"
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        size={20}
        strokeWidth={1.5}
        style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-muted)' }}
      />
      <span
        className="text-[10px] mt-1 font-medium"
        style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-muted)' }}
      >
        {item.label}
      </span>
    </Link>
  );
}
