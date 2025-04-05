import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from '@/pages/HomePage';
import Feed from '@/pages/Feed';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import SettingsPage from '@/pages/SettingsPage';
import ConversationsPage from '@/pages/ConversationsPage';
import MessagePage from '@/pages/MessagePage';
import ChatroomInfoPage from '@/pages/ChatroomInfoPage';
import CreatePostPage from '@/pages/CreatePostPage';
import EditProfilePage from '@/pages/EditProfilePage';
import NotificationsSettingsPage from '@/pages/NotificationsSettingsPage';
import LanguageSettingsPage from '@/pages/LanguageSettingsPage';
import BlockedUsersPage from '@/pages/BlockedUsersPage';
import UserProfilePage from '@/pages/UserProfilePage';
import Index from '@/pages/Index';
import './App.css';
import React from 'react';

// Import Inter font
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Redirect component for chatroom to conversation
const ChatroomRedirect = () => {
  const { roomId } = useParams();
  return <Navigate replace to={`/conversation/${roomId}`} />;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  React.useEffect(() => {
    // Set a timeout to prevent getting stuck in loading state
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached in ProtectedRoute");
        setLoadingTimeout(true);
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  // If we're still loading and haven't hit the timeout yet
  if (isLoading && !loadingTimeout) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  // If we're not authenticated (either because auth failed or loading timed out)
  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="font-inter">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Index route handles authentication and redirection */}
              <Route path="/" element={<Index />} />
              
              {/* Protected routes */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/feed" element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings/notifications" element={
                <ProtectedRoute>
                  <NotificationsSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings/language" element={
                <ProtectedRoute>
                  <LanguageSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/settings/blocked-users" element={
                <ProtectedRoute>
                  <BlockedUsersPage />
                </ProtectedRoute>
              } />
              <Route path="/edit-profile" element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              } />
              
              {/* Messaging System Routes */}
              <Route path="/conversations" element={
                <ProtectedRoute>
                  <ConversationsPage />
                </ProtectedRoute>
              } />
              {/* Redirect old /messages route to the new conversations page */}
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Navigate replace to="/conversations" />
                </ProtectedRoute>
              } />
              {/* Unified route for both private and group conversations */}
              <Route path="/conversation/:conversationId" element={
                <ProtectedRoute>
                  <MessagePage />
                </ProtectedRoute>
              } />
              {/* Route for chatroom info */}
              <Route path="/chatroom-info/:roomId" element={
                <ProtectedRoute>
                  <ChatroomInfoPage />
                </ProtectedRoute>
              } />
              
              {/* Legacy routes for backwards compatibility */}
              <Route path="/messages/:userId" element={
                <ProtectedRoute>
                  <Navigate replace to="/conversations" />
                </ProtectedRoute>
              } />
              <Route path="/chatroom/:roomId" element={
                <ProtectedRoute>
                  <ChatroomRedirect />
                </ProtectedRoute>
              } />
              
              <Route path="/create-post" element={
                <ProtectedRoute>
                  <CreatePostPage />
                </ProtectedRoute>
              } />
              <Route path="/user/:userId" element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/faq" element={<NotFound />} />
              <Route path="/contact" element={<NotFound />} />
              <Route path="/privacy-policy" element={<NotFound />} />
              <Route path="/terms" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
