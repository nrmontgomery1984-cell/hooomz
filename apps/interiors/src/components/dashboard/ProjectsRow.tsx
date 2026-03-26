import { Sphere } from '../sphere';
import type { LoopStatus } from '../../types/database';

export interface ProjectSummary {
  id: string;
  name: string;
  healthScore: number;
  status: LoopStatus;
  tasksComplete: number;
  tasksTotal: number;
  nextMilestone?: string;
}

interface ProjectsRowProps {
  /** List of project summaries */
  projects: ProjectSummary[];
  /** Loading state */
  loading?: boolean;
  /** Click handler for project selection */
  onProjectClick?: (projectId: string) => void;
}

/**
 * ProjectsRow - Horizontally scrollable row of project spheres
 */
export function ProjectsRow({ projects, loading, onProjectClick }: ProjectsRowProps) {
  // Show loading placeholders
  if (loading) {
    return (
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
          Active Projects
        </h2>
        <div className="flex gap-4 justify-center overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <Sphere key={i} score={undefined} size={80} label="Loading..." />
          ))}
        </div>
      </div>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
          Active Projects
        </h2>
        <p className="text-center text-gray-400 py-8">
          No active projects
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">
        Active Projects
      </h2>

      {/* Horizontally scrollable container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div
          className="flex gap-4 px-4 pb-2"
          style={{
            // Center projects if they fit, otherwise align left for scroll
            justifyContent: projects.length <= 3 ? 'center' : 'flex-start',
            minWidth: projects.length > 3 ? 'max-content' : undefined,
          }}
        >
          {projects.map((project) => (
            <Sphere
              key={project.id}
              score={project.healthScore}
              size={80}
              label={project.name}
              status={project.status !== 'in_progress' ? project.status : undefined}
              onClick={() => onProjectClick?.(project.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectsRow;
