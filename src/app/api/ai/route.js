import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';
import { listEvents, formatEventForFirebase } from '@/lib/googleCalendar';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Function to generate assistant response using Claude
async function generateAssistantResponse(userInput, userData, calendarEvents = []) {
  console.log('Generating assistant response for input:', userInput);
  
  try {
    console.log('Calling Anthropic API...');
    
    // Create a system prompt that includes user context
    const systemPrompt = `You are a helpful AI assistant for calendar management. 
    You help the user manage their Google Calendar events.
    
    IMPORTANT: Tasks and reminders functionality has been disabled. You can only help with calendar events.
    
    The user's Google Calendar events are:
    ${calendarEvents.length > 0 ? JSON.stringify(calendarEvents, null, 2) : 'No calendar events available'}
    
    IMPORTANT: The app is connected to Google Calendar! When you add or modify calendar events, they will be synchronized with the user's Google Calendar automatically.
    
    When the user asks to:
    1. Add a calendar event - Extract date, time, title and respond confirming you've added it to Google Calendar
    2. List or show calendar events - Provide a formatted list of the requested events
    3. Delete calendar events - Confirm the event has been deleted
    4. Sync calendar - Let the user know their Google Calendar is being synchronized
    5. Summarize calendar - Provide a summary of upcoming events from their Google Calendar
    
    If the user asks about tasks or reminders, politely inform them that those features are currently disabled, and you can only help with calendar management.
    
    For calendar events, try to extract as much information as possible:
    - Title/summary of the event
    - Date in YYYY-MM-DD format
    - Time in HH:MM format (use 24-hour format if possible)
    - Location (if provided)
    - Description/details (if provided)
    
    When summarizing calendar events:
    - Group events by day
    - Highlight important events
    - Mention conflicts or busy periods
    - Suggest free time slots if the user is looking to schedule something new
    
    Always respond in a helpful, friendly manner.`;
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userInput }],
    });
    
    return {
      content: response.content[0].text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error generating response with Claude:', error);
    throw error;
  }
}

