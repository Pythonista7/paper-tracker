import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ReaderPage } from './pages/ReaderPage';
import { FocusPage } from './pages/FocusPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/read" element={<ReaderPage />} />
          <Route path="/read/:paperId" element={<ReaderPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/focus/:paperId" element={<FocusPage />} />
      </Routes>
    </AuthProvider>
  );
}
