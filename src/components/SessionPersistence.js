'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { getUserSession, getUserSessionByEmail, initFirebaseAuth } from '@/lib/firebaseAuth';

/**
 * Component to handle session persistence with Firebase
 * This ensures that the user stays logged in even when the page refreshes
 */
export default function SessionPersistence() {
  const { data: session, status } = useSession();
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  // Initialize Firebase auth when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('Initializing Firebase auth with session');
      initFirebaseAuth(session);
    }
  }, [status, session]);

  // Restore session from Firebase when not authenticated
  useEffect(() => {
    // Check if user is intentionally signed out
    const isIntentionalSignOut = localStorage.getItem('intentionalSignOut') === 'true';
    
    // Only run this if the user is not authenticated, not already trying to restore,
    // and not intentionally signed out
    if (status === 'unauthenticated' && !isRestoringSession && !isIntentionalSignOut) {
      const restoreSession = async () => {
        try {
          setIsRestoringSession(true);
          console.log('Attempting to restore session from Firebase');
          
          // Try to get user ID from localStorage (saved during previous login)
          const userId = localStorage.getItem('userId');
          
          if (userId) {
            console.log('Found userId in localStorage:', userId);
            // Get user session data from Firebase
            const savedSession = await getUserSession(userId);
            
            if (savedSession && savedSession.accessToken) {
              console.log('Found valid session in Firebase, signing in...');
              // Trigger NextAuth sign in with the saved session
              const result = await signIn('credentials', {
                id: savedSession.id,
                accessToken: savedSession.accessToken,
                callbackUrl: window.location.pathname,
                redirect: false
              });
              
              console.log('Sign in result:', result);
              return; // Exit if we successfully signed in
            } else {
              console.log('No valid session found for userId:', userId);
              localStorage.removeItem('userId'); // Clear invalid ID
            }
          }
          
          // If we get here, we couldn't restore by ID, try by email from cookie
          // This is a fallback method that might work in some browsers
          const emailFromCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('userEmail='))
            ?.split('=')[1];
          
          if (emailFromCookie) {
            console.log('Trying to restore session by email from cookie');
            // Check if we've already tried this email recently to prevent loops
            const lastEmailAttempt = localStorage.getItem('lastEmailAttempt');
            const lastAttemptTime = localStorage.getItem('lastAttemptTime');
            
            // If we've tried this email in the last 10 seconds, don't try again
            if (lastEmailAttempt === emailFromCookie && 
                lastAttemptTime && 
                (Date.now() - parseInt(lastAttemptTime)) < 10000) {
              console.log('Skipping email restore attempt - already tried recently');
              return;
            }
            
            // Record this attempt to prevent loops
            localStorage.setItem('lastEmailAttempt', emailFromCookie);
            localStorage.setItem('lastAttemptTime', Date.now().toString());
            
            const userByEmail = await getUserSessionByEmail(decodeURIComponent(emailFromCookie));
            
            if (userByEmail && userByEmail.accessToken) {
              console.log('Found user by email, signing in...');
              await signIn('credentials', {
                id: userByEmail.id,
                accessToken: userByEmail.accessToken,
                callbackUrl: window.location.pathname,
                redirect: false
              });
            } else {
              // If no valid session found for this email, clear the cookie to prevent loops
              console.log('No valid session found for email, clearing cookie');
              document.cookie = 'userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
          }
        } catch (error) {
          console.error('Error restoring session from Firebase:', error);
        } finally {
          setIsRestoringSession(false);
        }
      };
      
      restoreSession();
    } else if (status === 'authenticated' && session?.user?.id) {
      // Reset intentional sign out flag when authenticated
      localStorage.removeItem('intentionalSignOut');
      
      // Save user ID to localStorage and cookie for future session restoration
      localStorage.setItem('userId', session.user.id);
      if (session.user.email) {
        document.cookie = `userEmail=${encodeURIComponent(session.user.email)}; path=/; max-age=2592000`; // 30 days
      }
    }
  }, [status, session, isRestoringSession]);

  // This component doesn't render anything
  return null;
}
