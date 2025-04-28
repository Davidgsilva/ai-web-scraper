'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserSession } from '@/lib/firebaseAuth';

/**
 * Custom hook to handle session persistence with Firebase
 * This ensures that the user stays logged in even when the page refreshes
 */
export function useFirebaseSession() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      // If user is logged in with Firebase but not with NextAuth, try to restore session
      if (user && status === 'unauthenticated') {
        try {
          // Get user session data from Firebase
          const savedSession = await getUserSession(user.uid);
          
          if (savedSession && savedSession.accessToken) {
            // Trigger NextAuth sign in with the saved session
            await signIn('credentials', {
              id: savedSession.id,
              accessToken: savedSession.accessToken,
              callbackUrl: window.location.pathname,
              redirect: false
            });
          }
        } catch (error) {
          console.error('Error restoring session from Firebase:', error);
        }
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [status]);

  return {
    session,
    status: isLoading ? 'loading' : status,
    firebaseUser
  };
}
