'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getUserSession } from './firebaseAuth';

// Create auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        // Debug: Log all cookies
        console.log('All cookies:', document.cookie);
        
        // Get user ID from cookie
        const userId = document.cookie
          .split('; ')
          .find(row => row.startsWith('userId='))
          ?.split('=')[1];
          
        console.log('Found userId in cookie:', userId);
          
        if (userId) {
          // Get user session from Firebase
          console.log('Fetching user session from Firebase with ID:', userId);
          const session = await getUserSession(userId);
          console.log('Firebase session result:', session);
          
          if (session) {
            console.log('Setting user in auth context:', session);
            setUser(session);
          } else {
            console.log('No session found in Firebase for ID:', userId);
          }
        } else {
          console.log('No userId cookie found');
        }
      } catch (error) {
        console.error('Error loading user session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSession();
  }, []);

  // Sign in function
  const signIn = () => {
    window.location.href = '/api/auth/google';
  };

  // Sign out function
  const signOut = () => {
    // Clear cookies
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear user state
    setUser(null);
    
    // Redirect to home
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
