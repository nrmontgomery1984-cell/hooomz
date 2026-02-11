'use client';

import { Sphere } from './Sphere';

interface SphereItem {
  id: string;
  score: number;
  label: string;
  onClick?: () => void;
}

interface SphereClusterProps {
  items: SphereItem[];
  size?: 'sm' | 'md';
}

export function SphereCluster({ items, size = 'sm' }: SphereClusterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-4">
      {items.map((item) => (
        <Sphere
          key={item.id}
          score={item.score}
          size={size}
          label={item.label}
          onClick={item.onClick}
        />
      ))}
    </div>
  );
}
