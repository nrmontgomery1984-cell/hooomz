import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ModernLayout from './components/Layout/ModernLayout'

// Pages
import Dashboard from './pages/Dashboard'
import HomeProfile from './pages/HomeProfile'
import Rooms from './pages/Rooms'
import Materials from './pages/Materials'
import Systems from './pages/Systems'
import Documents from './pages/Documents'
import Maintenance from './pages/Maintenance'
import ContractorInput from './pages/ContractorInput'
import RealtorIntake from './pages/RealtorIntake'
import Projects from './pages/ProjectsNew'
import ProjectDetail from './pages/ProjectDetailNew'
import GlobalTasks from './pages/GlobalTasks'
import GlobalTimeTracker from './pages/GlobalTimeTracker'
import GlobalAnalytics from './pages/GlobalAnalytics'
import Contacts from './pages/Contacts'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes - no layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* App routes - with modern layout */}
          <Route path="/" element={<ModernLayout><Dashboard /></ModernLayout>} />
          <Route path="/dashboard" element={<ModernLayout><Dashboard /></ModernLayout>} />
          <Route path="/home/:homeId" element={<ModernLayout><HomeProfile /></ModernLayout>} />
          <Route path="/home/:homeId/rooms" element={<ModernLayout><Rooms /></ModernLayout>} />
          <Route path="/home/:homeId/materials" element={<ModernLayout><Materials /></ModernLayout>} />
          <Route path="/home/:homeId/systems" element={<ModernLayout><Systems /></ModernLayout>} />
          <Route path="/home/:homeId/documents" element={<ModernLayout><Documents /></ModernLayout>} />
          <Route path="/home/:homeId/maintenance" element={<ModernLayout><Maintenance /></ModernLayout>} />
          <Route path="/contractor" element={<ModernLayout><ContractorInput /></ModernLayout>} />
          <Route path="/realtor" element={<ModernLayout><RealtorIntake /></ModernLayout>} />
          <Route path="/projects" element={<ModernLayout><Projects /></ModernLayout>} />
          <Route path="/projects/:projectId" element={<ModernLayout><ProjectDetail /></ModernLayout>} />
          <Route path="/tasks" element={<ModernLayout><GlobalTasks /></ModernLayout>} />
          <Route path="/time" element={<ModernLayout><GlobalTimeTracker /></ModernLayout>} />
          <Route path="/analytics" element={<ModernLayout><GlobalAnalytics /></ModernLayout>} />
          <Route path="/contacts" element={<ModernLayout><Contacts /></ModernLayout>} />
          <Route path="/settings" element={<ModernLayout><Settings /></ModernLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
