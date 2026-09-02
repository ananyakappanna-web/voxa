import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { AppLayout } from './components/layout/AppLayout';
import { HomeFeed } from './pages/HomeFeed';
import { Explore } from './pages/Explore';
import { Notifications } from './pages/Notifications';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { PostDetail } from './pages/PostDetail';
import { Bookmarks } from './pages/Bookmarks';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Main App 3-Column Layout */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<HomeFeed />} />
                  <Route path="explore" element={<Explore />} />
                  <Route
                    path="notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="messages"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="profile/:username" element={<Profile />} />
                  <Route path="vox/:id" element={<PostDetail />} />
                  <Route
                    path="bookmarks"
                    element={
                      <ProtectedRoute>
                        <Bookmarks />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
