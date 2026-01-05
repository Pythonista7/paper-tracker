import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ReaderPage } from './pages/ReaderPage';
import { FocusPage } from './pages/FocusPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/read" element={<ReaderPage />} />
        <Route path="/read/:paperId" element={<ReaderPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="/focus/:paperId" element={<FocusPage />} />
    </Routes>
  );
}
