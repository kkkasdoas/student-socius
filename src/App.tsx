import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import HomePage from '@/pages/HomePage';
import Feed from '@/pages/Feed';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import SettingsPage from '@/pages/SettingsPage';
import MessagesPage from '@/pages/MessagesPage';
import DirectMessagePage from '@/pages/DirectMessagePage';
import ChatRoomPage from '@/pages/ChatRoomPage';
import ChatroomInfoPage from '@/pages/ChatroomInfoPage';
import CreatePostPage from '@/pages/CreatePostPage';
import EditProfilePage from '@/pages/EditProfilePage';
import NotificationsSettingsPage from '@/pages/NotificationsSettingsPage';
import LanguageSettingsPage from '@/pages/LanguageSettingsPage';
import BlockedUsersPage from '@/pages/BlockedUsersPage';
import UserProfilePage from '@/pages/UserProfilePage';
import SecureRoute from '@/components/SecureRoute';
import './App.css';

// Import Inter font
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="font-inter">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/feed" element={
              <SecureRoute>
                <Feed />
              </SecureRoute>
            } />
            <Route path="/settings" element={
              <SecureRoute>
                <SettingsPage />
              </SecureRoute>
            } />
            <Route path="/settings/notifications" element={
              <SecureRoute>
                <NotificationsSettingsPage />
              </SecureRoute>
            } />
            <Route path="/settings/language" element={
              <SecureRoute>
                <LanguageSettingsPage />
              </SecureRoute>
            } />
            <Route path="/settings/blocked-users" element={
              <SecureRoute>
                <BlockedUsersPage />
              </SecureRoute>
            } />
            <Route path="/edit-profile" element={
              <SecureRoute>
                <EditProfilePage />
              </SecureRoute>
            } />
            <Route path="/messages" element={
              <SecureRoute>
                <MessagesPage />
              </SecureRoute>
            } />
            <Route path="/direct-message/:userId" element={
              <SecureRoute>
                <DirectMessagePage />
              </SecureRoute>
            } />
            <Route path="/chatroom/:roomId" element={
              <SecureRoute>
                <ChatRoomPage />
              </SecureRoute>
            } />
            <Route path="/chatroom-info/:roomId" element={
              <SecureRoute>
                <ChatroomInfoPage />
              </SecureRoute>
            } />
            <Route path="/create-post" element={
              <SecureRoute>
                <CreatePostPage />
              </SecureRoute>
            } />
            <Route path="/user/:userId" element={
              <SecureRoute>
                <UserProfilePage />
              </SecureRoute>
            } />
            
            {/* Other routes */}
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
  );
}

export default App;