// Function to parse assistant response for actions
async function processAssistantActions(response, userId) {
  // This is a simplified implementation - in a real app, you would use
  // a more sophisticated parsing approach or structured output from Claude
  const content = response.content.toLowerCase();
  
  try {
    console.log('Processing assistant actions - tasks and reminders disabled');
    
    // Task creation disabled
    if (content.includes('added task') || content.includes('created task')) {
      console.log('Task creation requested but functionality is disabled');
      // Task functionality disabled
      /* Original implementation
      const taskMatch = response.content.match(/task[:\s]+"([^"]+)"/i) || 
                        response.content.match(/task[:\s]+(.+?)(?:\.|\n|$)/i);
      
      if (taskMatch && taskMatch[1]) {
        await addDoc(collection(db, 'tasks'), {
          userId,
          title: taskMatch[1].trim(),
          completed: false,
          createdAt: serverTimestamp()
        });
      }
      */
    }
    
    // Check for calendar event creation - KEEP THIS FUNCTIONALITY
    if (content.includes('added to calendar') || content.includes('scheduled event')) {
      console.log('Calendar event creation detected');
      const eventMatch = response.content.match(/event[:\s]+"([^"]+)"/i) || 
                         response.content.match(/event[:\s]+(.+?)(?:\.|\n|$)/i);
      const dateMatch = response.content.match(/on[:\s]+([\w\s,]+)(?:\.|\n|$)/i) ||
                        response.content.match(/date[:\s]+([\w\s,]+)(?:\.|\n|$)/i);
      
      if (eventMatch && eventMatch[1]) {
        console.log('Adding calendar event:', eventMatch[1].trim());
        await addDoc(collection(db, 'events'), {
          userId,
          title: eventMatch[1].trim(),
          date: dateMatch ? dateMatch[1].trim() : 'No date specified',
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Reminder creation disabled
    if (content.includes('set reminder') || content.includes('remind you')) {
      console.log('Reminder creation requested but functionality is disabled');
      // Reminder functionality disabled
      /* Original implementation
      const reminderMatch = response.content.match(/reminder[:\s]+"([^"]+)"/i) || 
                            response.content.match(/reminder[:\s]+(.+?)(?:\.|\n|$)/i);
      const timeMatch = response.content.match(/at[:\s]+([\w\s:,]+)(?:\.|\n|$)/i) ||
                        response.content.match(/time[:\s]+([\w\s:,]+)(?:\.|\n|$)/i);
      
      if (reminderMatch && reminderMatch[1]) {
        await addDoc(collection(db, 'reminders'), {
          userId,
          text: reminderMatch[1].trim(),
          time: timeMatch ? timeMatch[1].trim() : 'No time specified',
          completed: false,
          createdAt: serverTimestamp()
        });
      }
      */
    }
    
    return true;
  } catch (error) {
    console.error('Error processing assistant actions:', error);
    return false;
  }
}

// Function to get user data from Firestore
async function getUserData(userId) {
  try {
    console.log('Getting user data - tasks and reminders disabled');
    
    const userData = {
      events: [] // Only keeping events, tasks and reminders disabled
    };
    
    // Tasks retrieval disabled
    console.log('Tasks retrieval disabled');
    /* Original implementation
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => {
      userData.tasks.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      });
    });
    */
    
    // Get events - KEEP THIS FUNCTIONALITY
    console.log('Retrieving events for user:', userId);
    const eventsQuery = query(collection(db, 'events'), where('userId', '==', userId));
    const eventsSnapshot = await getDocs(eventsQuery);
    eventsSnapshot.forEach(doc => {
      userData.events.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      });
    });
    console.log(`Retrieved ${userData.events.length} events`);
    
    // Reminders retrieval disabled
    console.log('Reminders retrieval disabled');
    /* Original implementation
    const remindersQuery = query(collection(db, 'reminders'), where('userId', '==', userId));
    const remindersSnapshot = await getDocs(remindersQuery);
    remindersSnapshot.forEach(doc => {
      userData.reminders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      });
    });
    */
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Function to get calendar events from Google Calendar
async function getCalendarEvents(accessToken, maxResults = 20) {
  try {
    if (!accessToken) {
      console.log('No access token available for fetching calendar events');
      return [];
    }
    
    // Check if the token looks like a valid OAuth token
    if (!accessToken.startsWith('ya29.') && !accessToken.startsWith('Bearer ')) {
      console.warn('Access token does not have expected format for Google OAuth. Token prefix:', accessToken.substring(0, 5));
    }
    
    console.log('Fetching calendar events from Google Calendar with token:', accessToken.substring(0, 10) + '...');
    console.log('Max results requested:', maxResults);
    
    try {
      // Attempt to fetch events from Google Calendar
      const googleEvents = await listEvents(accessToken, maxResults);
      console.log('Raw Google Calendar API response:', {
        eventCount: googleEvents?.length || 0,
        firstEventSummary: googleEvents?.length > 0 ? googleEvents[0]?.summary : 'No events'
      });
      
      // Convert to our app's format and filter out null values
      const events = googleEvents
        .map(event => formatEventForFirebase(event))
        .filter(event => event !== null);
      
      console.log(`Fetched ${googleEvents.length} events, formatted ${events.length} valid events`);
      
      if (events.length === 0) {
        console.log('No valid events found in Google Calendar. This could be because:')
        console.log('1. The user truly has no events')
        console.log('2. The access token might not have calendar scope permissions')
        console.log('3. There might be an issue with the date range being queried')
        console.log('4. The events might have invalid format')
        
        // Check if we have the correct scopes
        if (accessToken.length > 100) {
          console.log('Token appears to be of sufficient length for Google OAuth');
        } else {
          console.warn('Token appears too short for Google OAuth, might be missing scopes');
        }
      } else {
        console.log('First event:', JSON.stringify(events[0]));
      }
      
      return events;
    } catch (apiError) {
      console.error('Google Calendar API error:', apiError);
      console.error('This might be due to invalid token or permission issues');
      
      // Check if this is an auth error
      if (apiError.code === 401 || apiError.message?.includes('auth')) {
        console.error('Authentication error detected. This is likely due to:');
        console.error('1. Invalid or expired access token');
        console.error('2. Missing calendar scope permissions');
        console.error('3. Token not properly passed to the API');
      }
      
      return [];
    }
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    console.error('Stack trace:', error.stack);
    return [];
  }
}

export async function POST(request) {
  console.log('AI Assistant API route called', new Date().toISOString());
  
  try {
    // First, try to get the request body
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('Successfully parsed request body');
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return Response.json({
        success: false,
        message: 'Invalid request format - could not parse JSON',
        data: null
      }, { status: 400 });
    }
    
    // Extract message and userId from the request body
    const { message, userId: bodyUserId } = requestBody;
    console.log('Message from request:', message ? `"${message.substring(0, 30)}..."` : 'Missing');
    console.log('UserId from request:', bodyUserId || 'Missing');
    
    if (!message) {
      return Response.json({
        success: false,
        message: 'Message is required',
        data: null
      }, { status: 400 });
    }
    
    // Get the authenticated session
    let session;
    let userId = bodyUserId; // Use userId from body as first option
    
    try {
      session = await getServerSession(authOptions);
      if (session?.user?.id && !userId) {
        userId = session.user.id;
        console.log('Using user ID from session:', userId);
      }
    } catch (sessionError) {
      console.error('Error getting server session:', sessionError);
      // Continue with userId from body if available
    }
    
    if (!userId) {
      return Response.json({ 
        success: false, 
        message: "Authentication required - no user ID found",
        data: null
      }, { status: 401 });
    }
    
    // Get user data
    console.log('Fetching user data for userId:', userId);
    const userData = await getUserData(userId);
    console.log('User data retrieved:', {
      tasksCount: userData?.tasks?.length || 0,
      eventsCount: userData?.events?.length || 0,
      remindersCount: userData?.reminders?.length || 0
    });
    
    // Check if the user is asking about calendar events
    const calendarKeywords = ['calendar', 'schedule', 'event', 'appointment', 'meeting', 'reminder', 'agenda'];
    const messageWords = message.toLowerCase().split(/\s+/);
    
    // Check for calendar-related keywords in the message
    const matchedKeywords = calendarKeywords.filter(keyword => 
      messageWords.some(word => word.includes(keyword)));
    
    const isCalendarQuery = matchedKeywords.length > 0;
    
    console.log('Calendar query detection:', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      matchedKeywords,
      isCalendarQuery
    });
    
    let calendarEvents = [];
    
    // Only fetch calendar events if the user is asking about them
    if (isCalendarQuery) {
      console.log('Calendar-related query detected, fetching calendar events');
      
      // Get access token from session or Authorization header
      let accessToken = session?.accessToken || session?.user?.accessToken;
      console.log('Session access token available:', !!session?.accessToken);
      console.log('User access token available:', !!session?.user?.accessToken);
      
      // If no access token from session, check Authorization header
      if (!accessToken) {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          accessToken = authHeader.substring(7);
          console.log('Using access token from Authorization header');
        }
      }
      
      if (accessToken) {
        console.log('Access token available, fetching calendar events');
        try {
          calendarEvents = await getCalendarEvents(accessToken);
          console.log(`Retrieved ${calendarEvents.length} calendar events`);
          
          // Log the events being sent to Claude
          if (calendarEvents.length > 0) {
            console.log('Calendar events being sent to Claude:', 
              calendarEvents.map(event => ({
                title: event.title,
                date: event.date,
                time: event.time
              })));
          } else {
            console.log('No calendar events to send to Claude');
          }
        } catch (calendarError) {
          console.error('Error fetching calendar events:', calendarError);
          console.log('Continuing with empty calendar events array');
        }
      } else {
        console.log('No access token available for calendar API');
      }
    } else {
      console.log('Not a calendar-related query, skipping calendar API call');
    }
    
    // Generate assistant response with calendar events included
    const assistantResponse = await generateAssistantResponse(message, userData, calendarEvents);
    
    // Process any actions in the response
    await processAssistantActions(assistantResponse, userId);
    
    // Return generated response
    return Response.json({ 
      success: true, 
      data: assistantResponse
    });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json({ 
      success: false, 
      message: error.message,
      data: null
    }, { status: 500 });
  }
}
