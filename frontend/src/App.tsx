import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ComposePage } from '@/pages/ComposePage';
import { ScheduledPage } from '@/pages/ScheduledPage';
import { SentPage } from '@/pages/SentPage';
import { FailedPage } from '@/pages/FailedPage';
import { api } from '@/lib/api';

function ProtectedLayout() {
  return api.auth.isAuthenticated() ? <AppLayout /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/scheduled" element={<ScheduledPage />} />
          <Route path="/sent" element={<SentPage />} />
          <Route path="/failed" element={<FailedPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
