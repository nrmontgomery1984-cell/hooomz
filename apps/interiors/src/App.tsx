import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/dashboard';
import ProjectView from './pages/project';
import ImportPage from './pages/import';
import ClientPortal from './pages/client';
import DemoPage from './pages/demo';
import ActivityPage from './pages/activity';
import LoginPage from './pages/login';
import DiscoverPage from './pages/design/DiscoverPage';
import ScriptDashboardPage from './pages/script/ScriptDashboardPage';
import ShieldPage from './pages/script/ShieldPage';
import ClearPage from './pages/script/ClearPage';
import ReadyPage from './pages/script/ReadyPage';
import InstallPage from './pages/script/InstallPage';
import PunchPage from './pages/script/PunchPage';
import TurnoverPage from './pages/script/TurnoverPage';

// ============================================================================
// ROUTE STUB — placeholder for unbuilt pages
// ============================================================================

function RouteStub({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: '#6B6660',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}

// ============================================================================
// SHELL LAYOUT — sidebar + content panel
// ============================================================================

const NO_SIDEBAR_ROUTES = ['/login', '/demo'];

function AppShell() {
  const location = useLocation();

  // Hide sidebar on login, demo, and client portal routes
  const hideSidebar =
    NO_SIDEBAR_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith('/client/');

  if (hideSidebar) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/client/:projectId" element={<ClientPortal />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            {/* Existing protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:id"
              element={
                <ProtectedRoute>
                  <ProjectView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute allowedRoles={['admin', 'contractor']}>
                  <ImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage />
                </ProtectedRoute>
              }
            />

            {/* DESIGN phase stubs */}
            <Route path="/design" element={<RouteStub label="Design — Dashboard" />} />
            <Route path="/design/discover" element={<DiscoverPage />} />
            <Route path="/design/estimate" element={<RouteStub label="Design — Estimate" />} />
            <Route path="/design/survey" element={<RouteStub label="Design — Survey" />} />
            <Route path="/design/iterations" element={<RouteStub label="Design — Iterations" />} />
            <Route path="/design/go-ahead" element={<RouteStub label="Design — Go-Ahead" />} />
            <Route path="/design/notify" element={<RouteStub label="Design — Notify" />} />

            {/* SCRIPT phase pages */}
            <Route path="/script" element={<ScriptDashboardPage />} />
            <Route path="/script/shield" element={<ShieldPage />} />
            <Route path="/script/clear" element={<ClearPage />} />
            <Route path="/script/ready" element={<ReadyPage />} />
            <Route path="/script/install" element={<InstallPage />} />
            <Route path="/script/punch" element={<PunchPage />} />
            <Route path="/script/turnover" element={<TurnoverPage />} />

            {/* Flat section stubs */}
            <Route path="/finance" element={<RouteStub label="Finance" />} />
            <Route path="/standards" element={<RouteStub label="Standards" />} />
            <Route path="/labs" element={<RouteStub label="Labs" />} />
            <Route path="/admin" element={<RouteStub label="Admin" />} />
          </Routes>
        </div>


      </div>
    </div>
  );
}

// ============================================================================
// APP ROOT
// ============================================================================

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
