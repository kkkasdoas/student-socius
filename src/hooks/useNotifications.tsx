
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initializeFirebase, 
  getFCMToken, 
  registerTokenWithServer,
  setupNotificationListeners,
  requestNotificationPermission
} from '@/services/firebaseService';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
    
    // Request notification permission
    const requestPermission = async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      
      if (granted) {
        setupNotificationListeners();
      }
    };
    
    requestPermission();
  }, []);
  
  useEffect(() => {
    // Register FCM token when user logs in and permission is granted
    const registerToken = async () => {
      if (currentUser && permissionGranted) {
        try {
          const token = await getFCMToken();
          setFcmToken(token);
          
          // Register token with our server
          if (token) {
            await registerTokenWithServer(currentUser.id, token);
          }
        } catch (error) {
          console.error('Error registering for notifications:', error);
        }
      }
    };
    
    registerToken();
  }, [currentUser, permissionGranted]);
  
  return {
    permissionGranted,
    fcmToken
  };
};
