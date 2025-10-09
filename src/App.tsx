import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ConversionWorkspace } from '@/pages/ConversionWorkspace';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/convert" replace />} />
            <Route path="convert" element={<ConversionWorkspace />} />
            <Route
              path="templates"
              element={<div className="text-center text-gray-600">Templates page coming soon...</div>}
            />
            <Route
              path="history"
              element={<div className="text-center text-gray-600">History page coming soon...</div>}
            />
            <Route
              path="gallery"
              element={<div className="text-center text-gray-600">Gallery page coming soon...</div>}
            />
            <Route
              path="profile"
              element={<div className="text-center text-gray-600">Profile page coming soon...</div>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
