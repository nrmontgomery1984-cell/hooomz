interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--charcoal)] mb-2">{title}</h1>
          {description && <p className="text-[var(--mid)]">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
