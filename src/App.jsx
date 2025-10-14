import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './login_system/login.jsx'
import Dashboard from './dashboards/Dashboard.jsx'
import Request from './dashboards/components/Request.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { DocumentProvider } from './contexts/DocumentContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
<<<<<<< HEAD
import { UserProvider } from './contexts/UserContext.jsx'
import './App.css'

function App() {
=======
import { UserProvider, useUser } from './contexts/UserContext.jsx'
import { buildUrl, fetchJson } from './lib/api/frontend/client.js'
import './App.css'

function App() {
  const [showMaintenanceNotification, setShowMaintenanceNotification] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);

  // Check maintenance status
  const checkMaintenanceStatus = async () => {
    setCheckingMaintenance(true);
    try {
      const response = await fetch(buildUrl('maintenance/status'));
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode || false);
        setShowMaintenanceNotification(data.maintenanceMode || false);
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setCheckingMaintenance(false);
    }
  };

  // Check maintenance status on mount and periodically
  useEffect(() => {
    checkMaintenanceStatus();
    const interval = setInterval(checkMaintenanceStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);
>>>>>>> 34c31f29d478ee772418465801b52a58f58a084c

  return (
    <UserProvider>
      <DocumentProvider>
        <NotificationProvider>
          <AppContent 
            showMaintenanceNotification={showMaintenanceNotification}
            setShowMaintenanceNotification={setShowMaintenanceNotification}
            maintenanceMode={maintenanceMode}
            checkingMaintenance={checkingMaintenance}
            checkMaintenanceStatus={checkMaintenanceStatus}
          />
        </NotificationProvider>
      </DocumentProvider>
    </UserProvider>
  )
}

// Component that can access user context
function AppContent({ 
  showMaintenanceNotification, 
  setShowMaintenanceNotification, 
  maintenanceMode, 
  checkingMaintenance, 
  checkMaintenanceStatus 
}) {
  const { user } = useUser();
  const isAdmin = user && user.role && user.role.toString().toLowerCase() === 'admin';

  return (
    <div className="App">
      {/* Show maintenance notification if maintenance mode is active */}
      {showMaintenanceNotification && (
        <MaintenanceNotification 
          isAdmin={isAdmin}
          onDismiss={() => setShowMaintenanceNotification(false)}
        />
      )}
      
      <Routes>
        {/* Default route redirects to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Login route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Requests - documents requiring action */}
        <Route 
          path="/requests" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin-only routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <div>Admin Dashboard (Coming Soon)</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Dean routes */}
        <Route 
          path="/dean" 
          element={
            <ProtectedRoute requiredRole="dean">
              <div>Dean Dashboard (Coming Soon)</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all route for 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  )
}

export default App
