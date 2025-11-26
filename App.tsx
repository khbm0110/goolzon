
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { UIProvider } from './contexts/UIContext';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CountryPage from './pages/CountryPage';
import MatchesPage from './pages/MatchesPage';
import VideosPage from './pages/VideosPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ClubDashboard from './components/ClubDashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/matches" element={<MatchesPage />} />
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/analysis" element={<CountryPage />} />
      <Route path="/country/:id" element={<CountryPage />} />
      <Route path="/article/:id" element={<ArticleDetailPage />} />
      <Route path="/club/:id" element={<ClubDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  </Layout>
);

const App: React.FC = () => {
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <DataProvider>
            <UIProvider>
              <AppRoutes />
            </UIProvider>
          </DataProvider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
};

export default App;
