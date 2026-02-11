'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  id: string;
  label: string;
  href: string;
  score: number;
}

interface BreadcrumbSpheresProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSpheres({ items }: BreadcrumbSpheresProps) {
  return (
    <div className="flex items-center gap-2 py-4 overflow-x-auto">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          {index > 0 && <span className="text-slate-300">›</span>}
          <Link
            href={item.href}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {item.score}
            </span>
            <span className="text-sm text-slate-600 whitespace-nowrap">{item.label}</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
