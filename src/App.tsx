
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import RequireAuth from '@/components/RequireAuth';
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
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/settings/notifications" element={<RequireAuth><NotificationsSettingsPage /></RequireAuth>} />
            <Route path="/settings/language" element={<RequireAuth><LanguageSettingsPage /></RequireAuth>} />
            <Route path="/settings/blocked-users" element={<RequireAuth><BlockedUsersPage /></RequireAuth>} />
            <Route path="/edit-profile" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
            <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
            <Route path="/direct-message/:userId" element={<RequireAuth><DirectMessagePage /></RequireAuth>} />
            <Route path="/chatroom/:roomId" element={<RequireAuth><ChatRoomPage /></RequireAuth>} />
            <Route path="/chatroom-info/:roomId" element={<RequireAuth><ChatroomInfoPage /></RequireAuth>} />
            <Route path="/create-post" element={<RequireAuth><CreatePostPage /></RequireAuth>} />
            <Route path="/user/:userId" element={<RequireAuth><UserProfilePage /></RequireAuth>} />
            
            {/* Public Routes */}
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
