
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
            <Route path="/feed" element={<Feed />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/direct-message/:userId" element={<DirectMessagePage />} />
            <Route path="/chatroom/:roomId" element={<ChatRoomPage />} />
            <Route path="/chatroom-info/:roomId" element={<ChatroomInfoPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
