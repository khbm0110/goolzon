
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MatchesPage from './pages/MatchesPage';
import VideosPage from './pages/VideosPage';
import CountryPage from './pages/CountryPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ClubsPage from './pages/ClubsPage';
import ClubDashboard from './components/ClubDashboard';
import UserProfile from './components/UserProfile';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// 🔹 Protected Route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <SettingsProvider>
        <AuthProvider>
          <DataProvider>
            <UIProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/matches" element={<MatchesPage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/analysis" element={<CountryPage />} />
                  <Route path="/country/:id" element={<CountryPage />} />
                  <Route path="/article/:id" element={<ArticleDetailPage />} />
                  <Route path="/clubs" element={<ClubsPage />} />
                  <Route path="/club/:id" element={<ClubDashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                </Routes>
              </Layout>
            </UIProvider>
          </DataProvider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  );
};

export default App;
