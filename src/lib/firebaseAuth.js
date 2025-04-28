import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';

// Collection reference for user sessions
const usersCollection = collection(db, 'users');

/**
 * Initialize Firebase auth with the current user session
 * @param {Object} session - The NextAuth.js session object
 */
export async function initFirebaseAuth(session) {
  if (!session || !session.user || !session.user.id) {
    return false;
  }
  
  try {
    // Check if user exists in Firebase
    const userSession = await getUserSession(session.user.id);
    
    if (userSession) {
      // User exists, update with latest session data
      await saveUserSession(session.user.id, {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        accessToken: session.accessToken,
        lastLogin: new Date().toISOString()
      });
      
      // Store user ID in localStorage for session restoration
      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', session.user.id);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing Firebase auth:', error);
    return false;
  }
}

/**
 * Save user session data to Firebase
 * @param {string} userId - The user's ID
 * @param {Object} sessionData - The session data to save
 */
export async function saveUserSession(userId, sessionData) {
  try {
    const userRef = doc(usersCollection, userId);
    
    await setDoc(userRef, {
      ...sessionData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving user session to Firebase:', error);
    return false;
  }
}

/**
 * Get user session data from Firebase
 * @param {string} userId - The user's ID
 * @returns {Object|null} The user session data or null if not found
 */
export async function getUserSession(userId) {
  if (!userId) return null;
  
  try {
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('Found user session in Firebase:', userId);
      return userData;
    }
    
    console.log('No user session found in Firebase for ID:', userId);
    return null;
  } catch (error) {
    console.error('Error getting user session from Firebase:', error);
    return null;
  }
}

/**
 * Get user session by email
 * @param {string} email - The user's email
 * @returns {Object|null} The user session data or null if not found
 */
export async function getUserSessionByEmail(email) {
  if (!email) return null;
  
  try {
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      console.log('Found user session by email in Firebase:', email);
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    console.log('No user session found in Firebase for email:', email);
    return null;
  } catch (error) {
    console.error('Error getting user session by email from Firebase:', error);
    return null;
  }
}

/**
 * Sign out from both NextAuth and Firebase
 */
export async function signOutFromAll() {
  try {
    // Clear local storage
    if (typeof window !== 'undefined') {
      console.log('Clearing localStorage session data');
      localStorage.removeItem('userId');
      
      // Clear all session-related cookies
      console.log('Clearing session cookies');
      document.cookie = 'userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    // Sign out from Firebase
    console.log('Signing out from Firebase');
    await firebaseSignOut(auth);
    
    // Import and call NextAuth signOut function
    try {
      const { signOut } = await import('next-auth/react');
      console.log('Signing out from NextAuth');
      await signOut({ redirect: false });
    } catch (nextAuthError) {
      console.error('Error signing out from NextAuth:', nextAuthError);
    }
    
    console.log('Sign out complete');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
}
