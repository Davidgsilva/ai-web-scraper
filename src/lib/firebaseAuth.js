import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithCustomToken, signOut as firebaseSignOut } from 'firebase/auth';

// Collection references
const usersCollection = collection(db, 'users');
const habitsCollection = (userId) => collection(db, 'users', userId, 'habits');
const habitCompletionsCollection = (userId) => collection(db, 'users', userId, 'habitCompletions');

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

/**
 * Habit Management Functions
 */

/**
 * Get all habits for a user
 * @param {string} userId - The user's ID
 * @returns {Array} Array of habit objects
 */
export async function getUserHabits(userId) {
  if (!userId) return [];
  
  try {
    const habitsRef = habitsCollection(userId);
    const habitsSnapshot = await getDocs(habitsRef);
    
    const habits = [];
    habitsSnapshot.forEach(doc => {
      habits.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return habits;
  } catch (error) {
    console.error('Error getting user habits:', error);
    return [];
  }
}

/**
 * Add a new habit for a user
 * @param {string} userId - The user's ID
 * @param {string} habitName - The name of the habit
 * @returns {Object|null} The created habit or null if failed
 */
export async function addHabit(userId, habitName) {
  if (!userId || !habitName.trim()) return null;
  
  try {
    const habitsRef = habitsCollection(userId);
    const newHabit = {
      name: habitName.trim(),
      createdAt: serverTimestamp()
    };
    
    const docRef = doc(habitsRef);
    await setDoc(docRef, newHabit);
    
    return {
      id: docRef.id,
      ...newHabit,
      createdAt: new Date() // Replace serverTimestamp with actual date for immediate use
    };
  } catch (error) {
    console.error('Error adding habit:', error);
    return null;
  }
}

/**
 * Delete a habit
 * @param {string} userId - The user's ID
 * @param {string} habitId - The habit ID to delete
 * @returns {boolean} Success status
 */
export async function deleteHabit(userId, habitId) {
  if (!userId || !habitId) return false;
  
  try {
    await deleteDoc(doc(db, 'users', userId, 'habits', habitId));
    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
}

/**
 * Toggle habit completion for a specific day
 * @param {string} userId - The user's ID
 * @param {string} habitId - The habit ID
 * @param {Date} date - The date to toggle completion for
 * @returns {Object} Object containing the updated status and completion data
 */
export async function toggleHabitCompletion(userId, habitId, date) {
  if (!userId || !habitId || !date) {
    return { success: false };
  }
  
  try {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const completionRef = doc(db, 'users', userId, 'habitCompletions', `${habitId}-${dateKey}`);
    const completionDoc = await getDoc(completionRef);
    
    if (completionDoc.exists()) {
      // Remove completion if it exists
      await deleteDoc(completionRef);
      return { success: true, completed: false };
    } else {
      // Add completion if it doesn't exist
      await setDoc(completionRef, {
        habitId,
        date: date.toISOString(),
        completedAt: serverTimestamp()
      });
      return { success: true, completed: true };
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get habit completions for a date range
 * @param {string} userId - The user's ID
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @returns {Object} Map of completions by date and habit ID
 */
export async function getHabitCompletions(userId, startDate, endDate) {
  if (!userId || !startDate || !endDate) return {};
  
  try {
    const completionsRef = habitCompletionsCollection(userId);
    const q = query(
      completionsRef,
      where('date', '>=', startDate.toISOString()),
      where('date', '<=', endDate.toISOString())
    );
    
    const completionsSnapshot = await getDocs(q);
    
    const completions = {};
    completionsSnapshot.forEach(doc => {
      const data = doc.data();
      const dateKey = data.date.split('T')[0]; // Convert to YYYY-MM-DD format
      
      if (!completions[dateKey]) {
        completions[dateKey] = {};
      }
      
      completions[dateKey][data.habitId] = true;
    });
    
    return completions;
  } catch (error) {
    console.error('Error getting habit completions:', error);
    return {};
  }
}
