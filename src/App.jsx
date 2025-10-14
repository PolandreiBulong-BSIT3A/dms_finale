import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './login_system/login.jsx'
import Dashboard from './dashboards/Dashboard.jsx'
import Request from './dashboards/components/Request.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { DocumentProvider } from './contexts/DocumentContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import './App.css'

function App() {

  return (
    <UserProvider>
      <DocumentProvider>
        <NotificationProvider>
          <div className="App">
            
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
        </NotificationProvider>
      </DocumentProvider>
    </UserProvider>
  )
}

export default App
