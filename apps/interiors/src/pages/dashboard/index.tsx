import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Header,
  PortfolioSphere,
  ProjectsRow,
  TodaySection,
  ActivityPreview,
} from '../../components/dashboard';
import type { ProjectSummary } from '../../components/dashboard';
import { useCompany, useProjects, useActivityFeed } from '../../hooks';
import type { EventType, Loop, ActivityEvent } from '../../types/database';

// ============================================================================
// MOCK DATA (fallback for demo when no Supabase data)
// ============================================================================

const MOCK_PROJECTS: ProjectSummary[] = [
  {
    id: 'mock-1',
    name: 'Henderson LVT',
    healthScore: 94,
    status: 'in_progress',
    tasksComplete: 18,
    tasksTotal: 22,
    nextMilestone: 'Final walkthrough',
  },
  {
    id: 'mock-2',
    name: 'Willow Creek Tile',
    healthScore: 72,
    status: 'in_progress',
    tasksComplete: 8,
    tasksTotal: 16,
    nextMilestone: 'Grouting - Main Bath',
  },
  {
    id: 'mock-3',
    name: 'Oakridge Hardwood',
    healthScore: 38,
    status: 'blocked',
    tasksComplete: 3,
    tasksTotal: 24,
    nextMilestone: 'Moisture test - FAILED',
  },
];

const MOCK_ACTIVITIES: Array<{
  id: string;
  eventType: EventType;
  description: string;
  actorName: string;
  projectName: string;
  timestamp: string;
  hasPhoto?: boolean;
}> = [
  {
    id: 'mock-act-1',
    eventType: 'task.completed',
    description: 'LVT install complete - Living Room',
    actorName: 'Marco',
    projectName: 'Henderson LVT',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'mock-act-2',
    eventType: 'task.blocked',
    description: 'Moisture reading 14.2% - exceeds 12% limit',
    actorName: 'Marco',
    projectName: 'Oakridge Hardwood',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    hasPhoto: true,
  },
  {
    id: 'mock-act-3',
    eventType: 'task.completed',
    description: 'Acclimation complete - 48hrs reached',
    actorName: 'Carlos',
    projectName: 'Willow Creek Tile',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'mock-act-4',
    eventType: 'task.photo_added',
    description: 'Lot label photo - Shaw Endura Plus',
    actorName: 'Marco',
    projectName: 'Henderson LVT',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    hasPhoto: true,
  },
];

const MOCK_HIGHLIGHTS = [
  { id: '1', text: 'Henderson: Final walkthrough today', type: 'task' as const },
  { id: '2', text: 'Oakridge: Moisture retest needed', type: 'task' as const },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Loop to ProjectSummary for display
 */
function loopToProjectSummary(loop: Loop): ProjectSummary {
  return {
    id: loop.id,
    name: loop.name,
    healthScore: loop.health_score,
    status: loop.status,
    tasksComplete: 0, // Would need to count from child loops
    tasksTotal: 0, // Would need to count from child loops
    nextMilestone: undefined,
  };
}

/**
 * Convert ActivityEvent to display format
 */
function activityEventToDisplay(event: ActivityEvent, projectName: string = 'Project'): {
  id: string;
  eventType: EventType;
  description: string;
  actorName: string;
  projectName: string;
  timestamp: string;
  hasPhoto?: boolean;
} {
  // Generate description based on event type
  const descriptions: Partial<Record<EventType, string>> = {
    'task.completed': 'Task completed',
    'loop.completed': 'Item completed',
    'task.blocked': 'Task blocked',
    'loop.blocked': 'Item blocked',
    'task.photo_added': 'Photo added',
    'comment.added': 'Comment added',
    'project.imported': 'Project imported',
    'loop.status_changed': 'Status updated',
  };

  return {
    id: event.id,
    eventType: event.event_type,
    description: descriptions[event.event_type] || event.event_type,
    actorName: 'User', // Would need to join with profiles table
    projectName,
    timestamp: event.timestamp,
    hasPhoto: event.event_type === 'task.photo_added',
  };
}

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

export default function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Fetch data from Supabase
  const { company, isLoading: companyLoading } = useCompany();
  const {
    projects: supabaseProjects,
    portfolioScore: supabasePortfolioScore,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects(company?.id ?? null);
  const {
    events: supabaseEvents,
    isLoading: eventsLoading,
  } = useActivityFeed({
    companyId: company?.id ?? null,
    limit: 5,
  });

  // Determine if we should use mock data
  // Use mock if: explicitly toggled, or no company/projects loaded and not loading
  const shouldUseMock = useMemo(() => {
    if (useMockData) return true;
    if (companyLoading || projectsLoading) return false;
    if (!company || supabaseProjects.length === 0) return true;
    return false;
  }, [useMockData, companyLoading, projectsLoading, company, supabaseProjects]);

  // Convert Supabase data to display format
  const projects: ProjectSummary[] = useMemo(() => {
    if (shouldUseMock) return MOCK_PROJECTS;
    return supabaseProjects.map(loopToProjectSummary);
  }, [shouldUseMock, supabaseProjects]);

  const portfolioScore = useMemo(() => {
    if (shouldUseMock) {
      const total = MOCK_PROJECTS.reduce((sum, p) => sum + p.healthScore, 0);
      return Math.round(total / MOCK_PROJECTS.length);
    }
    return supabasePortfolioScore;
  }, [shouldUseMock, supabasePortfolioScore]);

  const activities = useMemo(() => {
    if (shouldUseMock) return MOCK_ACTIVITIES;
    return supabaseEvents.map((e) => activityEventToDisplay(e));
  }, [shouldUseMock, supabaseEvents]);

  // Calculate stats
  const blockedCount = projects.filter((p) => p.status === 'blocked').length;
  const tasksDue = projects.reduce(
    (sum, p) => sum + (p.tasksTotal - p.tasksComplete),
    0
  );

  // Loading state
  const isLoading = companyLoading || projectsLoading;

  // Handlers
  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleViewAllActivity = () => {
    navigate('/activity');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header onMenuClick={handleMenuClick} />

      {/* Demo Mode Toggle (for testing) */}
      {!companyLoading && !company && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
          <span>Demo mode: Not logged in. Showing sample data.</span>
          <button
            onClick={() => setUseMockData(!useMockData)}
            className="text-amber-600 underline hover:text-amber-800"
          >
            {useMockData ? 'Try live data' : 'Use mock data'}
          </button>
        </div>
      )}

      {/* Error State */}
      {projectsError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800">
          Error loading projects: {projectsError.message}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Portfolio Sphere - Centered */}
        <div className="bg-white">
          <PortfolioSphere
            score={isLoading ? undefined : portfolioScore}
            onClick={() => {}}
          />
        </div>

        {/* Projects Row */}
        <div className="bg-white border-t border-gray-100">
          <ProjectsRow
            projects={projects}
            loading={isLoading}
            onProjectClick={handleProjectClick}
          />
        </div>

        {/* Today Section */}
        <TodaySection
          tasksDue={tasksDue}
          blockedCount={blockedCount}
          highlights={shouldUseMock ? MOCK_HIGHLIGHTS : []}
          loading={isLoading}
        />

        {/* Recent Activity */}
        <div className="flex-1 bg-white border-t border-gray-100">
          <ActivityPreview
            activities={activities}
            loading={eventsLoading}
            onViewAll={handleViewAllActivity}
          />
        </div>
      </main>
    </div>
  );
}
