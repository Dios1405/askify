import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForumPage from './pages/ForumPage';
import PublicTicketDetailPage from './pages/PublicTicketDetailPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, color: '#9499b0' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, color: '#9499b0' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/app" />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Public pages — forum layout with top navbar */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<ForumPage />} />
        <Route path="ticket/:id" element={<PublicTicketDetailPage />} />
        <Route path="kb/:id" element={<ArticleDetailPage />} />
      </Route>

      {/* App pages — sidebar layout, requires login */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="knowledge-base/:id" element={<ArticleDetailPage />} />
        <Route path="analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
