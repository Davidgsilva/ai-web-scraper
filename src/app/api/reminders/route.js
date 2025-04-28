import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

// Get all reminders for the authenticated user
export async function GET(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Query reminders for the current user
    const remindersQuery = query(collection(db, 'reminders'), where('userId', '==', session.user.id));
    const remindersSnapshot = await getDocs(remindersQuery);
    
    // Convert to array of reminder objects
    const reminders = remindersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
    }));
    
    return Response.json({ 
      success: true, 
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Create a new reminder
export async function POST(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { text, time, date } = body;
    
    if (!text) {
      return Response.json({ 
        success: false, 
        message: "Reminder text is required",
        data: null
      }, { status: 400 });
    }
    
    // Create new reminder document
    const newReminder = {
      text,
      time: time || null,
      date: date || null,
      completed: false,
      userId: session.user.id,
      createdAt: serverTimestamp()
    };
    
    // Add the reminder to Firestore
    const docRef = await addDoc(collection(db, 'reminders'), newReminder);
    
    // Return the created reminder with its ID
    return Response.json({ 
      success: true, 
      data: {
        id: docRef.id,
        ...newReminder,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Update a reminder (PATCH method)
export async function PATCH(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return Response.json({ 
        success: false, 
        message: "Reminder ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Update the reminder in Firestore
    const reminderRef = doc(db, 'reminders', id);
    await updateDoc(reminderRef, updates);
    
    return Response.json({ 
      success: true, 
      data: { id, ...updates }
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Delete a reminder (DELETE method)
export async function DELETE(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Get reminder ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ 
        success: false, 
        message: "Reminder ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Delete the reminder from Firestore
    const reminderRef = doc(db, 'reminders', id);
    await deleteDoc(reminderRef);
    
    return Response.json({ 
      success: true, 
      data: { id }
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
