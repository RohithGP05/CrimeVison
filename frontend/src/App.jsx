import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CrimeMap from './pages/CrimeMap';
import Predictions from './pages/Predictions';
import NetworkGraph from './pages/NetworkGraph';
import Offenders from './pages/Offenders';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

// Route protection guard for authenticated staff
const PrivateRoute = ({ children, requiresAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-xs text-slate-400">
        <span className="w-6 h-6 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin mb-3"></span>
        <span>Booting KSP CrimeVision AI Gateway...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout workspace grid for side nav and top navbar wraps
const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-slate-950/20">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Gate */}
          <Route path="/login" element={<Login />} />

          {/* Secure Analyst Ledger Views */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <AppLayout><Dashboard /></AppLayout>
              </PrivateRoute>
            } 
          />
          
          {/* Map view mapping */}
          <Route 
            path="/map" 
            element={
              <PrivateRoute>
                <AppLayout><CrimeMap /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Analytics points to dashboard */}
          <Route 
            path="/analytics" 
            element={
              <PrivateRoute>
                <AppLayout><Dashboard /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Predictions parameters */}
          <Route 
            path="/predictions" 
            element={
              <PrivateRoute>
                <AppLayout><Predictions /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Accomplices connection maps */}
          <Route 
            path="/network" 
            element={
              <PrivateRoute>
                <AppLayout><NetworkGraph /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Suspect Offender lists */}
          <Route 
            path="/offenders" 
            element={
              <PrivateRoute>
                <AppLayout><Offenders /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Analytical report downloads */}
          <Route 
            path="/reports" 
            element={
              <PrivateRoute>
                <AppLayout><Reports /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Admin clearance RETRAIN sandbox */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute requiresAdmin={true}>
                <AppLayout><Admin /></AppLayout>
              </PrivateRoute>
            } 
          />

          {/* Redirect to main ledger dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
