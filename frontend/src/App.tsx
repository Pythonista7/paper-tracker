import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ReaderPage } from './pages/ReaderPage';
import { FocusPage } from './pages/FocusPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GardenPage } from './pages/GardenPage';
import { GardenReaderPage } from './pages/GardenReaderPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicGateRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div>Loading...</div>;
    // If user is logged in, redirect to dashboard, else show Garden
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <GardenPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Public Garden Routes */}
        <Route path="/garden" element={<GardenPage />} />
        <Route path="/garden/:id" element={<GardenReaderPage />} />
        
        {/* Entry Point */}
        <Route path="/" element={<PublicGateRoute />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/read" element={<ReaderPage />} />
          <Route path="/read/:paperId" element={<ReaderPage />} />
        </Route>
        
        <Route path="/focus/:paperId" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
