interface ConfidenceBadgeProps {
  level: 'verified' | 'limited' | 'estimate';
  dataPoints?: number;
  showTooltip?: boolean;
}

const config = {
  verified: {
    icon: '✓',
    color: 'text-verified bg-verified/10',
    label: 'Verified',
    description: '3+ data points from your projects',
  },
  limited: {
    icon: '~',
    color: 'text-limited bg-limited/10',
    label: 'Limited',
    description: '1-2 data points',
  },
  estimate: {
    icon: '?',
    color: 'text-estimate bg-estimate/10',
    label: 'Estimate',
    description: 'No field data, using defaults',
  },
};

export function ConfidenceBadge({ level, dataPoints, showTooltip = true }: ConfidenceBadgeProps) {
  const { icon, color, label, description } = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${color}`}
      title={showTooltip ? `${label}: ${description}${dataPoints ? ` (${dataPoints} data points)` : ''}` : undefined}
    >
      {icon}
      {dataPoints !== undefined && <span className="text-xs opacity-75">({dataPoints})</span>}
    </span>
  );
}
