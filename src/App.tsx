import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { EnhancedConversionWorkspace } from '@/pages/EnhancedConversionWorkspace';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { PublicGalleryPage } from '@/pages/PublicGalleryPage';
import { CommandPalette } from '@/components/CommandPalette';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommandPalette />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/convert" replace />} />

            <Route path="convert" element={<EnhancedConversionWorkspace />} />
            <Route path="gallery" element={<PublicGalleryPage />} />

            <Route
              path="templates"
              element={
                <ProtectedRoute>
                  <TemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
