// fe/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Simple App wrapper that doesn't use hooks
const AppContainer = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>,
);