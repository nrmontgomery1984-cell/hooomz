'use client';

import { useEffect } from 'react';
import { useProjects } from '@/lib/api/hooks/useProjects';
import { ProjectStatus } from '@hooomz/shared-contracts';
import { Check } from 'lucide-react';

interface ProjectSelectorProps {
  value: string | null;
  onChange: (projectId: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { data: projectsResponse, isLoading } = useProjects({ status: ProjectStatus.IN_PROGRESS });

  const projects = projectsResponse?.projects ?? [];

  // Auto-select if only 1 project
  useEffect(() => {
    if (projects.length === 1 && !value) {
      onChange(projects[0].id);
    }
  }, [projects, value, onChange]);

  if (isLoading) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
          Project
        </label>
        <div
          className="h-11 rounded-xl animate-pulse"
          style={{ backgroundColor: 'var(--theme-border)' }}
        />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
          Project
        </label>
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
          No active projects. Create one first.
        </p>
      </div>
    );
  }

  // 1 project: read-only pill
  if (projects.length === 1) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
          Project
        </label>
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: 'var(--theme-accent-light, rgba(15,118,110,0.15))',
            color: 'var(--theme-accent)',
          }}
        >
          <Check size={14} />
          {projects[0].name}
        </div>
      </div>
    );
  }

  // 2-3 projects: pill buttons
  if (projects.length <= 3) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
          Project
        </label>
        <div className="flex gap-2">
          {projects.map((project: { id: string; name: string }) => {
            const isSelected = value === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onChange(project.id)}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-colors border-2"
                style={{
                  borderColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-border)',
                  backgroundColor: isSelected ? 'var(--theme-accent-light, rgba(15,118,110,0.15))' : 'var(--theme-background)',
                  color: isSelected ? 'var(--theme-accent)' : 'var(--theme-secondary)',
                }}
              >
                {project.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 4+ projects: dropdown
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--theme-secondary)' }}>
        Project
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] px-4 py-2 rounded-xl text-sm border-2 focus:outline-none focus:ring-2"
        style={{
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-primary)',
          backgroundColor: 'var(--theme-background)',
        }}
      >
        <option value="">Select project...</option>
        {projects.map((project: { id: string; name: string }) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
