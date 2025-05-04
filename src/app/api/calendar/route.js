import { cookies } from 'next/headers';
import { getUserSession } from '@/lib/firebaseAuth';
import { 
  listEvents, 
  getEvent,
  createEvent, 
  deleteEvent, 
  updateEvent, 
  formatEventForGoogleCalendar,
  formatEventForFirebase
} from '@/lib/googleCalendar';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Get events from Google Calendar
export async function GET(request) {
  try {
    // Get the user ID from cookies - properly handling in Next.js 14/15
    const cookieStore = await cookies();
    // First, get all cookies and await them
    const cookieList = cookieStore.getAll();
    // Then find the userId cookie in the list
    const userIdCookie = cookieList.find(cookie => cookie.name === 'userId');
    const userId = userIdCookie?.value;
    
    if (!userId) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        events: null
      }, { status: 401 });
    }
    
    // Get user session from Firebase
    const userSession = await getUserSession(userId);
    
    if (!userSession) {
      return Response.json({ 
        success: false, 
        message: "User session not found",
        events: null
      }, { status: 401 });
    }
    
    // Get access token from user session
    const accessToken = userSession.accessToken;
    
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: "Authentication required with Google Calendar access",
        data: null
      }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const calendarId = searchParams.get('calendarId') || 'primary';
    const maxResults = searchParams.get('maxResults') || 10;
    const timeZone = searchParams.get('timeZone');
    const maxAttendees = searchParams.get('maxAttendees');
    
    // If eventId is provided, fetch a specific event
    if (eventId) {
      console.log(`Fetching specific event: ${eventId} from calendar: ${calendarId}`);
      
      // Prepare options for the getEvent call
      const options = {};
      if (timeZone) options.timeZone = timeZone;
      if (maxAttendees) options.maxAttendees = parseInt(maxAttendees);
      
      try {
        // Get the specific event
        const event = await getEvent(accessToken, eventId, calendarId, options);
        
        // Format the event for our application
        const formattedEvent = formatEventForFirebase(event);
        
        const response = {
          success: true,
          message: "Event retrieved successfully",
          events: [formattedEvent]
        };
        
        console.log('GET specific event response:', response);
        return Response.json(response);
      } catch (error) {
        console.error('Error fetching specific event:', error);
        return Response.json({
          success: false,
          message: error.message || "Failed to retrieve event",
          error: error.toString()
        }, { status: error.code === 404 ? 404 : 500 });
      }
    }
    
    // Otherwise, fetch list of events
    console.log(`Fetching up to ${maxResults} events from calendar: ${calendarId}`);
    try {
      // Pass userId to enable automatic token refresh
      const googleEvents = await listEvents(accessToken, parseInt(maxResults), userId, userSession);
      
      // Convert to our app's format
      const events = googleEvents.map(event => formatEventForFirebase(event));
      
      // Store events in Firebase for our app's use
      await syncGoogleEventsToFirebase(events, userId);
      
      const response = { 
        success: true, 
        events: events
      };
      
      console.log('GET events list response:', {
        success: true,
        count: events.length,
        firstEvent: events.length > 0 ? events[0].title : 'No events'
      });
      
      return Response.json(response);
    } catch (error) {
      console.error('Error processing calendar events:', error);
      return Response.json({ 
        success: false, 
        message: error.message || "Failed to process calendar events",
        events: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    
    const errorResponse = { 
      success: false, 
      message: error.message,
      data: null
    };
    
    console.log('GET error response:', errorResponse);
    
    return Response.json(errorResponse, { status: 500 });
  }
}

// Create a new event in Google Calendar
export async function POST(request) {
  try {
    // Get the user ID from cookies - properly handling in Next.js 14/15
    const cookieStore = await cookies();
    // First, get all cookies and await them
    const cookieList = cookieStore.getAll();
    // Then find the userId cookie in the list
    const userIdCookie = cookieList.find(cookie => cookie.name === 'userId');
    const userId = userIdCookie?.value;
    
    if (!userId) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Get user session from Firebase
    const userSession = await getUserSession(userId);
    
    if (!userSession) {
      return Response.json({ 
        success: false, 
        message: "User session not found",
        data: null
      }, { status: 401 });
    }
    
    // Get access token from user session
    const accessToken = userSession.accessToken;
    
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: "Authentication required with Google Calendar access",
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
    
    // Create event in Firebase first
    const newEvent = {
      title,
      date,
      time: time || null,
      location: location || null,
      description: description || null,
      userId: userId, // Use the userId from cookies
      createdAt: serverTimestamp()
    };
    
    // Add the event to Firestore
    const docRef = await addDoc(collection(db, 'events'), newEvent);
    const firebaseEvent = {
      id: docRef.id,
      ...newEvent,
      createdAt: new Date().toISOString()
    };
    
    // Format for Google Calendar
    const googleEventDetails = formatEventForGoogleCalendar(firebaseEvent);
    
    // Create in Google Calendar
    const googleEvent = await createEvent(accessToken, googleEventDetails);
    
    // Update Firebase event with Google Calendar ID
    await updateDoc(doc(db, 'events', docRef.id), {
      googleEventId: googleEvent.id
    });
    
    // Prepare response data
    const responseData = {
      ...firebaseEvent,
      googleEventId: googleEvent.id
    };
    
    // Return the created event with its ID
    console.log('POST create event response:', {
      success: true,
      eventId: googleEvent.id,
      title: responseData.title
    });
    
    return Response.json({ 
      success: true, 
      data: responseData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    
    const errorResponse = { 
      success: false, 
      message: error.message,
      data: null
    };
    
    console.log('POST error response:', errorResponse);
    
    return Response.json(errorResponse, { status: 500 });
  }
}

// Update an event (PATCH method)
export async function PATCH(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    
    if (!userSession) {
      return Response.json({ 
        success: false, 
        message: "User session not found",
        data: null
      }, { status: 401 });
    }
    
    // Get access token from user session
    const accessToken = userSession.accessToken;
    
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: "Authentication required with Google Calendar access",
        data: null
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { id, googleEventId, ...updates } = body;
    
    if (!id || !googleEventId) {
      return Response.json({ 
        success: false, 
        message: "Event ID and Google Event ID are required",
        data: null
      }, { status: 400 });
    }
    
    // Update the event in Firestore
    const eventRef = doc(db, 'events', id);
    await updateDoc(eventRef, updates);
    
    // Format for Google Calendar
    const googleEventDetails = formatEventForGoogleCalendar({
      ...updates,
      id
    });
    
    // Update in Google Calendar
    await updateEvent(accessToken, googleEventId, googleEventDetails);
    
    const responseData = { id, googleEventId, ...updates };
    
    console.log('PATCH update event response:', {
      success: true,
      eventId: googleEventId,
      updates: Object.keys(updates)
    });
    
    return Response.json({ 
      success: true, 
      data: responseData
    });
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    
    const errorResponse = { 
      success: false, 
      message: error.message,
      data: null
    };
    
    console.log('PATCH error response:', errorResponse);
    
    return Response.json(errorResponse, { status: 500 });
  }
}

// Delete an event (DELETE method)
export async function DELETE(request) {
  try {
    // Get the user ID from cookies - properly handling in Next.js 14/15
    const cookieStore = await cookies();
    // First, get all cookies and await them
    const cookieList = cookieStore.getAll();
    // Then find the userId cookie in the list
    const userIdCookie = cookieList.find(cookie => cookie.name === 'userId');
    const userId = userIdCookie?.value;
    
    if (!userId) {
      return Response.json({ 
        success: false, 
        message: "Authentication required",
        data: null
      }, { status: 401 });
    }
    
    // Get user session from Firebase
    const userSession = await getUserSession(userId);
    
    if (!userSession) {
      return Response.json({ 
        success: false, 
        message: "User session not found",
        data: null
      }, { status: 401 });
    }
    
    // Get access token from user session
    const accessToken = userSession.accessToken;
    
    if (!accessToken) {
      return Response.json({ 
        success: false, 
        message: "Authentication required with Google Calendar access",
        data: null
      }, { status: 401 });
    }
    
    // Get event ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const googleEventId = searchParams.get('googleEventId');
    
    if (!id || !googleEventId) {
      return Response.json({ 
        success: false, 
        message: "Event ID and Google Event ID are required",
        data: null
      }, { status: 400 });
    }
    
    // Delete from Google Calendar first
    await deleteEvent(accessToken, googleEventId);
    
    // Then delete from Firestore
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
    
    console.log('DELETE event response:', {
      success: true,
      eventId: googleEventId,
      firebaseId: id
    });
    
    return Response.json({ 
      success: true, 
      data: { id, googleEventId }
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    
    const errorResponse = { 
      success: false, 
      message: error.message,
      data: null
    };
    
    console.log('DELETE error response:', errorResponse);
    
    return Response.json(errorResponse, { status: 500 });
  }
}

// Helper function to sync Google Calendar events to Firebase
async function syncGoogleEventsToFirebase(googleEvents, userId) {
  try {
    // Get existing events for this user
    const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
    const eventsSnapshot = await getDocs(eventsQuery);
    
    // Create a map of existing events by Google Event ID
    const existingEvents = {};
    eventsSnapshot.forEach(doc => {
      const event = doc.data();
      if (event.googleEventId) {
        existingEvents[event.googleEventId] = {
          id: doc.id,
          ...event
        };
      }
    });
    
    // Process each Google event
    for (const event of googleEvents) {
      if (existingEvents[event.googleEventId]) {
        // Update existing event if needed
        const existingEvent = existingEvents[event.googleEventId];
        const eventRef = doc(db, 'events', existingEvent.id);
        
        // Check if update is needed
        if (
          existingEvent.title !== event.title ||
          existingEvent.date !== event.date ||
          existingEvent.time !== event.time ||
          existingEvent.location !== event.location ||
          existingEvent.description !== event.description
        ) {
          await updateDoc(eventRef, {
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            description: event.description,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        // Create new event in Firebase
        await addDoc(collection(db, 'events'), {
          ...event,
          userId,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error syncing Google Calendar events to Firebase:', error);
  }
}
