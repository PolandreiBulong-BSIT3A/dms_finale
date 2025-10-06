import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './login_system/login.jsx'
import Dashboard from './dashboards/Dashboard.jsx'
import Request from './dashboards/components/Request.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MaintenanceNotification from './components/MaintenanceNotification.jsx'
import MaintenancePage from './components/MaintenancePage.jsx'
import { DocumentProvider } from './contexts/DocumentContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import { buildUrl, fetchJson } from './lib/api/frontend/client.js'
import './App.css'

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [showMaintenanceNotification, setShowMaintenanceNotification] = useState(false);
  const [previousMaintenanceState, setPreviousMaintenanceState] = useState(false);

  // Check maintenance mode and user role on app load
  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch(buildUrl('maintenance/status'));
        if (response.ok) {
          const data = await response.json();
          const newMaintenanceMode = data.maintenanceMode || false;
          console.log('Debug - Maintenance status response:', data);
          
          // Check if maintenance mode was just enabled
          if (newMaintenanceMode && !previousMaintenanceState && userRole) {
            setShowMaintenanceNotification(true);
          }
          
          setMaintenanceMode(newMaintenanceMode);
          setPreviousMaintenanceState(newMaintenanceMode);
        } else {
          console.error('Failed to fetch maintenance status');
          setMaintenanceMode(false);
        }
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
        setMaintenanceMode(false);
      }
    };

    const checkUserRole = async () => {
      try {
        const userData = await fetchJson(buildUrl('auth/me'));
        // Backend returns { success, user: { role, ... } }
        setUserRole(userData?.user?.role || null);
      } catch (error) {
        // Not authenticated or error
        setUserRole(null);
      }
    };

    const initializeApp = async () => {
      await Promise.all([checkMaintenanceStatus(), checkUserRole()]);
      setLoading(false);
    };

    initializeApp();

    // Check maintenance status every 60 seconds to avoid rate limits
    const interval = setInterval(() => {
      checkMaintenanceStatus();
      // Also recheck user role in case session expired
      checkUserRole();
    }, 60000);

    // Refresh when tab becomes active again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMaintenanceStatus();
        checkUserRole();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Redirect to maintenance page when maintenance mode is enabled
  useEffect(() => {
    if (loading) return; // Don't redirect while loading
    
    const isAdmin = userRole && userRole.toLowerCase() === 'admin'; // ONLY ADMIN, not dean
    const isOnMaintenancePage = location.pathname === '/maintenance';
    
    console.log('Maintenance check:', {
      maintenanceMode,
      userRole,
      isAdmin,
      currentPath: location.pathname,
      isOnMaintenancePage
    });
    
    // If maintenance is ON
    if (maintenanceMode) {
      // ONLY Admins can access everything during maintenance
      if (isAdmin) {
        // If admin is on maintenance page, redirect them to dashboard
        if (isOnMaintenancePage) {
          console.log('Admin on maintenance page - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
        return;
      }
      
      // Everyone else (including Dean): redirect to maintenance page
      if (!isOnMaintenancePage) {
        console.log('Maintenance ON - redirecting to maintenance page');
        navigate('/maintenance', { replace: true });
      }
    } 
    // If maintenance is OFF
    else {
      // If someone is on maintenance page, redirect to login
      if (isOnMaintenancePage) {
        console.log('Maintenance OFF - redirecting from maintenance page to login');
        navigate('/login', { replace: true });
      }
    }
  }, [maintenanceMode, userRole, location.pathname, navigate, loading]);

  // Show loading while checking maintenance status
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Debug logging
  console.log('Debug - maintenanceMode:', maintenanceMode);
  console.log('Debug - userRole:', userRole);
  console.log('Debug - loading:', loading);

  return (
    <UserProvider>
      <DocumentProvider>
        <NotificationProvider>
          <div className="App">
            {/* Show maintenance notification when maintenance mode is enabled while user is logged in */}
            {showMaintenanceNotification && (
              <MaintenanceNotification
                isAdmin={userRole && userRole.toLowerCase() === 'admin'}
                onDismiss={() => setShowMaintenanceNotification(false)}
              />
            )}
            
            <Routes>
              {/* Default route redirects to /login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Maintenance route */}
              <Route path="/maintenance" element={<MaintenancePage />} />
              
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
        </NotificationProvider>
      </DocumentProvider>
    </UserProvider>
  )
}

export default App
