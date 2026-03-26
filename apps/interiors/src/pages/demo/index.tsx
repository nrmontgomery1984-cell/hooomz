/**
 * Demo Test Page
 * Comprehensive test runner and demo page for Home Show presentations
 *
 * Sections:
 * 1. System Status - Connection health, current user/company
 * 2. Test Runner - Sequential tests with pass/fail indicators
 * 3. Demo Controls - Create demo project, reset data
 * 4. Component Showcase - Visual demos of UI components
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, LoadingSpinner, statusColors, scoreToColor } from '../../components/ui';
import { Sphere } from '../../components/sphere';
import { FloorPlanViewer } from '../../components/floor-plan';
import { supabase } from '../../services/supabase';
import {
  testDatabaseConnection,
  testCreateProject,
  testGetProject,
  testStatusUpdate,
  testCreateActivity,
  testCleanup,
  createDemoProject,
  cleanupAllTestData,
  type TestResult,
} from '../../services/demo';
import type { FloorPlan, FloorPlanElement, Loop, LoopStatus } from '../../types/database';

// ============================================================================
// TYPES
// ============================================================================

interface SystemStatus {
  supabaseConnected: boolean;
  userId: string | null;
  userEmail: string | null;
  companyId: string | null;
  companyName: string | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// SAMPLE DATA FOR COMPONENT DEMOS
// ============================================================================

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="500" height="400">
  <defs>
    <style>
      .wall-ext { fill: none; stroke: #333; stroke-width: 8; }
      .wall-int { fill: none; stroke: #666; stroke-width: 4; }
    </style>
  </defs>
  <g id="layer-walls-ext">
    <line id="wall-1" data-revit-id="1001" x1="50" y1="50" x2="450" y2="50" class="wall-ext" />
    <line id="wall-2" data-revit-id="1002" x1="450" y1="50" x2="450" y2="350" class="wall-ext" />
    <line id="wall-3" data-revit-id="1003" x1="450" y1="350" x2="50" y2="350" class="wall-ext" />
    <line id="wall-4" data-revit-id="1004" x1="50" y1="350" x2="50" y2="50" class="wall-ext" />
  </g>
  <g id="layer-walls-int">
    <line id="wall-5" data-revit-id="1005" x1="200" y1="50" x2="200" y2="200" class="wall-int" />
    <line id="wall-6" data-revit-id="1006" x1="200" y1="200" x2="350" y2="200" class="wall-int" />
  </g>
  <g id="layer-labels">
    <text x="100" y="130" font-size="14" fill="#666">Kitchen</text>
    <text x="280" y="130" font-size="14" fill="#666">Living</text>
    <text x="100" y="280" font-size="14" fill="#666">Dining</text>
    <text x="280" y="280" font-size="14" fill="#666">Bedroom</text>
  </g>
</svg>`;

function createMockFloorPlanData() {
  const projectId = 'demo-project';

  const floorPlan: FloorPlan = {
    id: 'fp-1',
    project_id: projectId,
    floor_id: 'floor-1',
    name: 'Main Floor',
    svg_content: SAMPLE_SVG,
    viewbox: '0 0 500 400',
    background_image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const loopStatuses: LoopStatus[] = ['complete', 'in_progress', 'blocked', 'not_started', 'in_progress', 'complete'];
  const loopNames = ['North Wall', 'East Wall', 'South Wall', 'West Wall', 'Kitchen Wall', 'Living Room Wall'];

  const loops = new Map<string, Loop>();
  for (let i = 0; i < 6; i++) {
    const loopId = `loop-${i + 1}`;
    loops.set(loopId, {
      id: loopId,
      parent_id: 'floor-1',
      project_id: projectId,
      company_id: 'demo-company',
      name: loopNames[i],
      type: 'task',
      cost_code: 'WALL-EXT-2X6',
      status: loopStatuses[i],
      health_score: loopStatuses[i] === 'complete' ? 100 : loopStatuses[i] === 'blocked' ? 25 : 75,
      planned_start: null,
      planned_end: null,
      actual_start: null,
      actual_end: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    });
  }

  const elements: FloorPlanElement[] = [
    { id: 'el-1', floor_plan_id: 'fp-1', svg_element_id: 'wall-1', element_type: 'wall', loop_id: 'loop-1', label: 'North Wall', bounds: null, revit_id: '1001', cost_code: 'WALL-EXT' },
    { id: 'el-2', floor_plan_id: 'fp-1', svg_element_id: 'wall-2', element_type: 'wall', loop_id: 'loop-2', label: 'East Wall', bounds: null, revit_id: '1002', cost_code: 'WALL-EXT' },
    { id: 'el-3', floor_plan_id: 'fp-1', svg_element_id: 'wall-3', element_type: 'wall', loop_id: 'loop-3', label: 'South Wall', bounds: null, revit_id: '1003', cost_code: 'WALL-EXT' },
    { id: 'el-4', floor_plan_id: 'fp-1', svg_element_id: 'wall-4', element_type: 'wall', loop_id: 'loop-4', label: 'West Wall', bounds: null, revit_id: '1004', cost_code: 'WALL-EXT' },
    { id: 'el-5', floor_plan_id: 'fp-1', svg_element_id: 'wall-5', element_type: 'wall', loop_id: 'loop-5', label: 'Kitchen Wall', bounds: null, revit_id: '1005', cost_code: 'WALL-INT' },
    { id: 'el-6', floor_plan_id: 'fp-1', svg_element_id: 'wall-6', element_type: 'wall', loop_id: 'loop-6', label: 'Living Room Wall', bounds: null, revit_id: '1006', cost_code: 'WALL-INT' },
  ];

  return { floorPlan, elements, loops, projectId };
}

// ============================================================================
// TEST RESULT COMPONENT
// ============================================================================

interface TestResultItemProps {
  result: TestResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function TestResultItem({ result, isExpanded, onToggle }: TestResultItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-gray-50 transition-colors min-h-[48px]"
      >
        {/* Pass/Fail indicator */}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
            result.passed ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {result.passed ? '✓' : '✕'}
        </span>

        {/* Test name */}
        <span className="flex-1 font-medium text-gray-900">{result.name}</span>

        {/* Duration */}
        <span className="text-sm text-gray-500">{result.duration}ms</span>

        {/* Expand indicator */}
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded output */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50">
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
              <p className="text-sm text-red-700 font-mono">{result.error}</p>
            </div>
          )}
          {result.output && (
            <pre className="text-xs text-gray-600 bg-gray-100 rounded p-3 overflow-x-auto">
              {result.output}
            </pre>
          )}
          {!result.error && !result.output && (
            <p className="text-sm text-gray-500 italic">No additional output</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DemoPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedSphere, setClickedSphere] = useState<string | null>(null);
  const [showComponentDemo, setShowComponentDemo] = useState(false);

  // System status state
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    supabaseConnected: false,
    userId: null,
    userEmail: null,
    companyId: null,
    companyName: null,
    isLoading: true,
    error: null,
  });

  // Test runner state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  // Demo controls state
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [demoProjectId, setDemoProjectId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Floor plan demo data
  const { floorPlan, elements, loops, projectId } = useMemo(() => createMockFloorPlanData(), []);

  // Check system status on mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = useCallback(async () => {
    setSystemStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Check Supabase connection
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const session = sessionData?.session;
      const userId = session?.user?.id || null;
      const userEmail = session?.user?.email || null;

      // Get company if user is logged in
      let companyId = null;
      let companyName = null;

      if (userId) {
        const { data: membership } = await supabase
          .from('company_memberships')
          .select('company_id, companies(name)')
          .eq('user_id', userId)
          .single();

        if (membership) {
          const m = membership as { company_id: string; companies: { name: string } | null };
          companyId = m.company_id;
          companyName = m.companies?.name || null;
        }
      }

      setSystemStatus({
        supabaseConnected: true,
        userId,
        userEmail,
        companyId,
        companyName,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setSystemStatus({
        supabaseConnected: false,
        userId: null,
        userEmail: null,
        companyId: null,
        companyName: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to check system status',
      });
    }
  }, []);

  // Run all tests sequentially
  const runAllTests = useCallback(async () => {
    if (!systemStatus.companyId) {
      setActionMessage({ type: 'error', text: 'Must be logged in with a company to run tests' });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);
    setExpandedTest(null);

    let testProjectId: string | null = null;
    let testLoopId: string | null = null;

    // Test 1: Database Connection
    setCurrentTest('Database Connection');
    try {
      const result1 = await testDatabaseConnection();
      setTestResults((prev) => [...prev, result1]);
      if (!result1.passed) { setIsRunningTests(false); setCurrentTest(null); return; }
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Database Connection', passed: false, duration: 0, error: String(err) }]);
      setIsRunningTests(false); setCurrentTest(null); return;
    }

    // Test 2: Create Project
    setCurrentTest('Create Project');
    try {
      const result2 = await testCreateProject(systemStatus.companyId!);
      setTestResults((prev) => [...prev, result2]);
      if (!result2.passed) { setIsRunningTests(false); setCurrentTest(null); return; }
      testProjectId = result2.projectId || null;
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Create Project', passed: false, duration: 0, error: String(err) }]);
      setIsRunningTests(false); setCurrentTest(null); return;
    }

    if (!testProjectId) { setIsRunningTests(false); setCurrentTest(null); return; }

    // Test 3: Get Project
    setCurrentTest('Get Project');
    try {
      const result3 = await testGetProject(testProjectId);
      setTestResults((prev) => [...prev, result3]);
      if (!result3.passed) { setIsRunningTests(false); setCurrentTest(null); return; }
      // Get a loop ID from the project for subsequent tests
      const { loops } = await import('../../services/api/loops').then(m => m.getProjectWithLoops(testProjectId!));
      testLoopId = loops.find(l => l.type === 'task')?.id || null;
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Get Project', passed: false, duration: 0, error: String(err) }]);
      setIsRunningTests(false); setCurrentTest(null); return;
    }

    if (!testLoopId) { setIsRunningTests(false); setCurrentTest(null); return; }

    // Test 4: Status Update
    setCurrentTest('Status Update');
    try {
      const result4 = await testStatusUpdate(testLoopId);
      setTestResults((prev) => [...prev, result4]);
      if (!result4.passed) { setIsRunningTests(false); setCurrentTest(null); return; }
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Status Update', passed: false, duration: 0, error: String(err) }]);
      setIsRunningTests(false); setCurrentTest(null); return;
    }

    // Test 5: Create Activity
    setCurrentTest('Create Activity');
    try {
      const result5 = await testCreateActivity(testProjectId, testLoopId);
      setTestResults((prev) => [...prev, result5]);
      if (!result5.passed) { setIsRunningTests(false); setCurrentTest(null); return; }
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Create Activity', passed: false, duration: 0, error: String(err) }]);
      setIsRunningTests(false); setCurrentTest(null); return;
    }

    // Test 6: Cleanup
    setCurrentTest('Cleanup');
    try {
      const result6 = await testCleanup(testProjectId);
      setTestResults((prev) => [...prev, result6]);
    } catch (err) {
      setTestResults((prev) => [...prev, { name: 'Cleanup', passed: false, duration: 0, error: String(err) }]);
    }

    setCurrentTest(null);
    setIsRunningTests(false);
  }, [systemStatus.companyId]);

  // Create demo project
  const handleCreateDemoProject = useCallback(async () => {
    if (!systemStatus.companyId) {
      setActionMessage({ type: 'error', text: 'Must be logged in with a company to create demo' });
      return;
    }

    setIsCreatingDemo(true);
    setActionMessage(null);

    try {
      const result = await createDemoProject(systemStatus.companyId);
      setDemoProjectId(result.projectId);
      setActionMessage({ type: 'success', text: `Demo project created! ID: ${result.projectId}` });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create demo project',
      });
    } finally {
      setIsCreatingDemo(false);
    }
  }, [systemStatus.companyId]);

  // Reset all test data
  const handleCleanupTestData = useCallback(async () => {
    if (!systemStatus.companyId) {
      setActionMessage({ type: 'error', text: 'Must be logged in with a company to cleanup' });
      return;
    }

    setIsCleaningUp(true);
    setActionMessage(null);

    try {
      const deletedCount = await cleanupAllTestData(systemStatus.companyId);
      setDemoProjectId(null);
      setTestResults([]);
      setActionMessage({ type: 'success', text: `Cleaned up ${deletedCount} test projects` });
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to cleanup test data',
      });
    } finally {
      setIsCleaningUp(false);
    }
  }, [systemStatus.companyId]);

  // Navigate to demo project
  const handleViewDemoProject = useCallback(() => {
    if (demoProjectId) {
      navigate(`/project/${demoProjectId}`);
    }
  }, [navigate, demoProjectId]);

  // Calculate test summary
  const testSummary = useMemo(() => {
    const passed = testResults.filter((r) => r.passed).length;
    const total = testResults.length;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    return { passed, total, totalDuration };
  }, [testResults]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hooomz Demo & Test Runner</h1>
        <p className="text-gray-600">Home Show Presentation Mode</p>
      </header>

      <main className="space-y-8 max-w-4xl">
        {/* ================================================================
            SECTION 1: SYSTEM STATUS
        ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
          <Card>
            {systemStatus.isLoading ? (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">Checking system status...</span>
              </div>
            ) : systemStatus.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-700">{systemStatus.error}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={checkSystemStatus}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Supabase Connection */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      systemStatus.supabaseConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-gray-700">Supabase</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.supabaseConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* User */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      systemStatus.userId ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="font-medium text-gray-700">User</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.userEmail || 'Not logged in'}
                  </span>
                </div>

                {/* Company */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      systemStatus.companyId ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="font-medium text-gray-700">Company</span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.companyName || 'No company assigned'}
                  </span>
                </div>

                {/* Refresh button */}
                <Button variant="ghost" size="sm" onClick={checkSystemStatus}>
                  Refresh Status
                </Button>
              </div>
            )}
          </Card>
        </section>

        {/* ================================================================
            SECTION 2: TEST RUNNER
        ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Runner</h2>
          <Card>
            {/* Run Tests Button */}
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="primary"
                onClick={runAllTests}
                disabled={isRunningTests || !systemStatus.companyId}
                loading={isRunningTests}
              >
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>

              {currentTest && (
                <span className="text-sm text-gray-600">
                  Running: <span className="font-medium">{currentTest}</span>
                </span>
              )}

              {testResults.length > 0 && !isRunningTests && (
                <span className="text-sm text-gray-600">
                  {testSummary.passed}/{testSummary.total} passed ({testSummary.totalDuration}ms)
                </span>
              )}
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {testResults.map((result, index) => (
                  <TestResultItem
                    key={index}
                    result={result}
                    isExpanded={expandedTest === index}
                    onToggle={() => setExpandedTest(expandedTest === index ? null : index)}
                  />
                ))}
              </div>
            )}

            {/* No tests yet message */}
            {testResults.length === 0 && !isRunningTests && (
              <p className="text-sm text-gray-500">
                Click "Run All Tests" to verify the system is working correctly.
                {!systemStatus.companyId && ' (Login required)'}
              </p>
            )}
          </Card>
        </section>

        {/* ================================================================
            SECTION 3: DEMO CONTROLS
        ================================================================ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Demo Controls</h2>
          <Card>
            <div className="flex flex-wrap gap-4 mb-4">
              <Button
                variant="primary"
                onClick={handleCreateDemoProject}
                disabled={isCreatingDemo || !systemStatus.companyId}
                loading={isCreatingDemo}
              >
                Create Demo Project
              </Button>

              <Button
                variant="secondary"
                onClick={handleViewDemoProject}
                disabled={!demoProjectId}
              >
                View Demo Project
              </Button>

              <Button
                variant="ghost"
                onClick={handleCleanupTestData}
                disabled={isCleaningUp || !systemStatus.companyId}
                loading={isCleaningUp}
              >
                Reset Test Data
              </Button>
            </div>

            {/* Action message */}
            {actionMessage && (
              <div
                className={`p-3 rounded ${
                  actionMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {actionMessage.text}
              </div>
            )}

            {/* Info message */}
            {!systemStatus.companyId && (
              <p className="text-sm text-gray-500 mt-2">
                Login with a company account to use demo controls.
              </p>
            )}
          </Card>
        </section>

        {/* ================================================================
            SECTION 4: COMPONENT SHOWCASE (COLLAPSIBLE)
        ================================================================ */}
        <section>
          <button
            onClick={() => setShowComponentDemo(!showComponentDemo)}
            className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4 hover:text-gray-600 transition-colors"
          >
            <span>{showComponentDemo ? '▼' : '▶'}</span>
            <span>Component Showcase</span>
          </button>

          {showComponentDemo && (
            <div className="space-y-8">
              {/* Status Colors */}
              <Card header="Status Colors">
                <div className="flex gap-4 flex-wrap">
                  {(Object.entries(statusColors) as [string, string][]).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Score Colors */}
              <Card header="Score Colors">
                <div className="flex gap-4 flex-wrap">
                  {[95, 75, 55, 35, 15].map((score) => (
                    <div key={score} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: scoreToColor(score) }}
                      >
                        {score}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Buttons */}
              <Card header="Buttons">
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
                <div className="flex gap-4 flex-wrap items-center mt-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </Card>

              {/* Modal */}
              <Card header="Modal">
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Example Modal"
                >
                  <p className="text-gray-700 mb-4">This is a modal dialog. Press Escape or click outside to close.</p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
                  </div>
                </Modal>
              </Card>

              {/* Loading Spinner */}
              <Card header="Loading Spinner">
                <div className="flex gap-8 items-center">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </div>
              </Card>

              {/* Sphere - Score Colors */}
              <Card header="Sphere - Score Colors">
                <p className="text-sm text-gray-600 mb-4">Spheres automatically color based on health score (0-100)</p>
                <div className="flex gap-6 flex-wrap items-end">
                  <Sphere score={95} label="Excellent" />
                  <Sphere score={78} label="Good" />
                  <Sphere score={55} label="Fair" />
                  <Sphere score={35} label="Poor" />
                  <Sphere score={15} label="Critical" />
                </div>
              </Card>

              {/* Sphere - Status Override */}
              <Card header="Sphere - Status Override">
                <p className="text-sm text-gray-600 mb-4">Status can override score-based coloring</p>
                <div className="flex gap-6 flex-wrap items-end">
                  <Sphere score={75} status="not_started" label="Not Started" />
                  <Sphere score={75} status="in_progress" label="In Progress" />
                  <Sphere score={75} status="blocked" label="Blocked" />
                  <Sphere score={75} status="complete" label="Complete" />
                </div>
              </Card>

              {/* Sphere - Interactive */}
              <Card header="Sphere - Interactive">
                <p className="text-sm text-gray-600 mb-4">
                  Spheres can be clickable. Last clicked: {clickedSphere || 'None'}
                </p>
                <div className="flex gap-6 flex-wrap items-end">
                  <Sphere
                    score={92}
                    label="Kitchen"
                    onClick={() => setClickedSphere('Kitchen')}
                  />
                  <Sphere
                    score={68}
                    label="Living Room"
                    onClick={() => setClickedSphere('Living Room')}
                  />
                  <Sphere
                    score={45}
                    label="Bathroom"
                    onClick={() => setClickedSphere('Bathroom')}
                  />
                </div>
              </Card>

              {/* Sphere - Loading State */}
              <Card header="Sphere - Loading State">
                <p className="text-sm text-gray-600 mb-4">
                  When score is undefined/null, shows a grey pulsing sphere with loading indicator.
                </p>
                <div className="flex gap-6 flex-wrap items-end">
                  <Sphere score={undefined} label="Loading (undefined)" />
                  <Sphere score={null} label="Loading (null)" />
                  <Sphere score={75} label="Loaded (75)" />
                </div>
              </Card>

              {/* Floor Plan Viewer */}
              <Card header="Floor Plan Viewer">
                <p className="text-sm text-gray-600 mb-4">
                  Interactive floor plan with status-colored elements. Tap an element to open the modal.
                  Status colors: <span className="text-green-600">Green = Complete</span>,{' '}
                  <span className="text-blue-600">Blue = In Progress</span>,{' '}
                  <span className="text-red-600">Red = Blocked</span>,{' '}
                  <span className="text-gray-500">Grey = Not Started</span>
                </p>
                <div className="h-[400px] border border-gray-200 rounded-lg overflow-hidden">
                  <FloorPlanViewer
                    floorPlan={floorPlan}
                    elements={elements}
                    projectId={projectId}
                    initialLoops={loops}
                    showLabels={false}
                  />
                </div>
              </Card>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
