import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext.jsx';
import { AccessibilityProvider } from './context/AccessibilityContext.jsx';
import RatingFlow from './pages/RatingFlow.jsx';
import { AuthProvider } from './admin/AuthContext.jsx';
import ProtectedRoute from './admin/components/ProtectedRoute.jsx';
import AdminLayout from './admin/components/AdminLayout.jsx';
import LoginPage from './admin/pages/LoginPage.jsx';
import DashboardPage from './admin/pages/DashboardPage.jsx';
import FeedbackPage from './admin/pages/FeedbackPage.jsx';
import AnalyticsPage from './admin/pages/AnalyticsPage.jsx';
import BusinessesPage from './admin/pages/BusinessesPage.jsx';
import SettingsPage from './admin/pages/SettingsPage.jsx';
import { t } from './locales/index.js';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center text-body px-8 text-center">
      {t.common.home_scan_hint}
    </div>
  );
}

function CustomerApp() {
  return (
    <I18nProvider>
      <AccessibilityProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r" element={<RatingFlow />} />
          <Route path="/r/:slug" element={<RatingFlow />} />
        </Routes>
      </AccessibilityProvider>
    </I18nProvider>
  );
}

function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<CustomerApp />} />
    </Routes>
  );
}
