import { ReactNode } from 'react';

interface WidgetCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export function WidgetCard({ icon, label, value, trend, onClick }: WidgetCardProps) {
  const trendColors = {
    up: 'text-healthy',
    down: 'text-blocked',
    neutral: 'text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="bg-white rounded-xl p-4 shadow-widget hover:shadow-sphere transition-shadow text-left w-full"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl opacity-60">{icon}</span>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-lg font-semibold text-slate-800">
            {value}
            {trend && (
              <span className={`ml-1 text-sm ${trendColors[trend]}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}
