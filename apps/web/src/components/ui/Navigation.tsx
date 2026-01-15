'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/projects', label: 'Projects', icon: '🏗️' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/estimates', label: 'Estimates', icon: '💰' },
  { href: '/schedule', label: 'Schedule', icon: '📅' },
  { href: '/field', label: 'Field Docs', icon: '📋' },
  { href: '/reports', label: 'Reports', icon: '📈' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 safe-top">
      {/* Mobile header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-700">Hooomz</h1>
          <div className="text-sm text-gray-500">Construction Management</div>
        </div>
      </div>

      {/* Horizontal scrolling navigation for mobile */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 pb-3 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? 'nav-item-active whitespace-nowrap'
                    : 'nav-item whitespace-nowrap'
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
