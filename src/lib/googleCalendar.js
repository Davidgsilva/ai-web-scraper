import { google } from 'googleapis';

// Function to create Google Calendar API client
export function getGoogleCalendarClient(accessToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// List upcoming events from the user's primary calendar
export async function listEvents(accessToken, maxResults = 10) {
  try {
    console.log(`Initializing Google Calendar client with token: ${accessToken.substring(0, 10)}...`);
    const calendar = getGoogleCalendarClient(accessToken);
    
    // Calculate date range - from 30 days ago to 365 days in the future
    // This ensures we get past events and future events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    console.log('Requesting calendar events with parameters:', {
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: oneYearFromNow.toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: oneYearFromNow.toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    console.log('Google Calendar API response status:', response.status);
    console.log('Events returned:', response.data.items?.length || 0);
    
    if (response.data.items?.length === 0) {
      console.log('No events found in Google Calendar');
    } else {
      console.log('First event summary:', response.data.items[0]?.summary || 'No summary');
    }
    
    return response.data.items || [];
  } catch (error) {
    console.error('Error listing calendar events:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data
    });
    
    // Return empty array instead of throwing to prevent breaking the application
    return [];
  }
}

// Get a specific event by its ID
export async function getEvent(accessToken, eventId, calendarId = 'primary', options = {}) {
  try {
    const calendar = getGoogleCalendarClient(accessToken);
    
    // Prepare request parameters
    const params = {
      calendarId: calendarId,
      eventId: eventId,
    };
    
    // Add optional parameters if provided
    if (options.timeZone) params.timeZone = options.timeZone;
    if (options.maxAttendees) params.maxAttendees = options.maxAttendees;
    
    console.log(`Fetching event ${eventId} from calendar ${calendarId}`);
    const response = await calendar.events.get(params);
    
    return response.data;
  } catch (error) {
    console.error(`Error getting calendar event ${eventId}:`, error);
    throw error;
  }
}

// Create a new event in the user's primary calendar
export async function createEvent(accessToken, eventDetails) {
  try {
    const calendar = getGoogleCalendarClient(accessToken);
    
    // Format the event for Google Calendar API
    const event = {
      summary: eventDetails.title,
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: eventDetails.location || '',
      reminders: {
        useDefault: true
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Delete an event from the user's primary calendar
export async function deleteEvent(accessToken, eventId) {
  try {
    const calendar = getGoogleCalendarClient(accessToken);
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

// Update an existing event in the user's primary calendar
export async function updateEvent(accessToken, eventId, eventDetails) {
  try {
    const calendar = getGoogleCalendarClient(accessToken);
    
    // Get the existing event first
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    // Merge the existing event with the updates
    const updatedEvent = {
      ...existingEvent.data,
      summary: eventDetails.title || existingEvent.data.summary,
      description: eventDetails.description || existingEvent.data.description,
      location: eventDetails.location || existingEvent.data.location,
    };
    
    // Update start and end times if provided
    if (eventDetails.startDateTime) {
      updatedEvent.start = {
        dateTime: eventDetails.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    if (eventDetails.endDateTime) {
      updatedEvent.end = {
        dateTime: eventDetails.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

// Helper function to convert Firebase event format to Google Calendar format
export function formatEventForGoogleCalendar(firebaseEvent) {
  // Parse date and time strings from Firebase
  const dateStr = firebaseEvent.date;
  const timeStr = firebaseEvent.time || '00:00';
  
  // Create start and end date objects
  const startDate = new Date(`${dateStr} ${timeStr}`);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1); // Default to 1 hour duration
  
  return {
    title: firebaseEvent.title,
    description: firebaseEvent.description || '',
    location: firebaseEvent.location || '',
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString()
  };
}

// Helper function to convert Google Calendar event to Firebase format
export function formatEventForFirebase(googleEvent) {
  try {
    if (!googleEvent) {
      console.error('Received undefined or null Google Calendar event');
      return null;
    }
    
    // Log the raw event for debugging
    console.log('Formatting Google Calendar event:', {
      id: googleEvent.id,
      summary: googleEvent.summary,
      start: googleEvent.start,
      end: googleEvent.end
    });
    
    // Handle case where start date/time might be missing
    if (!googleEvent.start || (!googleEvent.start.dateTime && !googleEvent.start.date)) {
      console.error('Google Calendar event missing start date/time:', googleEvent.id);
      return null;
    }
    
    // Parse the start date/time
    const startDateTime = new Date(googleEvent.start.dateTime || googleEvent.start.date);
    
    // Create the formatted event
    const formattedEvent = {
      title: googleEvent.summary || 'Untitled Event',
      date: startDateTime.toISOString().split('T')[0],
      time: googleEvent.start.dateTime ? startDateTime.toTimeString().split(' ')[0].substring(0, 5) : null,
      location: googleEvent.location || null,
      description: googleEvent.description || null,
      googleEventId: googleEvent.id
    };
    
    // Log the formatted event
    console.log('Formatted event:', formattedEvent);
    
    return formattedEvent;
  } catch (error) {
    console.error('Error formatting Google Calendar event:', error);
    console.error('Problematic event:', googleEvent);
    return null;
  }
}
