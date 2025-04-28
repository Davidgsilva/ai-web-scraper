import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';
import { 
  createEvent as createGoogleEvent,
  deleteEvent as deleteGoogleEvent,
  updateEvent as updateGoogleEvent,
  formatEventForGoogleCalendar
} from '@/lib/googleCalendar';

// Get all events for the authenticated user
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
    
    // Query events for the current user
    const eventsQuery = query(collection(db, 'events'), where('userId', '==', session.user.id));
    const eventsSnapshot = await getDocs(eventsQuery);
    
    // Convert to array of event objects
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
    }));
    
    return Response.json({ 
      success: true, 
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Create a new event
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
    const { title, date, time, location, description } = body;
    
    if (!title || !date) {
      return Response.json({ 
        success: false, 
        message: "Event title and date are required",
        data: null
      }, { status: 400 });
    }
    
    // Create new event document
    const newEvent = {
      title,
      date,
      time: time || null,
      location: location || null,
      description: description || null,
      userId: session.user.id,
      createdAt: serverTimestamp()
    };
    
    // Add the event to Firestore
    const docRef = await addDoc(collection(db, 'events'), newEvent);
    
    const firebaseEvent = {
      id: docRef.id,
      ...newEvent,
      createdAt: new Date().toISOString()
    };
    
    // If we have Google Calendar access, add the event there too
    if (session.accessToken) {
      try {
        // Format for Google Calendar
        const googleEventDetails = formatEventForGoogleCalendar(firebaseEvent);
        
        // Create in Google Calendar
        const googleEvent = await createGoogleEvent(session.accessToken, googleEventDetails);
        
        // Update Firebase event with Google Calendar ID
        await updateDoc(doc(db, 'events', docRef.id), {
          googleEventId: googleEvent.id
        });
        
        // Add Google Calendar ID to the response
        firebaseEvent.googleEventId = googleEvent.id;
      } catch (googleError) {
        console.error('Error creating Google Calendar event:', googleError);
        // Continue even if Google Calendar integration fails
      }
    }
    
    // Return the created event with its ID
    return Response.json({ 
      success: true, 
      data: firebaseEvent
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Update an event (PATCH method)
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
        message: "Event ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Update the event in Firestore
    const eventRef = doc(db, 'events', id);
    await updateDoc(eventRef, updates);
    
    return Response.json({ 
      success: true, 
      data: { id, ...updates }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}

// Delete an event (DELETE method)
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
    
    // Get event ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ 
        success: false, 
        message: "Event ID is required",
        data: null
      }, { status: 400 });
    }
    
    // Get the event to check if it has a Google Calendar ID
    const eventRef = doc(db, 'events', id);
    const eventSnapshot = await getDoc(eventRef);
    
    if (!eventSnapshot.exists()) {
      return Response.json({ 
        success: false, 
        message: "Event not found",
        data: null
      }, { status: 404 });
    }
    
    const event = eventSnapshot.data();
    
    // If the event has a Google Calendar ID and we have access token, delete from Google Calendar
    if (event.googleEventId && session.accessToken) {
      try {
        await deleteGoogleEvent(session.accessToken, event.googleEventId);
      } catch (googleError) {
        console.error('Error deleting Google Calendar event:', googleError);
        // Continue even if Google Calendar deletion fails
      }
    }
    
    // Delete the event from Firestore
    await deleteDoc(eventRef);
    
    return Response.json({ 
      success: true, 
      data: { id, googleEventId: event.googleEventId }
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
